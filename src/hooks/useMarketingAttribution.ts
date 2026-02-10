import { useMemo } from "react";
import { AttributionCard, CampaignFunnel, ChannelId, ChannelSummary, CampaignData } from "@/components/planning/marketing-indicators/types";

// Phase to funnel stage mapping (same logic as analytics hooks)
const PHASE_FUNNEL_MAP: Record<string, keyof Pick<CampaignFunnel, 'leads' | 'mqls' | 'rms' | 'rrs' | 'propostas' | 'vendas'>> = {
  'Novos Leads': 'leads',
  'Start form': 'leads',
  'MQLs': 'mqls',
  'MQL': 'mqls',
  'Tentativas de contato': 'mqls',
  'Material ISCA': 'mqls',
  'Reunião agendada / Qualificado': 'rms',
  'Reunião Realizada': 'rrs',
  '1° Reunião Realizada - Apresentação': 'rrs',
  '1° Reunião Realizada': 'rrs',
  'Proposta enviada / Follow Up': 'propostas',
  'Enviar para assinatura': 'propostas',
  'Contrato assinado': 'vendas',
};

function isMetaCampaignId(value: string): boolean {
  return /^\d{10,}$/.test(value.trim());
}

function detectChannel(card: AttributionCard): ChannelId {
  // If campanha field contains a Meta campaign ID, it's Meta Ads
  if (card.campanha && isMetaCampaignId(card.campanha)) return 'meta_ads';
  if (card.fbclid) return 'meta_ads';
  if (card.gclid) return 'google_ads';
  
  const fonte = (card.fonte || '').toLowerCase();
  if (fonte.includes('facebook') || fonte.includes('instagram') || fonte.includes('meta')) return 'meta_ads';
  if (fonte.includes('google')) return 'google_ads';
  
  const tipo = (card.tipoOrigem || '').toLowerCase();
  if (tipo.includes('evento')) return 'eventos';
  
  return 'organico';
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useMarketingAttribution(
  allCards: AttributionCard[],
  metaCampaigns: CampaignData[] | null | undefined,
) {
  // Build funnel by campaign
  const campaignFunnels = useMemo(() => {
    if (!allCards.length) return [];
    
    // Group cards by campaign name, tracking highest funnel stage per card
    const cardBestStage = new Map<string, { campaign: string; channel: ChannelId; stages: Set<string>; card: AttributionCard }>();
    
    for (const card of allCards) {
      const stage = PHASE_FUNNEL_MAP[card.fase];
      if (!stage) continue;
      
      const campaign = card.campanha || '(Sem campanha)';
      const key = `${card.id}`;
      
      if (!cardBestStage.has(key)) {
        cardBestStage.set(key, {
          campaign,
          channel: detectChannel(card),
          stages: new Set([stage]),
          card,
        });
      } else {
        cardBestStage.get(key)!.stages.add(stage);
      }
    }
    
    // Group by campaign
    const campaignMap = new Map<string, {
      channel: ChannelId;
      leads: Set<string>;
      mqls: Set<string>;
      rms: Set<string>;
      rrs: Set<string>;
      propostas: Set<string>;
      vendas: Set<string>;
      receita: number;
      tcv: number;
    }>();
    
    for (const [cardId, info] of cardBestStage) {
      const key = info.campaign;
      if (!campaignMap.has(key)) {
        campaignMap.set(key, {
          channel: info.channel,
          leads: new Set(),
          mqls: new Set(),
          rms: new Set(),
          rrs: new Set(),
          propostas: new Set(),
          vendas: new Set(),
          receita: 0,
          tcv: 0,
        });
      }
      const entry = campaignMap.get(key)!;
      
      for (const stage of info.stages) {
        (entry[stage as keyof typeof entry] as Set<string>).add(cardId);
      }
      
      if (info.stages.has('vendas')) {
        entry.receita += (info.card.valorMRR || 0) + (info.card.valorSetup || 0) + (info.card.valorPontual || 0) + (info.card.valorEducacao || 0);
        entry.tcv += ((info.card.valorMRR || 0) * 12) + (info.card.valorSetup || 0) + (info.card.valorPontual || 0);
      }
    }
    
    // Build Meta Ads lookup by ID and by normalized name
    const metaById = new Map<string, CampaignData>();
    const metaByName = new Map<string, CampaignData>();
    if (metaCampaigns) {
      for (const mc of metaCampaigns) {
        metaById.set(mc.id, mc);
        metaByName.set(normalizeName(mc.name), mc);
      }
    }
    
    // Convert to array
    const funnels: CampaignFunnel[] = [];
    for (const [name, data] of campaignMap) {
      // Try matching by ID first, then by name
      let metaCampaign: CampaignData | undefined;
      let campaignId: string | undefined;
      
      if (isMetaCampaignId(name)) {
        metaCampaign = metaById.get(name.trim());
        campaignId = name.trim();
      }
      if (!metaCampaign) {
        metaCampaign = metaByName.get(normalizeName(name));
        if (metaCampaign) campaignId = metaCampaign.id;
      }
      
      const investimento = metaCampaign?.investment || 0;
      const receita = data.receita;
      
      funnels.push({
        campaignName: metaCampaign?.name || name,
        campaignId,
        channel: data.channel,
        leads: data.leads.size,
        mqls: data.mqls.size,
        rms: data.rms.size,
        rrs: data.rrs.size,
        propostas: data.propostas.size,
        vendas: data.vendas.size,
        receita,
        investimento,
        roi: investimento > 0 ? receita / investimento : 0,
        tcv: data.tcv,
      });
    }
    
    // Sort by leads desc
    funnels.sort((a, b) => b.leads - a.leads);
    
    return funnels;
  }, [allCards, metaCampaigns]);

  // Channel summaries
  const channelSummaries = useMemo(() => {
    const channelMap = new Map<ChannelId, ChannelSummary>();
    
    for (const f of campaignFunnels) {
      if (!channelMap.has(f.channel)) {
        channelMap.set(f.channel, {
          channel: f.channel,
          leads: 0, mqls: 0, vendas: 0, receita: 0, investimento: 0, roi: 0,
        });
      }
      const s = channelMap.get(f.channel)!;
      s.leads += f.leads;
      s.mqls += f.mqls;
      s.vendas += f.vendas;
      s.receita += f.receita;
      s.investimento += f.investimento;
    }
    
    // Recalculate ROI
    for (const s of channelMap.values()) {
      s.roi = s.investimento > 0 ? s.receita / s.investimento : 0;
    }
    
    return Array.from(channelMap.values()).sort((a, b) => b.leads - a.leads);
  }, [campaignFunnels]);

  return { campaignFunnels, channelSummaries };
}
