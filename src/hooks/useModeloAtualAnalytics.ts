import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DetailItem } from "@/components/planning/indicators/DetailSheet";
import { IndicatorType } from "@/hooks/useFunnelRealized";

export interface ModeloAtualCard {
  id: string;
  titulo: string;
  empresa?: string;
  contato?: string;
  fase: string;
  faseDestino: string;
  dataEntrada: Date;
  dataSaida: Date | null; // "Saída" from database
  valor: number;
  valorMRR: number;
  valorPontual: number;
  valorEducacao: number;
  valorSetup: number;
  responsavel?: string;
  closer?: string; // Specifically the "Closer responsável" field for filtering
  faixa?: string;
  duracao: number; // Duration calculated dynamically from Entrada/Saída
}

// Map destination phases to indicators (based on pipefy_moviment_cfos table)
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  // Leads - Total de leads (primeira etapa)
  'Novos Leads': 'leads',
  
  // MQL - Leads qualificados
  'MQLs': 'mql',
  
  // RM - Reunião Marcada
  'Reunião agendada / Qualificado': 'rm',
  'Remarcar Reunião': 'rm',
  
  // RR - Reunião Realizada
  'Reunião Realizada': 'rr',
  '1° Reunião Realizada - Apresentação': 'rr',
  
  // Proposta (somente esta fase conta)
  'Proposta enviada / Follow Up': 'proposta',
  
  // Venda (somente esta fase conta)
  'Ganho': 'venda',
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

export function useModeloAtualAnalytics(startDate: Date, endDate: Date) {
  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

  const { data, isLoading, error } = useQuery({
    queryKey: ['modelo-atual-analytics', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      console.log(`[useModeloAtualAnalytics] Fetching data from pipefy_moviment_cfos with server-side date filter`);
      
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
        return { cards: [] };
      }

      console.log(`[useModeloAtualAnalytics] Raw data rows: ${responseData.data.length}`);

      const cards: ModeloAtualCard[] = [];
      for (const row of responseData.data) {
        const id = String(row['ID'] || row['id'] || '');
        const fase = row['Fase'] || row['fase'] || '';
        let dataEntrada = parseDate(row['Entrada'] || row['entrada']) || new Date();
        const titulo = row['Título'] || row['titulo'] || row['Nome'] || '';
        
        // Skip if no id, no phase, or phase not in mapping
        if (!id || !fase) continue;
        if (!PHASE_TO_INDICATOR[fase]) continue;

        // Note: Logic for "Data de assinatura do contrato" removed since
        // we now use "Ganho" phase for sales instead of "Contrato assinado"
        const valorMRR = parseNumericValue(row['Valor MRR'] || row['valor_mrr'] || 0);
        const valorPontual = parseNumericValue(row['Valor Pontual'] || row['valor_pontual'] || 0);
        const valorEducacao = parseNumericValue(row['Valor Educação'] || row['Valor Educacao'] || row['valor_educacao'] || 0);
        const valorSetup = parseNumericValue(row['Valor Setup'] || row['valor_setup'] || 0);
        const valor = valorMRR + valorPontual + valorEducacao + valorSetup;
        
        // Parse exit date and calculate duration dynamically
        const dataSaida = parseDate(row['Saída']);
        let duracao = 0;
        if (dataSaida) {
          // Card already left the phase: difference between Exit and Entry
          duracao = Math.floor((dataSaida.getTime() - dataEntrada.getTime()) / 1000);
        } else {
          // Card still in phase: time since entry until now
          duracao = Math.floor((Date.now() - dataEntrada.getTime()) / 1000);
        }
        
        cards.push({
          id,
          titulo: row['Título'] || row['titulo'] || row['Nome'] || '',
          empresa: row['Empresa'] || row['empresa'] || row['Organização'] || '',
          contato: row['Contato'] || row['contato'] || row['Nome - Interlocução O2'] || '',
          fase,
          faseDestino: fase, // Same as fase for pipefy_moviment_cfos
          dataEntrada,
          dataSaida,
          valorMRR,
          valorPontual,
          valorEducacao,
          valorSetup,
          valor,
          closer: String(row['Closer responsável'] ?? '').trim(), // Closer specific field for filtering - normalized
          responsavel: String(row['SDR responsável'] || row['Responsável'] || row['responsavel'] || '').trim(),
          faixa: row['Faixa de faturamento mensal'] || row['Faixa'] || row['faixa'] || '',
          duracao,
        });
      }

      console.log(`[useModeloAtualAnalytics] Parsed ${cards.length} card movements`);
      const uniquePhases = [...new Set(cards.map(c => c.fase))];
      console.log(`[useModeloAtualAnalytics] Unique phases:`, uniquePhases);
      
      return { cards };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const cards = data?.cards ?? [];

  // Filter cards by period
  const cardsInPeriod = useMemo(() => {
    return cards.filter(card => {
      const entryTime = card.dataEntrada.getTime();
      return entryTime >= startTime && entryTime <= endTime;
    });
  }, [cards, startTime, endTime]);

  // Get cards for a specific indicator
  const getCardsForIndicator = useMemo(() => {
    return (indicator: IndicatorType): ModeloAtualCard[] => {
      const uniqueCards = new Map<string, ModeloAtualCard>();
      
      for (const card of cardsInPeriod) {
        const cardIndicator = PHASE_TO_INDICATOR[card.faseDestino];
        
        // LEADS = Union of 'Novos Leads' (leads) + 'MQLs' (mql)
        // This ensures every card entering the funnel is counted as a Lead
        const matchesIndicator = indicator === 'leads'
          ? (cardIndicator === 'leads' || cardIndicator === 'mql')
          : cardIndicator === indicator;
        
        if (matchesIndicator) {
          // Keep EARLIEST entry per card (first time entering the phase)
          // This ensures a sale is counted in the month it was FIRST signed, not re-moved
          const existing = uniqueCards.get(card.id);
          if (!existing || card.dataEntrada < existing.dataEntrada) {
            uniqueCards.set(card.id, card);
          }
        }
      }
      
      console.log(`[useModeloAtualAnalytics] getCardsForIndicator ${indicator}: ${uniqueCards.size} cards`);
      return Array.from(uniqueCards.values());
    };
  }, [cardsInPeriod]);

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
  });

  // Get detail items for a specific indicator
  const getDetailItemsForIndicator = (indicator: IndicatorType): DetailItem[] => {
    // All indicators including leads now have card data from database
    
    const indicatorCards = getCardsForIndicator(indicator);
    return indicatorCards.map(toDetailItem);
  };

  return {
    isLoading,
    error,
    cards: cardsInPeriod,
    getCardsForIndicator,
    getLeadsCards,
    toDetailItem,
    getDetailItemsForIndicator,
  };
}
