import { useMemo } from "react";
import { AttributionCard, CampaignFunnel, ChannelId, ChannelSummary, CampaignData } from "@/components/planning/marketing-indicators/types";

// Phase to funnel stage mapping (same logic as analytics hooks)
type FunnelStage = 'leads' | 'mqls' | 'rms' | 'rrs' | 'propostas' | 'vendas';

const PHASE_FUNNEL_MAP: Record<string, FunnelStage> = {
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

// Cumulative funnel order: a card at stage X also counts for all earlier stages
const FUNNEL_ORDER: FunnelStage[] = ['leads', 'mqls', 'rms', 'rrs', 'propostas', 'vendas'];

function getCumulativeStages(stage: FunnelStage): FunnelStage[] {
  const idx = FUNNEL_ORDER.indexOf(stage);
  return FUNNEL_ORDER.slice(0, idx + 1);
}

function isMetaCampaignId(value: string): boolean {
  return /^\d{10,}$/.test(value.trim());
}

export function detectChannel(card: AttributionCard): ChannelId {
  const fonte = (card.fonte || '').toLowerCase().trim();
  const tipo = (card.tipoOrigem || '').toLowerCase();
  const origem = (card.origemLead || '').toLowerCase();

  // Eventos tem prioridade - detectar ANTES de Meta/Google
  if (fonte.includes('evento') || tipo.includes('evento') || origem.includes('evento')
    || fonte.includes('g4') || tipo.includes('g4') || origem.includes('g4')) return 'eventos';

  // Meta Ads
  if (card.campanha && isMetaCampaignId(card.campanha)) return 'meta_ads';
  if (card.fbclid) return 'meta_ads';
  if (fonte === 'ig' || fonte === 'fb' || fonte.includes('facebook') || fonte.includes('instagram') || fonte.includes('meta')) return 'meta_ads';

  // Google Ads
  if (card.gclid) return 'google_ads';
  if (fonte === 'googleads' || fonte.includes('google')) return 'google_ads';

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
  allApiCampaigns: CampaignData[] | null | undefined,
) {
  // Build funnel by campaign
  const campaignFunnels = useMemo(() => {
    if (!allCards.length) return [];
    
    
    // Group cards by campaign name, tracking highest funnel stage per card
    const cardBestStage = new Map<string, { campaign: string; channel: ChannelId; stages: Set<string>; card: AttributionCard }>();
    
    for (const card of allCards) {
      const stage = PHASE_FUNNEL_MAP[card.fase] || 'leads'; // Default to leads for unmapped phases
      // Cumulative: a card at "propostas" also counts as leads, mqls, rms, rrs
      const cumulativeStages = getCumulativeStages(stage);
      
      const campaign = card.campanha || '(Sem campanha)';
      const key = `${card.id}`;
      
      if (!cardBestStage.has(key)) {
        cardBestStage.set(key, {
          campaign,
          channel: detectChannel(card),
          stages: new Set(cumulativeStages),
          card,
        });
      } else {
        for (const s of cumulativeStages) {
          cardBestStage.get(key)!.stages.add(s);
        }
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
      // Group by campaign + channel to prevent different channels merging under same campaign name
      const key = `${info.campaign}::${info.channel}`;
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
    
    // Build API campaigns lookup by ID and by normalized name (Meta + Google)
    const campaignById = new Map<string, CampaignData>();
    const campaignByName = new Map<string, CampaignData>();
    if (allApiCampaigns) {
      for (const mc of allApiCampaigns) {
        campaignById.set(mc.id, mc);
        // For Google campaigns (id = "google_123"), also map raw ID "123"
        if (mc.id.startsWith('google_')) {
          campaignById.set(mc.id.replace('google_', ''), mc);
        }
        campaignByName.set(normalizeName(mc.name), mc);
      }
    }
    
    // Convert to array
    const funnels: CampaignFunnel[] = [];
    for (const [compositeKey, data] of campaignMap) {
      // Extract campaign name from composite key "campaignName::channel"
      const name = compositeKey.split('::')[0];
      
      // Try matching by ID first, then by name
      let apiCampaign: CampaignData | undefined;
      let campaignId: string | undefined;
      
      if (isMetaCampaignId(name)) {
        apiCampaign = campaignById.get(name.trim());
        campaignId = name.trim();
      }
      if (!apiCampaign) {
        apiCampaign = campaignById.get(name);
        if (apiCampaign) campaignId = apiCampaign.id;
      }
      if (!apiCampaign) {
        apiCampaign = campaignByName.get(normalizeName(name));
        if (apiCampaign) campaignId = apiCampaign.id;
      }
      // Partial name matching fallback (bidirectional .includes)
      if (!apiCampaign && allApiCampaigns) {
        const normCard = normalizeName(name);
        if (normCard && normCard !== '(sem campanha)') {
          for (const mc of allApiCampaigns) {
            const normApi = normalizeName(mc.name);
            if (normApi.includes(normCard) || normCard.includes(normApi)) {
              apiCampaign = mc;
              campaignId = mc.id;
              break;
            }
          }
        }
      }
      
      // Reclassify channel: if card was "organico" but matched a paid API campaign, fix the channel
      let resolvedChannel = data.channel;
      if (apiCampaign && data.channel === 'organico') {
        const apiChannel = (apiCampaign.channel || '').toLowerCase();
        if (apiChannel.includes('meta') || apiChannel.includes('facebook')) {
          resolvedChannel = 'meta_ads';
        } else if (apiChannel.includes('google')) {
          resolvedChannel = 'google_ads';
        }
      }
      
      // Organic/direct channels have no media investment by definition
      const investimento = resolvedChannel === 'organico' ? 0 : (apiCampaign?.investment || 0);
      const receita = data.receita;
      
      funnels.push({
        campaignName: apiCampaign?.name || name,
        campaignId,
        channel: resolvedChannel,
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
  }, [allCards, allApiCampaigns]);

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
