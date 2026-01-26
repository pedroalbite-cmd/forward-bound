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
  valor: number;
  taxaFranquia: number;
  valorMRR: number;
  valorPontual: number;
  valorSetup: number;
  produto: string;
  responsavel: string | null;
  motivoPerda: string | null;
  duracao: number; // Duration in seconds from "Duração (s)" column
}

// Map Pipefy phase names to indicator keys
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  'Start form': 'leads',
  'MQL': 'mql',
  'Reunião agendada / Qualificado': 'rm',
  'Reunião Realizada': 'rr',
  'Proposta enviada / Follow Up': 'proposta',
  'Enviar para assinatura': 'proposta',
  'Ganho': 'venda',
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
  'Ganho': 'Ganho',
  'Perdido': 'Perdido',
  'Arquivado': 'Arquivado',
};

function parseDate(dateValue: string | null): Date | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
}

export function useExpansaoAnalytics(startDate: Date, endDate: Date, produto: 'Franquia' | 'Oxy Hacker' = 'Franquia') {
  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

  const defaultTicket = produto === 'Franquia' ? 140000 : 54000;

  const { data, isLoading, error } = useQuery({
    queryKey: ['expansao-analytics', produto, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Use server-side date filtering for accurate period data
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
        body: { 
          table: 'pipefy_cards_movements_expansao', 
          action: 'query_period',
          startDate: startDate.toISOString().split('T')[0] + 'T00:00:00',
          endDate: endDate.toISOString().split('T')[0] + 'T23:59:59',
          limit: 10000 
        }
      });

      if (fetchError) {
        console.error(`Error fetching ${produto} analytics:`, fetchError);
        throw fetchError;
      }

      if (!responseData?.data) {
        return { movements: [] };
      }

      // Keep ALL movements (not just latest per card) to match useExpansaoMetas logic
      const allMovements: ExpansaoCard[] = [];
      
      for (const row of responseData.data) {
        const rowProduto = row['Produtos'] || '';
        
        // Filter by product type
        if (rowProduto !== produto) continue;
        
        const id = String(row.ID);
        // Use fallback date like useExpansaoMetas to avoid skipping records
        const dataEntrada = parseDate(row['Entrada']) || new Date();
        
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
        
        const movement: ExpansaoCard = {
          id,
          titulo: row['Título'] || '',
          fase: row['Fase'] || '',
          faseAtual: row['Fase Atual'] || '',
          dataEntrada,
          valor,
          taxaFranquia,
          valorMRR,
          valorPontual,
          valorSetup,
          produto: rowProduto,
          responsavel: row['Closer responsável'] || row['SDR responsável'] || null,
          motivoPerda: row['Motivo da perda'] || null,
          duracao: row['Duração (s)'] ? parseFloat(row['Duração (s)']) : 0,
        };
        
        allMovements.push(movement);
      }

      const uniquePhases = [...new Set(allMovements.map(m => m.fase))];
      console.log(`[useExpansaoAnalytics] Raw rows: ${responseData.data.length}, Filtered ${produto}: ${allMovements.length}`);
      console.log(`[useExpansaoAnalytics] Unique phases:`, uniquePhases);
      return { movements: allMovements };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const movements = data?.movements ?? [];

  // Get unique cards that entered a specific indicator phase during the period
  const getCardsForIndicator = useMemo(() => {
    return (indicator: IndicatorType): ExpansaoCard[] => {
      console.log(`[useExpansaoAnalytics] getCardsForIndicator(${indicator}): checking ${movements.length} movements, period ${new Date(startTime).toLocaleDateString()} - ${new Date(endTime).toLocaleDateString()}`);
      
      const seenIds = new Set<string>();
      const result: ExpansaoCard[] = [];
      
      for (const movement of movements) {
        const entryTime = movement.dataEntrada.getTime();
        if (entryTime < startTime || entryTime > endTime) continue;
        if (seenIds.has(movement.id)) continue;
        
        const movementIndicator = PHASE_TO_INDICATOR[movement.fase];
        
        // Check if movement matches the indicator
        let matches = false;
        if (indicator === 'leads' && movement.fase === 'Start form') {
          matches = true;
        } else if (indicator === 'venda' && movement.fase === 'Ganho') {
          matches = true;
        } else if (indicator === 'proposta' && movementIndicator === 'proposta') {
          matches = true;
        } else if (movementIndicator === indicator) {
          matches = true;
        }
        
        if (matches) {
          seenIds.add(movement.id);
          result.push(movement);
        }
      }
      
      console.log(`[useExpansaoAnalytics] getCardsForIndicator(${indicator}): found ${result.length} unique cards`);
      return result;
    };
  }, [movements, startTime, endTime]);

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
  });

  // Get detail items for an indicator
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

  return {
    isLoading,
    error,
    movements,
    getCardsForIndicator,
    toDetailItem,
    getDetailItemsForIndicator,
    getDealsWon,
  };
}
