import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DetailItem } from "@/components/planning/indicators/DetailSheet";
import { IndicatorType } from "@/hooks/useFunnelRealized";

export interface ExpansaoCard {
  id: string;
  titulo: string;
  fase: string;
  faseAtual: string;
  dataEntrada: Date;
  dataSaida: Date | null; // "Saída" from database
  valor: number;
  taxaFranquia: number;
  valorMRR: number;
  valorPontual: number;
  valorSetup: number;
  produto: string;
  responsavel: string | null;
  motivoPerda: string | null;
  duracao: number; // Duration calculated dynamically from Entrada/Saída
}

// Map Pipefy phase names to indicator keys
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  'Start form': 'leads',
  'MQL': 'mql',
  'Reunião agendada / Qualificado': 'rm',
  'Reunião Realizada': 'rr',
  'Proposta enviada / Follow Up': 'proposta',
  'Enviar para assinatura': 'proposta',
  'Contrato assinado': 'venda',
};

// Map indicator to phase display name
const INDICATOR_TO_DISPLAY: Record<IndicatorType, string> = {
  'leads': 'Leads',
  'mql': 'MQL',
  'rm': 'RM',
  'rr': 'RR',
  'proposta': 'Proposta',
  'venda': 'Ganho',
};

// Map phase to display name
const PHASE_DISPLAY_MAP: Record<string, string> = {
  'Start form': 'Lead',
  'MQL': 'MQL',
  'Reunião agendada / Qualificado': 'RM',
  'Reunião Realizada': 'RR',
  'Proposta enviada / Follow Up': 'Proposta',
  'Enviar para assinatura': 'Assinatura',
  'Contrato assinado': 'Contrato Assinado',
  'Ganho': 'Ganho',
  'Perdido': 'Perdido',
  'Arquivado': 'Arquivado',
};

function parseDate(dateValue: string | null): Date | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
}

function parseRawCard(row: any, defaultTicket: number): ExpansaoCard {
  const id = String(row.ID);
  const dataEntrada = parseDate(row['Entrada']) || new Date();
  const dataSaida = parseDate(row['Saída']);
  
  // Calculate duration dynamically
  let duracao = 0;
  if (dataSaida) {
    duracao = Math.floor((dataSaida.getTime() - dataEntrada.getTime()) / 1000);
  } else {
    duracao = Math.floor((Date.now() - dataEntrada.getTime()) / 1000);
  }
  
  const taxaFranquia = row['Taxa de franquia'] ? parseFloat(row['Taxa de franquia']) : 0;
  const valorMRR = row['Valor MRR'] ? parseFloat(row['Valor MRR']) : 0;
  const valorPontual = row['Valor Pontual'] ? parseFloat(row['Valor Pontual']) : 0;
  const valorSetup = row['Valor Setup'] ? parseFloat(row['Valor Setup']) : 0;
  
  // Calculate value: prioritize taxaFranquia, then sum of values, then default
  let valor = taxaFranquia;
  if (valor <= 0) {
    const sumValues = valorPontual + valorSetup + valorMRR;
    valor = sumValues > 0 ? sumValues : defaultTicket;
  }
  
  return {
    id,
    titulo: row['Título'] || '',
    fase: row['Fase'] || '',
    faseAtual: row['Fase Atual'] || '',
    dataEntrada,
    dataSaida,
    valor,
    taxaFranquia,
    valorMRR,
    valorPontual,
    valorSetup,
    produto: row['Produtos'] || '',
    responsavel: row['Closer responsável'] || row['SDR responsável'] || null,
    motivoPerda: row['Motivo da perda'] || null,
    duracao,
  };
}

export function useExpansaoAnalytics(startDate: Date, endDate: Date, produto: 'Franquia' | 'Oxy Hacker' = 'Franquia') {
  const startDateStr = useMemo(() => startDate.toISOString().split('T')[0], [startDate.getTime()]);
  const endDateStr = useMemo(() => endDate.toISOString().split('T')[0], [endDate.getTime()]);
  
  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

  const defaultTicket = produto === 'Franquia' ? 140000 : 54000;

  const { data, isLoading, error } = useQuery({
    queryKey: ['expansao-movements-analytics', produto, startDateStr, endDateStr],
    queryFn: async () => {
      // Step 1: Fetch movements in the selected period
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
        body: { 
          table: 'pipefy_cards_movements_expansao', 
          action: 'query_period',
          startDate: `${startDateStr}T00:00:00`,
          endDate: `${endDateStr}T23:59:59`,
          limit: 10000 
        }
      });

      if (fetchError) {
        console.error(`Error fetching ${produto} analytics:`, fetchError);
        throw fetchError;
      }

      if (!responseData?.data) {
        return { cards: [], fullHistory: [] };
      }

      // Filter by product and parse cards
      const cards: ExpansaoCard[] = [];
      for (const row of responseData.data) {
        const rowProduto = row['Produtos'] || '';
        if (rowProduto !== produto) continue;
        cards.push(parseRawCard(row, defaultTicket));
      }

      console.log(`[${produto} Analytics] Period query returned ${cards.length} movements`);

      // Step 2: Get unique card IDs from period
      const uniqueCardIds = [...new Set(cards.map(c => c.id))];
      
      // Step 3: Fetch full history for these cards
      let fullHistory: ExpansaoCard[] = [];
      if (uniqueCardIds.length > 0) {
        const { data: historyData, error: historyError } = await supabase.functions.invoke('query-external-db', {
          body: { 
            table: 'pipefy_cards_movements_expansao', 
            action: 'query_card_history',
            cardIds: uniqueCardIds
          }
        });
        
        if (!historyError && historyData?.data) {
          // Filter history by product too
          for (const row of historyData.data) {
            const rowProduto = row['Produtos'] || '';
            if (rowProduto !== produto) continue;
            fullHistory.push(parseRawCard(row, defaultTicket));
          }
          console.log(`[${produto} Analytics] Full history: ${fullHistory.length} movements for ${uniqueCardIds.length} cards`);
        }
      }

      return { cards, fullHistory };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const cards = data?.cards ?? [];
  const fullHistory = data?.fullHistory ?? [];

  // Build a map of FIRST entry for EACH indicator per card (using full history)
  const firstEntryByCardAndIndicator = useMemo(() => {
    const firstEntries = new Map<string, Map<IndicatorType, ExpansaoCard>>();
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
    
    console.log(`[${produto} Analytics] Built first entry map for ${firstEntries.size} cards`);
    return firstEntries;
  }, [cards, fullHistory, produto]);

  // Get cards for a specific indicator (using FIRST ENTRY logic)
  const getCardsForIndicator = useMemo(() => {
    return (indicator: IndicatorType): ExpansaoCard[] => {
      console.log(`[${produto} Analytics] getCardsForIndicator(${indicator}): checking ${firstEntryByCardAndIndicator.size} cards`);
      
      const uniqueCards = new Map<string, ExpansaoCard>();
      
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
      
      console.log(`[${produto} Analytics] getCardsForIndicator(${indicator}): ${uniqueCards.size} cards (first entry in period)`);
      return Array.from(uniqueCards.values());
    };
  }, [firstEntryByCardAndIndicator, startTime, endTime, produto]);

  // Helper function to convert ExpansaoCard to DetailItem
  const toDetailItem = (card: ExpansaoCard): DetailItem => ({
    id: card.id,
    name: card.titulo,
    company: card.titulo,
    phase: PHASE_DISPLAY_MAP[card.faseAtual] || card.faseAtual,
    date: card.dataEntrada.toISOString(),
    value: card.valor,
    reason: card.motivoPerda || undefined,
    responsible: card.responsavel || undefined,
    duration: card.duracao,
    product: card.produto, // Franquia or Oxy Hacker
    mrr: card.valorMRR,
    setup: card.valorSetup,
    pontual: card.valorPontual,
  });

  // Get detail items for an indicator (uses same FIRST ENTRY logic)
  const getDetailItemsForIndicator = useMemo(() => {
    return (indicator: IndicatorType): DetailItem[] => {
      const indicatorCards = getCardsForIndicator(indicator);
      return indicatorCards.map(toDetailItem);
    };
  }, [getCardsForIndicator]);

  // Get deals won in period
  const getDealsWon = useMemo(() => {
    const wonCards = getCardsForIndicator('venda');
    const totalValue = wonCards.reduce((sum, card) => sum + card.valor, 0);
    
    return {
      count: wonCards.length,
      totalValue,
      cards: wonCards,
    };
  }, [getCardsForIndicator]);

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
    const cardHistories = new Map<string, ExpansaoCard[]>();
    const historyToUse = fullHistory.length > 0 ? fullHistory : cards;
    for (const card of historyToUse) {
      if (activeCardIds.has(card.id)) {
        if (!cardHistories.has(card.id)) {
          cardHistories.set(card.id, []);
        }
        cardHistories.get(card.id)!.push(card);
      }
    }
    
    console.log(`[${produto} Analytics] Cohort mode: ${activeCardIds.size} unique cards with full history`);
    return cardHistories;
  }, [cards, fullHistory, startTime, endTime, produto]);

  // Get detail items for indicator using FULL history (for cohort mode tier conversion)
  const getDetailItemsWithFullHistory = useMemo(() => {
    return (indicator: IndicatorType): DetailItem[] => {
      const result: DetailItem[] = [];
      const seenIds = new Set<string>();
      
      const cardHistories = getCardsWithFullHistory;
      
      for (const [cardId, cardMovements] of cardHistories.entries()) {
        if (seenIds.has(cardId)) continue;
        
        // Find movement matching the indicator
        const matchingMovement = cardMovements.find(m => {
          const movementIndicator = PHASE_TO_INDICATOR[m.fase];
          
          if (indicator === 'venda') {
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
      
      console.log(`[${produto} Analytics] getDetailItemsWithFullHistory(${indicator}): ${result.length} unique cards`);
      return result;
    };
  }, [getCardsWithFullHistory, produto]);

  return {
    isLoading,
    error,
    cards,
    getCardsForIndicator,
    toDetailItem,
    getDetailItemsForIndicator,
    getDetailItemsWithFullHistory,
    getDealsWon,
  };
}
