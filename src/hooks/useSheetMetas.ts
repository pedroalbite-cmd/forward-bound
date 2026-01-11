import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SheetMetaRow {
  date: Date;
  qty: number;
  meta: number;
}

interface SheetMetasResult {
  mqls: SheetMetaRow[];
}

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

export function useSheetMetas(startDate?: Date, endDate?: Date) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sheet-metas', 'mqls', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<SheetMetasResult> => {
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('read-sheet-tab', {
        body: { sheetName: 'MQLs Meta', maxRows: 1000 }
      });

      if (fetchError) {
        console.error('Error fetching sheet metas:', fetchError);
        throw fetchError;
      }

      if (!responseData?.success || !responseData?.data) {
        console.warn('No data returned from sheet');
        return { mqls: [] };
      }

      // Parse the data
      const mqls: SheetMetaRow[] = [];
      for (const row of responseData.data) {
        const date = parseGoogleDate(row.Data);
        if (!date) continue;
        
        mqls.push({
          date,
          qty: typeof row.Qtd === 'number' ? row.Qtd : 0,
          meta: typeof row.Meta === 'number' ? row.Meta : 0,
        });
      }

      return { mqls };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Calculate total meta for a date range
  const getMqlsMetaForPeriod = (start?: Date, end?: Date): number => {
    if (!data?.mqls || data.mqls.length === 0) return 0;
    
    const startTime = start?.getTime() ?? 0;
    const endTime = end?.getTime() ?? Date.now();
    
    // Sum up daily metas within the period
    let totalMeta = 0;
    for (const row of data.mqls) {
      const rowTime = row.date.getTime();
      if (rowTime >= startTime && rowTime <= endTime) {
        totalMeta += row.meta;
      }
    }
    
    // If no data in range, calculate proportionally from available data
    if (totalMeta === 0 && data.mqls.length > 0) {
      // Use average daily meta from available data
      const avgDailyMeta = data.mqls.reduce((sum, r) => sum + r.meta, 0) / data.mqls.length;
      const daysInPeriod = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
      totalMeta = avgDailyMeta * daysInPeriod;
    }
    
    return Math.round(totalMeta);
  };

  return {
    mqls: data?.mqls ?? [],
    isLoading,
    error,
    getMqlsMetaForPeriod,
  };
}
