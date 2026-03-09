import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttributionCard } from "./types";

function isMetaCampaignId(value: string): boolean {
  return /^\d{10,}$/.test(value.trim());
}

function inferTipoOrigem(card: AttributionCard): string {
  const raw = card.tipoOrigem?.trim();
  if (raw) return raw;

  const fonte = (card.fonte || '').toLowerCase().trim();
  const origem = (card.origemLead || '').toLowerCase();

  // Eventos
  if (fonte.includes('evento') || origem.includes('evento') || fonte.includes('g4') || origem.includes('g4')) return 'Evento';

  // Mídia Paga (Meta)
  if (card.fbclid) return 'Mídia Paga';
  if (card.campanha && isMetaCampaignId(card.campanha)) return 'Mídia Paga';
  if (['ig', 'fb'].includes(fonte) || fonte.includes('facebook') || fonte.includes('instagram') || fonte.includes('meta')) return 'Mídia Paga';

  // Mídia Paga (Google)
  if (card.gclid) return 'Mídia Paga';
  if (fonte === 'googleads' || fonte.includes('google')) return 'Mídia Paga';

  // Indicação
  if (origem.includes('indica')) return 'Indicação';

  // Orgânico
  if (fonte.includes('site') || fonte.includes('organic') || fonte.includes('orgânico') || fonte.includes('organico')) return 'Orgânico';

  return 'Outros';
}

const PHASE_FUNNEL_MAP: Record<string, string> = {
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

const FUNNEL_ORDER = ['leads', 'mqls', 'rms', 'rrs', 'propostas', 'vendas'];

function getCumulativeStages(stage: string): string[] {
  const idx = FUNNEL_ORDER.indexOf(stage);
  return FUNNEL_ORDER.slice(0, idx + 1);
}

interface OrigemRow {
  tipoOrigem: string;
  leads: number;
  mqls: number;
  rms: number;
  rrs: number;
  propostas: number;
  vendas: number;
}

interface ConversionsByChannelChartProps {
  cards: AttributionCard[];
}

export function ConversionsByChannelChart({ cards }: ConversionsByChannelChartProps) {
  const rows = useMemo<OrigemRow[]>(() => {
    // Deduplicate by card id, keeping the most advanced stage
    const cardBest = new Map<string, { tipoOrigem: string; stage: string }>();

    for (const card of cards) {
      const stage = PHASE_FUNNEL_MAP[card.fase] || 'leads';
      const existing = cardBest.get(card.id);
      if (!existing || FUNNEL_ORDER.indexOf(stage) > FUNNEL_ORDER.indexOf(existing.stage)) {
        cardBest.set(card.id, {
          tipoOrigem: inferTipoOrigem(card),
          stage,
        });
      }
    }

    // Aggregate by tipoOrigem with cumulative funnel
    const groups = new Map<string, OrigemRow>();

    for (const { tipoOrigem, stage } of cardBest.values()) {
      if (!groups.has(tipoOrigem)) {
        groups.set(tipoOrigem, { tipoOrigem, leads: 0, mqls: 0, rms: 0, rrs: 0, propostas: 0, vendas: 0 });
      }
      const row = groups.get(tipoOrigem)!;
      for (const s of getCumulativeStages(stage)) {
        (row as any)[s] += 1;
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.leads - a.leads);
  }, [cards]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        leads: acc.leads + r.leads,
        mqls: acc.mqls + r.mqls,
        rms: acc.rms + r.rms,
        rrs: acc.rrs + r.rrs,
        propostas: acc.propostas + r.propostas,
        vendas: acc.vendas + r.vendas,
      }),
      { leads: 0, mqls: 0, rms: 0, rrs: 0, propostas: 0, vendas: 0 }
    );
  }, [rows]);

  const convRate = (leads: number, vendas: number) =>
    leads > 0 ? `${((vendas / leads) * 100).toFixed(1)}%` : '-';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Conversão por Tipo de Origem</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Sem dados de conversão por tipo de origem
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Origem</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">MQLs</TableHead>
                  <TableHead className="text-right">RM</TableHead>
                  <TableHead className="text-right">RR</TableHead>
                  <TableHead className="text-right">Propostas</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Conv. L→V</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.tipoOrigem}>
                    <TableCell className="font-medium">{row.tipoOrigem}</TableCell>
                    <TableCell className="text-right">{row.leads}</TableCell>
                    <TableCell className="text-right">{row.mqls}</TableCell>
                    <TableCell className="text-right">{row.rms}</TableCell>
                    <TableCell className="text-right">{row.rrs}</TableCell>
                    <TableCell className="text-right">{row.propostas}</TableCell>
                    <TableCell className="text-right">{row.vendas}</TableCell>
                    <TableCell className="text-right">{convRate(row.leads, row.vendas)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totals.leads}</TableCell>
                  <TableCell className="text-right">{totals.mqls}</TableCell>
                  <TableCell className="text-right">{totals.rms}</TableCell>
                  <TableCell className="text-right">{totals.rrs}</TableCell>
                  <TableCell className="text-right">{totals.propostas}</TableCell>
                  <TableCell className="text-right">{totals.vendas}</TableCell>
                  <TableCell className="text-right">{convRate(totals.leads, totals.vendas)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
