import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { eachDayOfInterval, eachMonthOfInterval, addDays, differenceInDays } from "date-fns";

export type OxyHackerIndicator = 'mql' | 'rm' | 'rr' | 'proposta' | 'venda';
export type ChartGrouping = 'daily' | 'weekly' | 'monthly';

interface OxyHackerCard {
  id: string;
  titulo: string;
  faseAtual: string;
  dataCriacao: Date;
  dataUltimaFase: Date;
  valorMRR: number | null;
  valorPontual: number | null;
  produto: string;
}

interface OxyHackerMetasResult {
  cards: OxyHackerCard[];
}

// Map Pipefy phase names to indicator keys
const PHASE_TO_INDICATOR: Record<string, OxyHackerIndicator> = {
  'MQL': 'mql',
  'Reunião agendada / Qualificado': 'rm',
  'Reunião Realizada': 'rr',
  'Proposta enviada / Follow Up': 'proposta',
  'Ganho': 'venda',
};

// Parse date string to JS Date
function parseDate(dateValue: string | null): Date | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
}

export function useOxyHackerMetas(startDate?: Date, endDate?: Date) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['oxy-hacker-metas', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<OxyHackerMetasResult> => {
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
        body: { table: 'pipefy_cards_expansao', action: 'preview', limit: 1000 }
      });

      if (fetchError) {
        console.error('Error fetching oxy hacker data:', fetchError);
        throw fetchError;
      }

      if (!responseData?.data) {
        console.warn('No data returned from external db');
        return { cards: [] };
      }

      // Parse the data - group by ID and track phase transitions
      const cardMap = new Map<string, OxyHackerCard[]>();
      
      for (const row of responseData.data) {
        const id = String(row.ID);
        const produto = row['Produtos'] || '';
        
        // Filter only "Oxy Hacker" products for this hook
        if (produto !== 'Oxy Hacker') continue;
        
        const card: OxyHackerCard = {
          id,
          titulo: row['Título'] || '',
          faseAtual: row['Fase Atual'] || '',
          dataCriacao: parseDate(row['Data Criação']) || new Date(),
          dataUltimaFase: parseDate(row['Data Última Fase']) || new Date(),
          valorMRR: row['Valor MRR'] ? parseFloat(row['Valor MRR']) : null,
          valorPontual: row['Valor Pontual'] ? parseFloat(row['Valor Pontual']) : null,
          produto,
        };
        
        if (!cardMap.has(id)) {
          cardMap.set(id, []);
        }
        cardMap.get(id)!.push(card);
      }

      // For each card, we want to count each phase transition as an event
      const cards: OxyHackerCard[] = [];
      cardMap.forEach((cardVersions) => {
        // Sort by dataUltimaFase to get chronological order
        cardVersions.sort((a, b) => a.dataUltimaFase.getTime() - b.dataUltimaFase.getTime());
        cards.push(...cardVersions);
      });

      console.log(`[useOxyHackerMetas] Loaded ${cards.length} Oxy Hacker card events from external db`);
      return { cards };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Get total qty for a specific indicator and date range
  const getQtyForPeriod = (indicator: OxyHackerIndicator, start?: Date, end?: Date): number => {
    if (!data?.cards || data.cards.length === 0) return 0;
    
    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();
    
    let total = 0;
    for (const card of data.cards) {
      const cardTime = card.dataUltimaFase.getTime();
      if (cardTime >= startTime && cardTime <= endTime) {
        const cardIndicator = PHASE_TO_INDICATOR[card.faseAtual];
        if (cardIndicator === indicator) {
          total += 1;
        }
      }
    }
    
    console.log(`[useOxyHackerMetas] getQtyForPeriod ${indicator}: ${total}`);
    return total;
  };

  // Get total meta for a specific indicator and date range
  // For Oxy Hacker, we use fixed metas based on planning (100 units/year)
  const getMetaForPeriod = (indicator: OxyHackerIndicator, start?: Date, end?: Date): number => {
    if (!start || !end) return 0;
    
    const daysInPeriod = differenceInDays(end, start) + 1;
    const periodFraction = daysInPeriod / 365;
    
    // Annual metas based on planning (Oxy Hacker: 100 units/year)
    const annualMetas: Record<OxyHackerIndicator, number> = {
      mql: 1000,      // ~83/month for 100 sales (10x)
      rm: 500,        // 50% of MQLs
      rr: 300,        // 60% of RMs
      proposta: 200,  // 67% of RRs
      venda: 100,     // 50% of propostas (target: 100 Oxy Hacker/year)
    };
    
    return Math.round(annualMetas[indicator] * periodFraction);
  };

  // Get grouped data for charts (returns array of values per period)
  const getGroupedData = (indicator: OxyHackerIndicator, start: Date, end: Date, grouping: ChartGrouping): { qty: number[]; meta: number[] } => {
    if (!data?.cards || data.cards.length === 0) return { qty: [], meta: [] };

    const qtyArray: number[] = [];
    const metaArray: number[] = [];
    
    const daysInYear = 365;
    const annualMetas: Record<OxyHackerIndicator, number> = {
      mql: 1000,
      rm: 500,
      rr: 300,
      proposta: 200,
      venda: 100,
    };
    const dailyMeta = annualMetas[indicator] / daysInYear;

    if (grouping === 'daily') {
      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).getTime();
        
        let dayQty = 0;
        for (const card of data.cards) {
          const cardTime = card.dataUltimaFase.getTime();
          if (cardTime >= dayStart && cardTime <= dayEnd) {
            const cardIndicator = PHASE_TO_INDICATOR[card.faseAtual];
            if (cardIndicator === indicator) {
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
        for (const card of data.cards) {
          const cardTime = card.dataUltimaFase.getTime();
          if (cardTime >= weekStartTime && cardTime <= weekEndTime) {
            const cardIndicator = PHASE_TO_INDICATOR[card.faseAtual];
            if (cardIndicator === indicator) {
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
        for (const card of data.cards) {
          const cardTime = card.dataUltimaFase.getTime();
          if (cardTime >= monthStart && cardTime <= monthEnd) {
            const cardIndicator = PHASE_TO_INDICATOR[card.faseAtual];
            if (cardIndicator === indicator) {
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
    cards: data?.cards ?? [],
    isLoading,
    error,
    refetch,
    getQtyForPeriod,
    getMetaForPeriod,
    getGroupedData,
  };
}
