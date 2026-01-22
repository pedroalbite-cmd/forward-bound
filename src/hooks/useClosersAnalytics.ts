import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DetailItem } from "@/components/planning/indicators/DetailSheet";
import { IndicatorType } from "@/hooks/useFunnelRealized";

export interface CloserCard {
  id: string;
  date: Date;
  closer: string;
  fase: string;
  qty: number;
}

// Map sheet phase names to indicator keys (same as useClosersMetas)
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  'Reunião agendada / Qualificado': 'rm',
  'Reunião Realizada': 'rr',
  'Proposta enviada / Follow Up': 'proposta',
  'Contrato assinado': 'venda',
};

// Parse Google Sheets date format "Date(year,month,day)" to JS Date
function parseGoogleDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  if (typeof dateValue === 'string') {
    const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
    // Try ISO format
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

export function useClosersAnalytics(startDate: Date, endDate: Date) {
  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

  const { data, isLoading, error } = useQuery({
    queryKey: ['closers-analytics', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      console.log(`[useClosersAnalytics] Fetching vendas closers for drill-down`);
      
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('read-sheet-tab', {
        body: { sheetName: 'vendas closers', maxRows: 5000 }
      });

      if (fetchError) {
        console.error('Error fetching closers data:', fetchError);
        throw fetchError;
      }

      if (!responseData?.success || !responseData?.data) {
        console.warn('No data returned from vendas closers sheet');
        return { cards: [] };
      }

      const cards: CloserCard[] = [];
      let rowIndex = 0;
      
      for (const row of responseData.data) {
        const date = parseGoogleDate(row.Data);
        if (!date) continue;
        
        const fase = row.Fase as string;
        if (!fase || !PHASE_TO_INDICATOR[fase]) continue;
        
        const qty = typeof row.Qtd === 'number' ? row.Qtd : 0;
        if (qty <= 0) continue;
        
        // Create individual entries for each unit in qty
        for (let i = 0; i < qty; i++) {
          cards.push({
            id: `closer-${rowIndex}-${i}`,
            date,
            closer: row.Closer || 'Não informado',
            fase,
            qty: 1,
          });
        }
        rowIndex++;
      }

      console.log(`[useClosersAnalytics] Parsed ${cards.length} individual entries from vendas closers`);
      return { cards };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const cards = data?.cards ?? [];

  // Filter cards by period
  const cardsInPeriod = useMemo(() => {
    return cards.filter(card => {
      const entryTime = card.date.getTime();
      return entryTime >= startTime && entryTime <= endTime;
    });
  }, [cards, startTime, endTime]);

  // Get cards for a specific indicator
  const getCardsForIndicator = useMemo(() => {
    return (indicator: IndicatorType): CloserCard[] => {
      if (indicator === 'leads' || indicator === 'mql') return [];
      
      const result = cardsInPeriod.filter(card => {
        const cardIndicator = PHASE_TO_INDICATOR[card.fase];
        return cardIndicator === indicator;
      });
      
      console.log(`[useClosersAnalytics] getCardsForIndicator(${indicator}): ${result.length} cards`);
      return result;
    };
  }, [cardsInPeriod]);

  // Helper function to convert CloserCard to DetailItem
  const toDetailItem = (card: CloserCard): DetailItem => ({
    id: card.id,
    name: card.closer,
    phase: card.fase,
    date: card.date.toISOString(),
    responsible: card.closer,
  });

  // Get detail items for a specific indicator
  const getDetailItemsForIndicator = (indicator: IndicatorType): DetailItem[] => {
    if (indicator === 'leads' || indicator === 'mql') {
      return [];
    }
    
    const indicatorCards = getCardsForIndicator(indicator);
    return indicatorCards.map(toDetailItem);
  };

  return {
    isLoading,
    error,
    cards: cardsInPeriod,
    getCardsForIndicator,
    toDetailItem,
    getDetailItemsForIndicator,
  };
}
