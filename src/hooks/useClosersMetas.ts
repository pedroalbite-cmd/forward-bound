import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type CloserIndicator = 'rm' | 'rr' | 'proposta' | 'venda';

interface CloserRow {
  date: Date;
  fase: string;
  qty: number;
  meta: number;
}

interface ClosersMetasResult {
  rows: CloserRow[];
}

// Map sheet phase names to indicator keys
const PHASE_TO_INDICATOR: Record<string, CloserIndicator> = {
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

export function useClosersMetas(startDate?: Date, endDate?: Date) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['closers-metas', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<ClosersMetasResult> => {
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('read-sheet-tab', {
        body: { sheetName: 'vendas closers', maxRows: 5000 }
      });

      if (fetchError) {
        console.error('Error fetching closers metas:', fetchError);
        throw fetchError;
      }

      if (!responseData?.success || !responseData?.data) {
        console.warn('No data returned from sheet');
        return { rows: [] };
      }

      // Parse the data
      const rows: CloserRow[] = [];
      for (const row of responseData.data) {
        const date = parseGoogleDate(row.Data);
        if (!date) continue;
        
        const fase = row.Fase as string;
        if (!fase || !PHASE_TO_INDICATOR[fase]) continue;
        
        rows.push({
          date,
          fase,
          qty: typeof row.Qtd === 'number' ? row.Qtd : 0,
          meta: typeof row.Meta === 'number' ? row.Meta : 0,
        });
      }

      return { rows };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Get total qty for a specific indicator and date range
  const getQtyForPeriod = (indicator: CloserIndicator, start?: Date, end?: Date): number => {
    if (!data?.rows || data.rows.length === 0) return 0;
    
    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();
    
    let total = 0;
    for (const row of data.rows) {
      const rowTime = row.date.getTime();
      if (rowTime >= startTime && rowTime <= endTime) {
        const rowIndicator = PHASE_TO_INDICATOR[row.fase];
        if (rowIndicator === indicator) {
          total += row.qty;
        }
      }
    }
    
    console.log(`[useClosersMetas] getQtyForPeriod ${indicator}: ${total}`);
    return Math.round(total);
  };

  // Get total meta for a specific indicator and date range
  const getMetaForPeriod = (indicator: CloserIndicator, start?: Date, end?: Date): number => {
    if (!data?.rows || data.rows.length === 0) return 0;
    
    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();
    
    let total = 0;
    for (const row of data.rows) {
      const rowTime = row.date.getTime();
      if (rowTime >= startTime && rowTime <= endTime) {
        const rowIndicator = PHASE_TO_INDICATOR[row.fase];
        if (rowIndicator === indicator) {
          total += row.meta;
        }
      }
    }
    
    console.log(`[useClosersMetas] getMetaForPeriod ${indicator}: ${total}`);
    return Math.round(total);
  };

  return {
    rows: data?.rows ?? [],
    isLoading,
    error,
    getQtyForPeriod,
    getMetaForPeriod,
  };
}
