import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DetailItem } from "@/components/planning/indicators/DetailSheet";

export interface O2TaxCard {
  id: string;
  titulo: string;
  faseAtual: string;
  fase: string;
  faixa: string | null;
  valor: number;
  valorMRR: number;
  valorPontual: number;
  valorSetup: number;
  responsavel: string | null;
  closer: string; // Fixed: "Lucas" for O2 TAX
  sdr: string; // Fixed: "Carlos" for O2 TAX
  motivoPerda: string | null;
  dataEntrada: Date;
  dataSaida: Date | null; // "Saída" from database
  contato: string | null;
  setor: string | null;
  duracao: number; // Duration calculated dynamically from Entrada/Saída
}

interface PhaseData {
  phase: string;
  count: number;
  cards: O2TaxCard[];
  color: string;
}

interface RevenueRangeData {
  range: string;
  count: number;
  percentage: number;
  cards: O2TaxCard[];
  color: string;
}

interface LossReasonData {
  reason: string;
  count: number;
  percentage: number;
  cards: O2TaxCard[];
  color: string;
}

// Map internal phase to display phase
const PHASE_DISPLAY_MAP: Record<string, string> = {
  'MQL': 'MQL',
  'Reunião agendada / Qualificado': 'RM',
  '1° Reunião Realizada - Apresentação': 'RR',
  'Proposta enviada / Follow Up': 'Proposta',
  'Enviar para assinatura': 'Assinatura',
  'Ganho': 'Ganho',
  'Perdido': 'Perdido',
  'Arquivado': 'Arquivado',
};

// Active phases (not lost/won)
const ACTIVE_PHASES = [
  'Reunião agendada / Qualificado',
  '1° Reunião Realizada - Apresentação',
  'Proposta enviada / Follow Up',
  'Enviar para assinatura',
];

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function parseDate(dateValue: string | null): Date | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
}

export function useO2TaxAnalytics(startDate: Date, endDate: Date) {
  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

  // Use the SAME data source and cache as useO2TaxMetas for consistency
  // Both hooks share queryKey ['o2tax-movements-all'] and return { movements: [] }
  const { data, isLoading, error } = useQuery({
    queryKey: ['o2tax-movements-all'],
    queryFn: async () => {
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
        body: { 
          table: 'pipefy_cards_movements', 
          action: 'preview', 
          limit: 5000 
        }
      });

      if (fetchError) {
        console.error('Error fetching O2 TAX movements:', fetchError);
        throw fetchError;
      }

      if (!responseData?.data) {
        return { movements: [] };
      }

      console.log(`[O2 TAX Analytics] Loaded ${responseData.data.length} movements`);

      // Return movements in the SAME structure as useO2TaxMetas
      // O2 TAX has fixed team: Lucas (closer) and Carlos (SDR)
      const movements = responseData.data.map((row: any) => ({
        id: String(row.ID),
        titulo: row['Título'] || '',
        fase: row['Fase'] || '',
        faseAtual: row['Fase Atual'] || '',
        dataEntrada: parseDate(row['Entrada']) || new Date(),
        dataSaida: parseDate(row['Saída']),
        valorMRR: row['Valor MRR'] ? parseFloat(row['Valor MRR']) : null,
        valorPontual: row['Valor Pontual'] ? parseFloat(row['Valor Pontual']) : null,
        valorSetup: row['Valor Setup'] ? parseFloat(row['Valor Setup']) : null,
        faixa: row['Faixa de faturamento mensal'] || null,
        responsavel: 'Lucas', // Fixed for O2 TAX
        closer: 'Lucas', // Fixed for O2 TAX
        sdr: 'Carlos', // Fixed for O2 TAX
        motivoPerda: row['Motivo da perda'] || null,
        contato: row['Nome - Interlocução O2'] || row['Nome'] || null,
        setor: row['Setor'] || null,
      }));

      return { movements };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Transform movements into O2TaxCards for drill-down (processed via useMemo)
  const cards: O2TaxCard[] = useMemo(() => {
    if (!data?.movements) return [];
    
    return data.movements.map((mov: any) => {
      const dataEntrada = mov.dataEntrada instanceof Date ? mov.dataEntrada : new Date(mov.dataEntrada);
      const dataSaida = mov.dataSaida ? (mov.dataSaida instanceof Date ? mov.dataSaida : new Date(mov.dataSaida)) : null;
      
      // Calculate duration dynamically
      let duracao = 0;
      if (dataSaida) {
        duracao = Math.floor((dataSaida.getTime() - dataEntrada.getTime()) / 1000);
      } else {
        duracao = Math.floor((Date.now() - dataEntrada.getTime()) / 1000);
      }
      
      const valorPontual = mov.valorPontual || 0;
      const valorSetup = mov.valorSetup || 0;
      const valorMRR = mov.valorMRR || 0;
      
      return {
        id: mov.id,
        titulo: mov.titulo,
        fase: mov.fase,
        faseAtual: mov.faseAtual,
        faixa: mov.faixa || null,
        valorMRR,
        valorPontual,
        valorSetup,
        valor: valorPontual + valorSetup + valorMRR,
        responsavel: 'Lucas', // Fixed for O2 TAX
        closer: 'Lucas', // Fixed for O2 TAX
        sdr: 'Carlos', // Fixed for O2 TAX
        motivoPerda: mov.motivoPerda || null,
        dataEntrada,
        dataSaida,
        contato: mov.contato || null,
        setor: mov.setor || null,
        duracao,
      } as O2TaxCard;
    });
  }, [data?.movements]);

  // Filter cards by period
  const cardsInPeriod = useMemo(() => {
    return cards.filter(card => {
      const entryTime = card.dataEntrada.getTime();
      return entryTime >= startTime && entryTime <= endTime;
    });
  }, [cards, startTime, endTime]);

  // Get unique cards by current phase
  const getCardsByPhase = useMemo((): PhaseData[] => {
    const phaseMap = new Map<string, O2TaxCard[]>();
    const uniqueCards = new Map<string, O2TaxCard>();
    
    // Get unique cards
    for (const card of cards) {
      if (!uniqueCards.has(card.id)) {
        uniqueCards.set(card.id, card);
      }
    }
    
    // Group by current phase
    for (const card of uniqueCards.values()) {
      const displayPhase = PHASE_DISPLAY_MAP[card.faseAtual] || card.faseAtual;
      if (!phaseMap.has(displayPhase)) {
        phaseMap.set(displayPhase, []);
      }
      phaseMap.get(displayPhase)!.push(card);
    }
    
    const phaseOrder = ['MQL', 'RM', 'RR', 'Proposta', 'Assinatura', 'Ganho', 'Perdido', 'Arquivado'];
    
    return phaseOrder
      .filter(phase => phaseMap.has(phase))
      .map((phase, index) => ({
        phase,
        count: phaseMap.get(phase)!.length,
        cards: phaseMap.get(phase)!,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));
  }, [cards]);

  // Get deals in progress (active phases, not lost/won)
  const getDealsInProgress = useMemo(() => {
    const uniqueCards = new Map<string, O2TaxCard>();
    
    for (const card of cards) {
      if (ACTIVE_PHASES.includes(card.faseAtual) && !uniqueCards.has(card.id)) {
        uniqueCards.set(card.id, card);
      }
    }
    
    const dealsArray = Array.from(uniqueCards.values());
    const totalValue = dealsArray.reduce((sum, card) => sum + card.valor, 0);
    
    // Group by display phase for pie chart
    const byPhase = new Map<string, number>();
    for (const card of dealsArray) {
      const displayPhase = PHASE_DISPLAY_MAP[card.faseAtual] || card.faseAtual;
      byPhase.set(displayPhase, (byPhase.get(displayPhase) || 0) + 1);
    }
    
    const phaseData = Array.from(byPhase.entries()).map(([phase, value], index) => ({
      phase,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
    
    return {
      count: dealsArray.length,
      totalValue,
      cards: dealsArray,
      phaseData,
    };
  }, [cards]);

  // Get deals won in period
  const getDealsWon = useMemo(() => {
    const wonCards: O2TaxCard[] = [];
    const seenIds = new Set<string>();
    
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (
        card.fase === 'Ganho' &&
        entryTime >= startTime &&
        entryTime <= endTime &&
        !seenIds.has(card.id)
      ) {
        wonCards.push(card);
        seenIds.add(card.id);
      }
    }
    
    const totalValue = wonCards.reduce((sum, card) => sum + card.valor, 0);
    
    return {
      count: wonCards.length,
      totalValue,
      trend: 0, // Would need previous period data to calculate
      cards: wonCards,
    };
  }, [cards, startTime, endTime]);

  // Get meetings (RM) by revenue range
  const getMeetingsByRevenue = useMemo((): RevenueRangeData[] => {
    const rangeMap = new Map<string, O2TaxCard[]>();
    const seenIds = new Set<string>();
    
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (
        card.fase === 'Reunião agendada / Qualificado' &&
        entryTime >= startTime &&
        entryTime <= endTime &&
        !seenIds.has(card.id)
      ) {
        const range = card.faixa || 'Não informado';
        if (!rangeMap.has(range)) {
          rangeMap.set(range, []);
        }
        rangeMap.get(range)!.push(card);
        seenIds.add(card.id);
      }
    }
    
    const total = Array.from(rangeMap.values()).reduce((sum, arr) => sum + arr.length, 0);
    
    return Array.from(rangeMap.entries())
      .map(([range, cards], index) => ({
        range,
        count: cards.length,
        percentage: total > 0 ? Math.round((cards.length / total) * 100) : 0,
        cards,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [cards, startTime, endTime]);

  // Get no shows (RM without RR in period)
  const getNoShows = useMemo(() => {
    const rmCards = new Set<string>();
    const rrCards = new Set<string>();
    
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (entryTime >= startTime && entryTime <= endTime) {
        if (card.fase === 'Reunião agendada / Qualificado') {
          rmCards.add(card.id);
        }
        if (card.fase === '1° Reunião Realizada - Apresentação') {
          rrCards.add(card.id);
        }
      }
    }
    
    const noShowIds = Array.from(rmCards).filter(id => !rrCards.has(id));
    const noShowCards = noShowIds
      .map(id => cards.find(c => c.id === id))
      .filter((c): c is O2TaxCard => c !== undefined);
    
    const rate = rmCards.size > 0 ? Math.round((noShowIds.length / rmCards.size) * 100) : 0;
    
    return {
      count: noShowIds.length,
      rate,
      totalMeetings: rmCards.size,
      cards: noShowCards,
    };
  }, [cards, startTime, endTime]);

  // Get lost deals in period
  const getLostDeals = useMemo(() => {
    const lostCards: O2TaxCard[] = [];
    const seenIds = new Set<string>();
    
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (
        (card.fase === 'Perdido' || card.fase === 'Arquivado' || card.faseAtual === 'Perdido' || card.faseAtual === 'Arquivado') &&
        entryTime >= startTime &&
        entryTime <= endTime &&
        !seenIds.has(card.id)
      ) {
        lostCards.push(card);
        seenIds.add(card.id);
      }
    }
    
    const totalValue = lostCards.reduce((sum, card) => sum + card.valor, 0);
    
    return {
      count: lostCards.length,
      totalValue,
      trend: 0,
      cards: lostCards,
    };
  }, [cards, startTime, endTime]);

  // Get loss reasons grouped
  const getLossReasons = useMemo((): LossReasonData[] => {
    const reasonMap = new Map<string, O2TaxCard[]>();
    const seenIds = new Set<string>();
    
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (
        (card.fase === 'Perdido' || card.fase === 'Arquivado' || card.faseAtual === 'Perdido' || card.faseAtual === 'Arquivado') &&
        entryTime >= startTime &&
        entryTime <= endTime &&
        !seenIds.has(card.id)
      ) {
        const reason = card.motivoPerda || 'Não informado';
        if (!reasonMap.has(reason)) {
          reasonMap.set(reason, []);
        }
        reasonMap.get(reason)!.push(card);
        seenIds.add(card.id);
      }
    }
    
    const total = Array.from(reasonMap.values()).reduce((sum, arr) => sum + arr.length, 0);
    
    return Array.from(reasonMap.entries())
      .map(([reason, cards], index) => ({
        reason,
        count: cards.length,
        percentage: total > 0 ? Math.round((cards.length / total) * 100) : 0,
        cards,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [cards, startTime, endTime]);

  // Get MQLs by revenue range (using cards that entered pipeline)
  const getMqlsByRevenue = useMemo((): RevenueRangeData[] => {
    const rangeMap = new Map<string, O2TaxCard[]>();
    const uniqueCards = new Map<string, O2TaxCard>();
    
    // Get unique cards in period that entered via MQL phase
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (
        card.fase === 'MQL' &&
        entryTime >= startTime && 
        entryTime <= endTime && 
        !uniqueCards.has(card.id)
      ) {
        uniqueCards.set(card.id, card);
      }
    }
    
    // Group by revenue range
    for (const card of uniqueCards.values()) {
      const range = card.faixa || 'Não informado';
      if (!rangeMap.has(range)) {
        rangeMap.set(range, []);
      }
      rangeMap.get(range)!.push(card);
    }
    
    const total = uniqueCards.size;
    
    return Array.from(rangeMap.entries())
      .map(([range, cards], index) => ({
        range,
        count: cards.length,
        percentage: total > 0 ? Math.round((cards.length / total) * 100) : 0,
        cards,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [cards, startTime, endTime]);

  // Get leads (cards that entered via "Start form" OR "MQL" in the period)
  const getLeads = useMemo(() => {
    const leadsCards: O2TaxCard[] = [];
    const seenIds = new Set<string>();
    
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (
        (card.fase === 'Start form' || card.fase === 'MQL') &&
        entryTime >= startTime &&
        entryTime <= endTime &&
        !seenIds.has(card.id)
      ) {
        leadsCards.push(card);
        seenIds.add(card.id);
      }
    }
    
    return leadsCards;
  }, [cards, startTime, endTime]);

  // Get detail items for a specific indicator (for drill-down)
  // ALIGNED with useO2TaxMetas logic for consistency
  const getDetailItemsForIndicator = (indicator: string): DetailItem[] => {
    const targetCards: O2TaxCard[] = [];
    const seenIds = new Set<string>();
    
    // Map indicator to Pipefy phases (same as PHASE_TO_INDICATOR in useO2TaxMetas)
    const PHASE_TO_INDICATOR_MAP: Record<string, string> = {
      'Start form': 'leads',
      'MQL': 'mql',
      'Reunião agendada / Qualificado': 'rm',
      '1° Reunião Realizada - Apresentação': 'rr',
      'Proposta enviada / Follow Up': 'proposta',
      'Enviar para assinatura': 'proposta',
      'Ganho': 'venda',
    };
    
    // Filter cards using the SAME logic as useO2TaxMetas.getQtyForPeriod
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (entryTime < startTime || entryTime > endTime) continue;
      if (seenIds.has(card.id)) continue;
      
      const movementIndicator = PHASE_TO_INDICATOR_MAP[card.fase];
      let matches = false;
      
      if (indicator === 'leads') {
        // For "leads", count unique cards that entered via "Start form" OR "MQL"
        if (card.fase === 'Start form' || card.fase === 'MQL') {
          matches = true;
        }
      } else if (indicator === 'venda') {
        // For "venda", count unique cards that ENTERED "Ganho" phase
        if (card.fase === 'Ganho') {
          matches = true;
        }
      } else if (indicator === 'proposta') {
        // For "proposta", count ONLY cards that explicitly passed through proposta phases
        if (movementIndicator === 'proposta') {
          matches = true;
        }
      } else {
        // For other indicators, count unique cards that passed through the phase
        if (movementIndicator === indicator) {
          matches = true;
        }
      }
      
      if (matches) {
        seenIds.add(card.id);
        targetCards.push(card);
      }
    }
    
    console.log(`[O2 TAX Analytics] getDetailItemsForIndicator(${indicator}): ${targetCards.length} unique cards in period`);
    return targetCards.map(toDetailItem);
  };

  // Helper function to convert O2TaxCard to DetailItem
  // O2 TAX has fixed team: Lucas (closer) and Carlos (SDR)
  const toDetailItem = (card: O2TaxCard): DetailItem => ({
    id: card.id,
    name: card.titulo,
    company: card.contato || card.titulo,
    phase: PHASE_DISPLAY_MAP[card.faseAtual] || card.faseAtual,
    date: card.dataEntrada.toISOString(),
    value: card.valor,
    reason: card.motivoPerda || undefined,
    revenueRange: card.faixa || undefined,
    responsible: 'Lucas', // Fixed for O2 TAX
    closer: 'Lucas', // Fixed for O2 TAX
    sdr: 'Carlos', // Fixed for O2 TAX
    duration: card.duracao,
    product: 'O2 TAX',
    mrr: card.valorMRR,
    setup: card.valorSetup,
    pontual: card.valorPontual,
  });

  return {
    isLoading,
    error,
    getCardsByPhase,
    getDealsInProgress,
    getDealsWon,
    getMeetingsByRevenue,
    getNoShows,
    getLostDeals,
    getLossReasons,
    getMqlsByRevenue,
    getLeads,
    getDetailItemsForIndicator,
    toDetailItem,
  };
}
