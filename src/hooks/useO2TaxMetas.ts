import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { eachDayOfInterval, eachMonthOfInterval, addDays, differenceInDays } from "date-fns";

export type O2TaxIndicator = 'mql' | 'rm' | 'rr' | 'proposta' | 'venda';
export type ChartGrouping = 'daily' | 'weekly' | 'monthly';

interface O2TaxMovement {
  id: string;
  titulo: string;
  fase: string;           // Phase name from movement
  dataEntrada: Date;      // When entered this phase
  dataSaida: Date | null; // When left this phase
  valorMRR: number | null;
  valorPontual: number | null;
}

interface O2TaxMetasResult {
  movements: O2TaxMovement[];
}

// Map Pipefy phase names to indicator keys
// O2 TAX uses "1° Reunião Realizada - Apresentação" for RR
const PHASE_TO_INDICATOR: Record<string, O2TaxIndicator> = {
  'MQL': 'mql',
  'Reunião agendada / Qualificado': 'rm',
  '1° Reunião Realizada - Apresentação': 'rr',
  'Proposta enviada / Follow Up': 'proposta',
  'Enviar para assinatura': 'proposta',
  'Ganho': 'venda',
  'Contrato assinado': 'venda',
};

// Parse date string to JS Date
function parseDate(dateValue: string | null): Date | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
}

export function useO2TaxMetas(startDate?: Date, endDate?: Date) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['o2tax-metas-movements', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<O2TaxMetasResult> => {
      // Use movements table for accurate phase tracking
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
        body: { table: 'pipefy_cards_movements', action: 'preview', limit: 5000 }
      });

      if (fetchError) {
        console.error('Error fetching O2 TAX movements:', fetchError);
        throw fetchError;
      }

      if (!responseData?.data) {
        console.warn('No data returned from external db for O2 TAX movements');
        return { movements: [] };
      }

      // Parse movements - each row is a phase transition
      const movements: O2TaxMovement[] = [];
      
      for (const row of responseData.data) {
        const movement: O2TaxMovement = {
          id: String(row.ID),
          titulo: row['Título'] || '',
          fase: row['Fase'] || '',  // This is the phase name from movement
          dataEntrada: parseDate(row['Entrada']) || new Date(),
          dataSaida: parseDate(row['Saída']),
          valorMRR: row['Valor MRR'] ? parseFloat(row['Valor MRR']) : null,
          valorPontual: row['Valor Pontual'] ? parseFloat(row['Valor Pontual']) : null,
        };
        
        movements.push(movement);
      }

      // Log unique phases for debugging
      const uniquePhases = [...new Set(movements.map(m => m.fase))];
      console.log(`[useO2TaxMetas] Loaded ${movements.length} movements from pipefy_cards_movements`);
      console.log(`[useO2TaxMetas] Unique phases:`, uniquePhases);
      
      return { movements };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Get total qty for a specific indicator and date range
  // Count movements that ENTERED a phase during the period
  const getQtyForPeriod = (indicator: O2TaxIndicator, start?: Date, end?: Date): number => {
    if (!data?.movements || data.movements.length === 0) return 0;
    
    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();
    
    let total = 0;
    for (const movement of data.movements) {
      const entryTime = movement.dataEntrada.getTime();
      if (entryTime >= startTime && entryTime <= endTime) {
        const movementIndicator = PHASE_TO_INDICATOR[movement.fase];
        if (movementIndicator === indicator) {
          total += 1;
        }
      }
    }
    
    console.log(`[useO2TaxMetas] getQtyForPeriod ${indicator}: ${total}`);
    return total;
  };

  // Get total meta for a specific indicator and date range
  const getMetaForPeriod = (indicator: O2TaxIndicator, start?: Date, end?: Date): number => {
    if (!start || !end) return 0;
    
    const daysInPeriod = differenceInDays(end, start) + 1;
    const periodFraction = daysInPeriod / 365;
    
    // Annual metas based on planning (updated to match real targets)
    const annualMetas: Record<O2TaxIndicator, number> = {
      mql: 504,       // 42/month
      rm: 180,        // 15/month
      rr: 96,         // 8/month
      proposta: 72,   // 6/month
      venda: 12,      // 1/month
    };
    
    return Math.round(annualMetas[indicator] * periodFraction);
  };

  // Get grouped data for charts (returns array of values per period)
  const getGroupedData = (indicator: O2TaxIndicator, start: Date, end: Date, grouping: ChartGrouping): { qty: number[]; meta: number[] } => {
    if (!data?.movements || data.movements.length === 0) return { qty: [], meta: [] };

    const qtyArray: number[] = [];
    const metaArray: number[] = [];
    
    const daysInYear = 365;
    const annualMetas: Record<O2TaxIndicator, number> = {
      mql: 504,
      rm: 180,
      rr: 96,
      proposta: 72,
      venda: 12,
    };
    const dailyMeta = annualMetas[indicator] / daysInYear;

    if (grouping === 'daily') {
      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).getTime();
        
        let dayQty = 0;
        for (const movement of data.movements) {
          const entryTime = movement.dataEntrada.getTime();
          if (entryTime >= dayStart && entryTime <= dayEnd) {
            const movementIndicator = PHASE_TO_INDICATOR[movement.fase];
            if (movementIndicator === indicator) {
              dayQty += 1;
            }
          }
        }
        qtyArray.push(dayQty);
        metaArray.push(Math.round(dailyMeta));
      }
    } else if (grouping === 'weekly') {
      const totalDays = differenceInDays(end, start) + 1;
      const numWeeks = Math.ceil(totalDays / 7);
      
      for (let i = 0; i < numWeeks; i++) {
        const weekStart = addDays(start, i * 7);
        const weekEnd = i === numWeeks - 1 ? end : addDays(weekStart, 6);
        
        const weekStartTime = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
        const weekEndTime = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999).getTime();
        
        let weekQty = 0;
        for (const movement of data.movements) {
          const entryTime = movement.dataEntrada.getTime();
          if (entryTime >= weekStartTime && entryTime <= weekEndTime) {
            const movementIndicator = PHASE_TO_INDICATOR[movement.fase];
            if (movementIndicator === indicator) {
              weekQty += 1;
            }
          }
        }
        const daysInWeek = differenceInDays(weekEnd, weekStart) + 1;
        qtyArray.push(weekQty);
        metaArray.push(Math.round(dailyMeta * daysInWeek));
      }
    } else {
      // Monthly
      const months = eachMonthOfInterval({ start, end });
      for (const monthDate of months) {
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime();
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const monthEnd = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999).getTime();
        
        let monthQty = 0;
        for (const movement of data.movements) {
          const entryTime = movement.dataEntrada.getTime();
          if (entryTime >= monthStart && entryTime <= monthEnd) {
            const movementIndicator = PHASE_TO_INDICATOR[movement.fase];
            if (movementIndicator === indicator) {
              monthQty += 1;
            }
          }
        }
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        qtyArray.push(monthQty);
        metaArray.push(Math.round(dailyMeta * daysInMonth));
      }
    }

    return { qty: qtyArray, meta: metaArray };
  };

  return {
    movements: data?.movements ?? [],
    isLoading,
    error,
    refetch,
    getQtyForPeriod,
    getMetaForPeriod,
    getGroupedData,
  };
}
