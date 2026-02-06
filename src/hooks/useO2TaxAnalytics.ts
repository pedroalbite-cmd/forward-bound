import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DetailItem } from "@/components/planning/indicators/DetailSheet";
import { IndicatorType } from "@/hooks/useFunnelRealized";

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
  closer: string; // "Closer responsável" field for filtering
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
  'Contrato assinado': 'Contrato Assinado',
  'Ganho': 'Ganho',
  'Perdido': 'Perdido',
  'Arquivado': 'Arquivado',
};

// Map Pipefy phase to indicator type
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  'Start form': 'leads',
  'MQL': 'mql',
  'Reunião agendada / Qualificado': 'rm',
  '1° Reunião Realizada - Apresentação': 'rr',
  'Proposta enviada / Follow Up': 'proposta',
  'Enviar para assinatura': 'proposta',
  'Contrato assinado': 'venda',
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

function parseRawCard(row: any): O2TaxCard {
  const dataEntrada = parseDate(row['Entrada']) || new Date();
  const dataSaida = parseDate(row['Saída']);
  
  // Calculate duration dynamically
  let duracao = 0;
  if (dataSaida) {
    duracao = Math.floor((dataSaida.getTime() - dataEntrada.getTime()) / 1000);
  } else {
    duracao = Math.floor((Date.now() - dataEntrada.getTime()) / 1000);
  }
  
  const valorPontual = row['Valor Pontual'] ? parseFloat(row['Valor Pontual']) : 0;
  const valorSetup = row['Valor Setup'] ? parseFloat(row['Valor Setup']) : 0;
  const valorMRR = row['Valor MRR'] ? parseFloat(row['Valor MRR']) : 0;
  
  return {
    id: String(row.ID),
    titulo: row['Título'] || '',
    fase: row['Fase'] || '',
    faseAtual: row['Fase Atual'] || '',
    faixa: row['Faixa de faturamento mensal'] || null,
    valorMRR,
    valorPontual,
    valorSetup,
    valor: valorPontual + valorSetup + valorMRR,
    responsavel: row['SDR responsável'] || null,
    closer: String(row['Closer responsável'] ?? '').trim(),
    motivoPerda: row['Motivo da perda'] || null,
    dataEntrada,
    dataSaida,
    contato: row['Nome - Interlocução O2'] || row['Nome'] || null,
    setor: row['Setor'] || null,
    duracao,
  };
}

export function useO2TaxAnalytics(startDate: Date, endDate: Date) {
  // Memoize date strings to prevent queryKey instability (fixes "Should have a queue" error)
  const startDateStr = useMemo(() => startDate.toISOString().split('T')[0], [startDate.getTime()]);
  const endDateStr = useMemo(() => endDate.toISOString().split('T')[0], [endDate.getTime()]);
  
  const startTime = useMemo(() => 
    new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime(), 
    [startDate.getTime()]
  );
  const endTime = useMemo(() => 
    new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime(), 
    [endDate.getTime()]
  );

  // Use DIFFERENT query key to avoid cache collision with useO2TaxMetas
  // This ensures closer/sdr fields are preserved in the data
  const { data, isLoading, error } = useQuery({
    queryKey: ['o2tax-movements-analytics', startDateStr, endDateStr],
    queryFn: async () => {
      // Step 1: Fetch movements in the selected period
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
        body: { 
          table: 'pipefy_cards_movements', 
          action: 'query_period',
          startDate: `${startDateStr}T00:00:00`,
          endDate: `${endDateStr}T23:59:59`,
          limit: 10000 
        }
      });

      if (fetchError) {
        console.error('Error fetching O2 TAX movements:', fetchError);
        throw fetchError;
      }

      if (!responseData?.data) {
        return { cards: [], fullHistory: [] };
      }

      console.log(`[O2 TAX Analytics] Period query returned ${responseData.data.length} movements`);
      
      const cards = responseData.data.map(parseRawCard);

      // Step 2: Get unique card IDs from period
      const uniqueCardIds = [...new Set(cards.map((c: O2TaxCard) => c.id))];
      
      // Step 3: Fetch full history for these cards
      let fullHistory: O2TaxCard[] = [];
      if (uniqueCardIds.length > 0) {
        const { data: historyData, error: historyError } = await supabase.functions.invoke('query-external-db', {
          body: { 
            table: 'pipefy_cards_movements', 
            action: 'query_card_history',
            cardIds: uniqueCardIds
          }
        });
        
        if (!historyError && historyData?.data) {
          fullHistory = historyData.data.map(parseRawCard);
          console.log(`[O2 TAX Analytics] Full history: ${fullHistory.length} movements for ${uniqueCardIds.length} cards`);
        }
      }

      return { cards, fullHistory };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
  });

  const cards = data?.cards ?? [];
  const fullHistory = data?.fullHistory ?? [];

  // Build a map of FIRST entry for EACH indicator per card (using full history)
  // This is used to determine if the card's first entry in a phase was in the selected period
  const firstEntryByCardAndIndicator = useMemo(() => {
    const firstEntries = new Map<string, Map<IndicatorType, O2TaxCard>>();
    const historyToUse = fullHistory.length > 0 ? fullHistory : cards;
    
    for (const card of historyToUse) {
      const indicator = PHASE_TO_INDICATOR[card.fase];
      if (!indicator) continue;
      
      if (!firstEntries.has(card.id)) {
        firstEntries.set(card.id, new Map());
      }
      
      const cardMap = firstEntries.get(card.id)!;
      const existing = cardMap.get(indicator);
      
      // Keep the EARLIEST entry for this indicator
      if (!existing || card.dataEntrada < existing.dataEntrada) {
        cardMap.set(indicator, card);
      }
    }
    
    console.log(`[O2 TAX Analytics] Built first entry map for ${firstEntries.size} cards`);
    return firstEntries;
  }, [cards, fullHistory]);

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

  // Get deals won in period (using first entry logic)
  const getDealsWon = useMemo(() => {
    const wonCards: O2TaxCard[] = [];
    const seenIds = new Set<string>();
    
    for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
      const firstVenda = indicatorMap.get('venda');
      if (!firstVenda) continue;
      
      const entryTime = firstVenda.dataEntrada.getTime();
      if (entryTime >= startTime && entryTime <= endTime && !seenIds.has(cardId)) {
        wonCards.push(firstVenda);
        seenIds.add(cardId);
      }
    }
    
    const totalValue = wonCards.reduce((sum, card) => sum + card.valor, 0);
    
    return {
      count: wonCards.length,
      totalValue,
      trend: 0, // Would need previous period data to calculate
      cards: wonCards,
    };
  }, [firstEntryByCardAndIndicator, startTime, endTime]);

  // Get meetings (RM) by revenue range (using first entry logic)
  const getMeetingsByRevenue = useMemo((): RevenueRangeData[] => {
    const rangeMap = new Map<string, O2TaxCard[]>();
    const seenIds = new Set<string>();
    
    for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
      const firstRM = indicatorMap.get('rm');
      if (!firstRM) continue;
      
      const entryTime = firstRM.dataEntrada.getTime();
      if (entryTime >= startTime && entryTime <= endTime && !seenIds.has(cardId)) {
        const range = firstRM.faixa || 'Não informado';
        if (!rangeMap.has(range)) {
          rangeMap.set(range, []);
        }
        rangeMap.get(range)!.push(firstRM);
        seenIds.add(cardId);
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
  }, [firstEntryByCardAndIndicator, startTime, endTime]);

  // Get no shows (RM without RR in period)
  const getNoShows = useMemo(() => {
    const rmCards = new Set<string>();
    const rrCards = new Set<string>();
    
    for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
      const firstRM = indicatorMap.get('rm');
      const firstRR = indicatorMap.get('rr');
      
      if (firstRM) {
        const entryTime = firstRM.dataEntrada.getTime();
        if (entryTime >= startTime && entryTime <= endTime) {
          rmCards.add(cardId);
        }
      }
      
      if (firstRR) {
        const entryTime = firstRR.dataEntrada.getTime();
        if (entryTime >= startTime && entryTime <= endTime) {
          rrCards.add(cardId);
        }
      }
    }
    
    const noShowIds = Array.from(rmCards).filter(id => !rrCards.has(id));
    const noShowCards = noShowIds
      .map(id => {
        const indicatorMap = firstEntryByCardAndIndicator.get(id);
        return indicatorMap?.get('rm');
      })
      .filter((c): c is O2TaxCard => c !== undefined);
    
    const rate = rmCards.size > 0 ? Math.round((noShowIds.length / rmCards.size) * 100) : 0;
    
    return {
      count: noShowIds.length,
      rate,
      totalMeetings: rmCards.size,
      cards: noShowCards,
    };
  }, [firstEntryByCardAndIndicator, startTime, endTime]);

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

  // Get MQLs by revenue range (using first entry logic)
  const getMqlsByRevenue = useMemo((): RevenueRangeData[] => {
    const rangeMap = new Map<string, O2TaxCard[]>();
    const seenIds = new Set<string>();
    
    for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
      const firstMQL = indicatorMap.get('mql');
      if (!firstMQL) continue;
      
      const entryTime = firstMQL.dataEntrada.getTime();
      if (entryTime >= startTime && entryTime <= endTime && !seenIds.has(cardId)) {
        const range = firstMQL.faixa || 'Não informado';
        if (!rangeMap.has(range)) {
          rangeMap.set(range, []);
        }
        rangeMap.get(range)!.push(firstMQL);
        seenIds.add(cardId);
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
  }, [firstEntryByCardAndIndicator, startTime, endTime]);

  // Get leads (using first entry logic)
  const getLeads = useMemo(() => {
    const leadsCards: O2TaxCard[] = [];
    const seenIds = new Set<string>();
    
    for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
      // For leads, check both 'leads' and 'mql' indicators
      const firstLeads = indicatorMap.get('leads');
      const firstMQL = indicatorMap.get('mql');
      
      // Use the earliest between leads and mql
      let firstEntry: O2TaxCard | undefined;
      if (firstLeads && firstMQL) {
        firstEntry = firstLeads.dataEntrada < firstMQL.dataEntrada ? firstLeads : firstMQL;
      } else {
        firstEntry = firstLeads || firstMQL;
      }
      
      if (!firstEntry) continue;
      
      const entryTime = firstEntry.dataEntrada.getTime();
      if (entryTime >= startTime && entryTime <= endTime && !seenIds.has(cardId)) {
        leadsCards.push(firstEntry);
        seenIds.add(cardId);
      }
    }
    
    return leadsCards;
  }, [firstEntryByCardAndIndicator, startTime, endTime]);

  // Get cards for a specific indicator (using FIRST ENTRY logic)
  // This is the main function that ensures counts match drill-down
  const getCardsForIndicator = useMemo(() => {
    return (indicator: IndicatorType): O2TaxCard[] => {
      const uniqueCards = new Map<string, O2TaxCard>();
      
      // For LEADS indicator: union of leads + mql phases
      const indicatorsToCheck = indicator === 'leads' 
        ? ['leads', 'mql'] as IndicatorType[]
        : [indicator];
      
      for (const ind of indicatorsToCheck) {
        for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
          const firstEntry = indicatorMap.get(ind);
          if (!firstEntry) continue;
          
          const entryTime = firstEntry.dataEntrada.getTime();
          
          // Only include if FIRST entry was in selected period
          if (entryTime >= startTime && entryTime <= endTime) {
            const existing = uniqueCards.get(cardId);
            if (!existing || firstEntry.dataEntrada < existing.dataEntrada) {
              uniqueCards.set(cardId, firstEntry);
            }
          }
        }
      }
      
      console.log(`[O2 TAX Analytics] getCardsForIndicator(${indicator}): ${uniqueCards.size} cards (first entry in period)`);
      return Array.from(uniqueCards.values());
    };
  }, [firstEntryByCardAndIndicator, startTime, endTime]);

  // Get detail items for a specific indicator (for drill-down)
  // Uses the same FIRST ENTRY logic as getCardsForIndicator
  const getDetailItemsForIndicator = useMemo(() => {
    return (indicator: string): DetailItem[] => {
      const indicatorCards = getCardsForIndicator(indicator as IndicatorType);
      return indicatorCards.map(toDetailItem);
    };
  }, [getCardsForIndicator]);

  // Helper function to convert O2TaxCard to DetailItem
  const toDetailItem = (card: O2TaxCard): DetailItem => ({
    id: card.id,
    name: card.titulo,
    company: card.contato || card.titulo,
    phase: PHASE_DISPLAY_MAP[card.faseAtual] || card.faseAtual,
    date: card.dataEntrada.toISOString(),
    value: card.valor,
    reason: card.motivoPerda || undefined,
    revenueRange: card.faixa || undefined,
    responsible: card.responsavel || undefined,
    closer: card.closer || undefined,
    sdr: card.responsavel || undefined, // SDR field for O2 TAX (maps to "SDR responsável")
    duration: card.duracao,
    product: 'O2 TAX',
    mrr: card.valorMRR,
    setup: card.valorSetup,
    pontual: card.valorPontual,
  });

  // COHORT MODE: Get cards with full history for tier conversion analysis
  // Step 1: Identify all card IDs that had ANY movement in the selected period
  // Step 2: For those cards, include ALL their movements regardless of date
  const getCardsWithFullHistory = useMemo(() => {
    // Find all card IDs with movement in period
    const activeCardIds = new Set<string>();
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (entryTime >= startTime && entryTime <= endTime) {
        activeCardIds.add(card.id);
      }
    }
    
    // Return all movements for active cards (regardless of date)
    const cardHistories = new Map<string, O2TaxCard[]>();
    const historyToUse = fullHistory.length > 0 ? fullHistory : cards;
    for (const card of historyToUse) {
      if (activeCardIds.has(card.id)) {
        if (!cardHistories.has(card.id)) {
          cardHistories.set(card.id, []);
        }
        cardHistories.get(card.id)!.push(card);
      }
    }
    
    console.log(`[O2 TAX Analytics] Cohort mode: ${activeCardIds.size} unique cards with full history`);
    return cardHistories;
  }, [cards, fullHistory, startTime, endTime]);

  // Get detail items for indicator using FULL history (for cohort mode tier conversion)
  const getDetailItemsWithFullHistory = useMemo(() => {
    return (indicator: string): DetailItem[] => {
      const result: DetailItem[] = [];
      const seenIds = new Set<string>();
      
      const cardHistories = getCardsWithFullHistory;
      
      for (const [cardId, movements] of cardHistories.entries()) {
        if (seenIds.has(cardId)) continue;
        
        // Find movement matching the indicator
        const matchingMovement = movements.find(m => {
          const movementIndicator = PHASE_TO_INDICATOR[m.fase];
          
          if (indicator === 'leads') {
            return m.fase === 'Start form' || m.fase === 'MQL';
          } else if (indicator === 'venda') {
            return m.fase === 'Contrato assinado';
          } else if (indicator === 'proposta') {
            return movementIndicator === 'proposta';
          }
          return movementIndicator === indicator;
        });
        
        if (matchingMovement) {
          seenIds.add(cardId);
          result.push(toDetailItem(matchingMovement));
        }
      }
      
      console.log(`[O2 TAX Analytics] getDetailItemsWithFullHistory(${indicator}): ${result.length} unique cards`);
      return result;
    };
  }, [getCardsWithFullHistory]);

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
    getCardsForIndicator,
    getDetailItemsForIndicator,
    getDetailItemsWithFullHistory,
    toDetailItem,
  };
}
