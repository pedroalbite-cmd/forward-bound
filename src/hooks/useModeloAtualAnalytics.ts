import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DetailItem } from "@/components/planning/indicators/DetailSheet";
import { IndicatorType } from "@/hooks/useFunnelRealized";
import { isMqlQualified } from "@/hooks/useModeloAtualMetas";

export interface ModeloAtualCard {
  id: string;
  titulo: string;
  empresa?: string;
  contato?: string;
  fase: string;
  faseDestino: string;
  dataEntrada: Date;
  dataSaida: Date | null; // "Saída" from database
  dataCriacao: Date | null; // "Data Criação" - card creation timestamp for SLA calculation
  dataAssinatura: Date | null; // "Data de assinatura do contrato" - for display in sales
  valor: number;
  valorMRR: number;
  valorPontual: number;
  valorEducacao: number;
  valorSetup: number;
  responsavel?: string;
  sdr?: string; // SDR responsável - specifically for display
  closer?: string; // Specifically the "Closer responsável" field for filtering
  faixa?: string;
  duracao: number; // Duration calculated dynamically from Entrada/Saída
}

// Map destination phases to indicators (based on pipefy_moviment_cfos table)
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  // Leads - Total de leads (primeira etapa)
  'Novos Leads': 'leads',
  
  // MQL - Leads qualificados (inclui fase usada para cálculo do SLA)
  'MQLs': 'mql',
  'Tentativas de contato': 'mql', // Fase usada para cálculo do SLA
  
  // RM - Reunião Marcada
  'Reunião agendada / Qualificado': 'rm',
  'Remarcar Reunião': 'rm',
  
  // RR - Reunião Realizada
  'Reunião Realizada': 'rr',
  '1° Reunião Realizada - Apresentação': 'rr',
  
  // Proposta (somente esta fase conta)
  'Proposta enviada / Follow Up': 'proposta',
  
  // Venda (somente esta fase conta)
  'Contrato assinado': 'venda',
};

// Parse date from PostgreSQL format
function parseDate(dateValue: string | null): Date | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  return date;
}

// Parse numeric value - handles both BR (8.570,65) and US/DB (8570.65) formats
function parseNumericValue(value: any): number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  
  if (typeof value === 'string') {
    // Remove R$ e espaços
    let cleaned = value.replace(/[R$\s]/g, '').trim();
    
    if (cleaned === '') return 0;
    
    // Detectar formato baseado na presença de vírgula e ponto:
    // - Formato BR: "8.570,65" (ponto = milhar, vírgula = decimal)
    // - Formato US/DB: "8570.65" (ponto = decimal)
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    
    if (hasComma && hasDot) {
      // Formato brasileiro completo: "8.570,65"
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot) {
      // Só vírgula: "8570,65" → trocar por ponto
      cleaned = cleaned.replace(',', '.');
    }
    // Se só tem ponto ou nenhum: já está em formato americano (banco)
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Helper to parse a row from the database into a ModeloAtualCard
function parseCardRow(row: Record<string, any>): ModeloAtualCard | null {
  const id = String(row['ID'] || row['id'] || '');
  const fase = row['Fase'] || row['fase'] || '';
  const dataEntrada = parseDate(row['Entrada'] || row['entrada']) || new Date();
  
  // Skip if no id, no phase, or phase not in mapping
  if (!id || !fase) return null;
  if (!PHASE_TO_INDICATOR[fase]) return null;

  // Parse additional dates
  const dataAssinatura = parseDate(row['Data de assinatura do contrato']);
  const valorMRR = parseNumericValue(row['Valor MRR'] || row['valor_mrr'] || 0);
  const valorPontual = parseNumericValue(row['Valor Pontual'] || row['valor_pontual'] || 0);
  const valorEducacao = parseNumericValue(row['Valor Educação'] || row['Valor Educacao'] || row['valor_educacao'] || 0);
  const valorSetup = parseNumericValue(row['Valor Setup'] || row['valor_setup'] || 0);
  const valor = valorMRR + valorPontual + valorEducacao + valorSetup;
  
  // Parse exit date and calculate duration dynamically
  const dataSaida = parseDate(row['Saída']);
  const dataCriacao = parseDate(row['Data Criação']); // For SLA calculation
  let duracao = 0;
  if (dataSaida) {
    // Card already left the phase: difference between Exit and Entry
    duracao = Math.floor((dataSaida.getTime() - dataEntrada.getTime()) / 1000);
  } else {
    // Card still in phase: time since entry until now
    duracao = Math.floor((Date.now() - dataEntrada.getTime()) / 1000);
  }
  
  // Extract SDR for display
  const sdr = String(row['SDR responsável'] || '').trim();
  
  return {
    id,
    titulo: row['Título'] || row['titulo'] || row['Nome'] || '',
    empresa: row['Empresa'] || row['empresa'] || row['Organização'] || '',
    contato: row['Contato'] || row['contato'] || row['Nome - Interlocução O2'] || '',
    fase,
    faseDestino: fase, // Same as fase for pipefy_moviment_cfos
    dataEntrada,
    dataSaida,
    dataCriacao,
    dataAssinatura,
    valorMRR,
    valorPontual,
    valorEducacao,
    valorSetup,
    valor,
    sdr: sdr || undefined,
    closer: String(row['Closer responsável'] ?? '').trim(), // Closer specific field for filtering - normalized
    responsavel: String(row['SDR responsável'] || row['Responsável'] || row['responsavel'] || '').trim(),
    faixa: row['Faixa de faturamento mensal'] || row['Faixa'] || row['faixa'] || '',
    duracao,
  };
}

// Parse multiple rows into cards
function parseCards(rows: Record<string, any>[]): ModeloAtualCard[] {
  const cards: ModeloAtualCard[] = [];
  for (const row of rows) {
    const card = parseCardRow(row);
    if (card) cards.push(card);
  }
  return cards;
}

export function useModeloAtualAnalytics(startDate: Date, endDate: Date) {
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['modelo-atual-analytics', startDateStr, endDateStr],
    queryFn: async () => {
      console.log(`[useModeloAtualAnalytics] Fetching data from pipefy_moviment_cfos with server-side date filter`);
      
      // Step 1: Fetch movements in the selected period
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
        body: { 
          table: 'pipefy_moviment_cfos', 
          action: 'query_period',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 10000 
        }
      });

      if (fetchError) {
        console.error('[useModeloAtualAnalytics] Error fetching data:', fetchError);
        throw fetchError;
      }

      if (!responseData?.data) {
        console.warn('[useModeloAtualAnalytics] No data returned');
        return { cards: [], fullHistory: [] };
      }

      console.log(`[useModeloAtualAnalytics] Raw data rows: ${responseData.data.length}`);

      const cards = parseCards(responseData.data);

      console.log(`[useModeloAtualAnalytics] Parsed ${cards.length} card movements`);
      const uniquePhases = [...new Set(cards.map(c => c.fase))];
      console.log(`[useModeloAtualAnalytics] Unique phases:`, uniquePhases);
      
      // Step 2: Get unique card IDs from period
      const uniqueCardIds = [...new Set(cards.map(c => c.id))];
      console.log(`[useModeloAtualAnalytics] Unique card IDs in period: ${uniqueCardIds.length}`);
      
      // Step 3: Fetch full history for these cards (to find absolute first entry per phase)
      let fullHistory: ModeloAtualCard[] = [];
      if (uniqueCardIds.length > 0) {
        console.log(`[useModeloAtualAnalytics] Fetching full history for ${uniqueCardIds.length} cards...`);
        const { data: historyData, error: historyError } = await supabase.functions.invoke('query-external-db', {
          body: { 
            table: 'pipefy_moviment_cfos', 
            action: 'query_card_history',
            cardIds: uniqueCardIds
          }
        });
        
        if (historyError) {
          console.error('[useModeloAtualAnalytics] Error fetching full history:', historyError);
          // Continue without full history - will fall back to period-only data
        } else if (historyData?.data) {
          fullHistory = parseCards(historyData.data);
          console.log(`[useModeloAtualAnalytics] Full history loaded: ${fullHistory.length} movements`);
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
  // This ensures we count each indicator only once, in the month of first entry
  const firstEntryByCardAndIndicator = useMemo(() => {
    const firstEntries = new Map<string, Map<IndicatorType, ModeloAtualCard>>();
    
    // Use fullHistory if available, otherwise fall back to cards (period-only)
    const historyToUse = fullHistory.length > 0 ? fullHistory : cards;
    
    for (const card of historyToUse) {
      const indicator = PHASE_TO_INDICATOR[card.fase];
      if (!indicator) continue;
      
      // Special validation for MQL (requires revenue >= 200k)
      if (indicator === 'mql' && !isMqlQualified(card.faixa)) continue;
      
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
    
    console.log(`[useModeloAtualAnalytics] Built firstEntryByCardAndIndicator map for ${firstEntries.size} cards`);
    return firstEntries;
  }, [fullHistory, cards]);

  // Get cards for a specific indicator - UNIVERSAL FIRST-ENTRY LOGIC
  const getCardsForIndicator = useMemo(() => {
    return (indicator: IndicatorType): ModeloAtualCard[] => {
      const uniqueCards = new Map<string, ModeloAtualCard>();
      
      // For LEADS indicator: union of leads + mql phases
      const indicatorsToCheck: IndicatorType[] = indicator === 'leads' 
        ? ['leads', 'mql']
        : [indicator];
      
      for (const ind of indicatorsToCheck) {
        // Check each card's first entry for this indicator
        for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
          const firstEntry = indicatorMap.get(ind);
          if (!firstEntry) continue;
          
          const entryTime = firstEntry.dataEntrada.getTime();
          
          // Only include if FIRST entry was in selected period
          if (entryTime >= startTime && entryTime <= endTime) {
            // For same card appearing in multiple indicators (e.g., leads+mql), keep earliest
            const existing = uniqueCards.get(cardId);
            if (!existing || firstEntry.dataEntrada < existing.dataEntrada) {
              uniqueCards.set(cardId, firstEntry);
            }
          }
        }
      }
      
      console.log(`[useModeloAtualAnalytics] getCardsForIndicator ${indicator}: ${uniqueCards.size} cards`);
      return Array.from(uniqueCards.values());
    };
  }, [firstEntryByCardAndIndicator, startTime, endTime]);

  // Get cards for leads - now uses actual data from database
  const getLeadsCards = useMemo(() => {
    return getCardsForIndicator('leads');
  }, [getCardsForIndicator]);

  // Helper function to convert ModeloAtualCard to DetailItem
  const toDetailItem = (card: ModeloAtualCard): DetailItem => ({
    id: card.id,
    name: card.titulo || card.empresa || 'Sem título',
    company: card.empresa || card.contato || undefined,
    phase: card.faseDestino,
    date: card.dataEntrada.toISOString(),
    value: card.valor,
    revenueRange: card.faixa || undefined,
    responsible: card.closer || card.responsavel || undefined, // Prioritize closer for display
    duration: card.duracao,
    product: 'CaaS',
    mrr: card.valorMRR,
    setup: card.valorSetup,
    pontual: card.valorPontual,
    closer: card.closer,
    sdr: card.sdr,
    dataAssinatura: card.dataAssinatura?.toISOString() || undefined,
  });

  // Get detail items for a specific indicator
  const getDetailItemsForIndicator = (indicator: IndicatorType): DetailItem[] => {
    // All indicators including leads now have card data from database
    
    const indicatorCards = getCardsForIndicator(indicator);
    return indicatorCards.map(toDetailItem);
  };

  // Calculate average SLA in minutes for cards entering "Tentativas de contato" phase
  // SLA = Entry to "Tentativas de contato" - Card Creation Date
  const getAverageSlaMinutes = useMemo(() => {
    // Filter from period cards (not full history) for SLA calculation
    const tentativasCards = cards.filter(card => 
      card.fase === 'Tentativas de contato' && card.dataCriacao
    );
    
    if (tentativasCards.length === 0) return 0;
    
    const totalMinutes = tentativasCards.reduce((sum, card) => {
      const diffMs = card.dataEntrada.getTime() - card.dataCriacao!.getTime();
      return sum + (diffMs / 1000 / 60); // Convert to minutes
    }, 0);
    
    return totalMinutes / tentativasCards.length;
  }, [cards]);

  // COHORT MODE: Get cards with full history for tier conversion analysis
  // Step 1: Identify all card IDs that had ANY movement in the selected period
  // Step 2: For those cards, include ALL their movements regardless of date
  const getCardsWithFullHistory = useMemo(() => {
    // Use fullHistory if available for cohort mode
    const historyToUse = fullHistory.length > 0 ? fullHistory : cards;
    
    // Find all card IDs with movement in period
    const activeCardIds = new Set<string>();
    for (const card of cards) {
      const entryTime = card.dataEntrada.getTime();
      if (entryTime >= startTime && entryTime <= endTime) {
        activeCardIds.add(card.id);
      }
    }
    
    // Return all movements for active cards (regardless of date)
    const cardHistories = new Map<string, ModeloAtualCard[]>();
    for (const card of historyToUse) {
      if (activeCardIds.has(card.id)) {
        if (!cardHistories.has(card.id)) {
          cardHistories.set(card.id, []);
        }
        cardHistories.get(card.id)!.push(card);
      }
    }
    
    console.log(`[Modelo Atual Analytics] Cohort mode: ${activeCardIds.size} unique cards with full history`);
    return cardHistories;
  }, [cards, fullHistory, startTime, endTime]);

  // Get detail items for indicator using FULL history (for cohort mode tier conversion)
  const getDetailItemsWithFullHistory = (indicator: IndicatorType): DetailItem[] => {
    const result: DetailItem[] = [];
    const seenIds = new Set<string>();
    
    const cardHistories = getCardsWithFullHistory;
    
    for (const [cardId, movements] of cardHistories.entries()) {
      if (seenIds.has(cardId)) continue;
      
      // Find movement matching the indicator
      const matchingMovement = movements.find(m => {
        const cardIndicator = PHASE_TO_INDICATOR[m.faseDestino];
        
        // LEADS = Union of 'Novos Leads' (leads) + 'MQLs' (mql)
        if (indicator === 'leads') {
          return cardIndicator === 'leads' || cardIndicator === 'mql';
        }
        // MQL = card entered MQLs phase AND has revenue >= R$ 200k
        if (indicator === 'mql') {
          return cardIndicator === 'mql' && isMqlQualified(m.faixa);
        }
        return cardIndicator === indicator;
      });
      
      if (matchingMovement) {
        seenIds.add(cardId);
        result.push(toDetailItem(matchingMovement));
      }
    }
    
    console.log(`[Modelo Atual Analytics] getDetailItemsWithFullHistory(${indicator}): ${result.length} unique cards`);
    return result;
  };

  return {
    isLoading,
    error,
    cards,
    getCardsForIndicator,
    getLeadsCards,
    toDetailItem,
    getDetailItemsForIndicator,
    getDetailItemsWithFullHistory,
    getAverageSlaMinutes,
  };
}
