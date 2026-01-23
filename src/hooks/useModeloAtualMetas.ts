import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { eachDayOfInterval, eachMonthOfInterval, addDays, differenceInDays } from "date-fns";

export type ModeloAtualIndicator = 'mql' | 'rm' | 'rr' | 'proposta' | 'venda';
export type ChartGrouping = 'daily' | 'weekly' | 'monthly';

interface ModeloAtualMovement {
  id: string;
  titulo: string;
  fase: string;
  faseAtual: string;
  dataEntrada: Date;
  valorMRR: number;
  valorPontual: number;
  valorEducacao: number;
  valorSetup: number;
  valor: number;
}

interface ModeloAtualMetasResult {
  movements: ModeloAtualMovement[];
}

// Map phase names to indicator keys (based on pipefy_moviment_cfos table)
const PHASE_TO_INDICATOR: Record<string, ModeloAtualIndicator> = {
  // MQL - Leads qualificados
  'Novos Leads': 'mql',
  
  // RM - Reunião Marcada
  'Reunião agendada / Qualificado': 'rm',
  'Remarcar Reunião': 'rm',
  
  // RR - Reunião Realizada
  'Reunião Realizada': 'rr',
  '1° Reunião Realizada - Apresentação': 'rr',
  
  // Proposta
  'Enviar proposta': 'proposta',
  'Proposta enviada / Follow Up': 'proposta',
  
  // Venda
  'Ganho': 'venda',
  'Contrato assinado': 'venda',
};

// Parse date from PostgreSQL format
function parseDate(dateValue: string | null): Date | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  return date;
}

// Parse numeric value
function parseNumericValue(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function useModeloAtualMetas(startDate?: Date, endDate?: Date) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['modelo-atual-metas', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<ModeloAtualMetasResult> => {
      console.log('[useModeloAtualMetas] Fetching data from pipefy_moviment_cfos');
      
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
        body: { table: 'pipefy_moviment_cfos', action: 'preview', limit: 50000 }
      });

      if (fetchError) {
        console.error('[useModeloAtualMetas] Error fetching data:', fetchError);
        throw fetchError;
      }

      if (!responseData?.data) {
        console.warn('[useModeloAtualMetas] No data returned');
        return { movements: [] };
      }

      console.log(`[useModeloAtualMetas] Raw data rows: ${responseData.data.length}`);

      const movements: ModeloAtualMovement[] = [];
      for (const row of responseData.data) {
        const id = String(row['ID'] || row['id'] || '');
        const fase = row['Fase'] || row['fase'] || '';
        const dataEntrada = parseDate(row['Entrada'] || row['entrada']) || new Date();
        
        // Skip if no valid phase mapping
        if (!fase || !PHASE_TO_INDICATOR[fase]) continue;

        const valorMRR = parseNumericValue(row['Valor MRR'] || row['valor_mrr'] || 0);
        const valorPontual = parseNumericValue(row['Valor Pontual'] || row['valor_pontual'] || 0);
        const valorEducacao = parseNumericValue(row['Valor Educação'] || row['Valor Educacao'] || row['valor_educacao'] || 0);
        const valorSetup = parseNumericValue(row['Valor Setup'] || row['valor_setup'] || 0);

        movements.push({
          id,
          titulo: row['Título'] || row['titulo'] || row['Nome'] || '',
          fase,
          faseAtual: row['Fase Atual'] || row['fase_atual'] || fase,
          dataEntrada,
          valorMRR,
          valorPontual,
          valorEducacao,
          valorSetup,
          valor: valorMRR + valorPontual + valorEducacao + valorSetup,
        });
      }

      console.log(`[useModeloAtualMetas] Parsed ${movements.length} valid movements`);
      const uniquePhases = [...new Set(movements.map(m => m.fase))];
      console.log(`[useModeloAtualMetas] Unique phases:`, uniquePhases);

      return { movements };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const movements = data?.movements ?? [];

  // Get total qty for a specific indicator and date range
  const getQtyForPeriod = (indicator: ModeloAtualIndicator, start?: Date, end?: Date): number => {
    if (movements.length === 0) return 0;

    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();

    // Count unique cards that entered the indicator phase in the period
    const seenIds = new Set<string>();
    for (const movement of movements) {
      const moveTime = movement.dataEntrada.getTime();
      if (moveTime >= startTime && moveTime <= endTime) {
        const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
        if (moveIndicator === indicator && !seenIds.has(movement.id)) {
          seenIds.add(movement.id);
        }
      }
    }

    const total = seenIds.size;
    console.log(`[useModeloAtualMetas] getQtyForPeriod ${indicator}: ${total}`);
    return total;
  };

  // Get total value for a specific indicator and date range
  const getValueForPeriod = (indicator: ModeloAtualIndicator, start?: Date, end?: Date): number => {
    if (movements.length === 0) return 0;

    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();

    // Sum values for unique cards in the indicator phase within the period
    const cardValues = new Map<string, number>();
    for (const movement of movements) {
      const moveTime = movement.dataEntrada.getTime();
      if (moveTime >= startTime && moveTime <= endTime) {
        const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
        if (moveIndicator === indicator) {
          // Keep the latest value for each card
          const existing = cardValues.get(movement.id) || 0;
          if (movement.valor > existing) {
            cardValues.set(movement.id, movement.valor);
          }
        }
      }
    }

    let total = 0;
    cardValues.forEach(value => {
      total += value > 0 ? value : 17000; // Default ticket if no value
    });

    console.log(`[useModeloAtualMetas] getValueForPeriod ${indicator}: ${total}`);
    return total;
  };

  // Get grouped data for charts
  const getGroupedData = (indicator: ModeloAtualIndicator, start: Date, end: Date, grouping: ChartGrouping): { qty: number[]; meta: number[] } => {
    if (movements.length === 0) return { qty: [], meta: [] };

    const qtyArray: number[] = [];
    const metaArray: number[] = []; // Metas are handled by funnelData in IndicatorsTab

    if (grouping === 'daily') {
      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).getTime();

        const seenIds = new Set<string>();
        for (const movement of movements) {
          const moveTime = movement.dataEntrada.getTime();
          if (moveTime >= dayStart && moveTime <= dayEnd) {
            const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
            if (moveIndicator === indicator && !seenIds.has(movement.id)) {
              seenIds.add(movement.id);
            }
          }
        }
        qtyArray.push(seenIds.size);
        metaArray.push(0); // Will be overridden by funnelData
      }
    } else if (grouping === 'weekly') {
      const totalDays = differenceInDays(end, start) + 1;
      const numWeeks = Math.ceil(totalDays / 7);

      for (let i = 0; i < numWeeks; i++) {
        const weekStart = addDays(start, i * 7);
        const weekEnd = i === numWeeks - 1 ? end : addDays(weekStart, 6);

        const weekStartTime = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
        const weekEndTime = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999).getTime();

        const seenIds = new Set<string>();
        for (const movement of movements) {
          const moveTime = movement.dataEntrada.getTime();
          if (moveTime >= weekStartTime && moveTime <= weekEndTime) {
            const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
            if (moveIndicator === indicator && !seenIds.has(movement.id)) {
              seenIds.add(movement.id);
            }
          }
        }
        qtyArray.push(seenIds.size);
        metaArray.push(0);
      }
    } else {
      // Monthly
      const months = eachMonthOfInterval({ start, end });
      for (const monthDate of months) {
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime();
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const monthEnd = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999).getTime();

        const seenIds = new Set<string>();
        for (const movement of movements) {
          const moveTime = movement.dataEntrada.getTime();
          if (moveTime >= monthStart && moveTime <= monthEnd) {
            const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
            if (moveIndicator === indicator && !seenIds.has(movement.id)) {
              seenIds.add(movement.id);
            }
          }
        }
        qtyArray.push(seenIds.size);
        metaArray.push(0);
      }
    }

    return { qty: qtyArray, meta: metaArray };
  };

  return {
    movements,
    isLoading,
    error,
    refetch,
    getQtyForPeriod,
    getValueForPeriod,
    getGroupedData,
  };
}

