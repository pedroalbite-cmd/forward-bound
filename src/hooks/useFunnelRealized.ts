import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type IndicatorType = 'mql' | 'rm' | 'rr' | 'proposta' | 'venda';
export type BUType = 'modelo_atual' | 'o2_tax' | 'oxy_hacker' | 'franquia';

export interface FunnelRealizedRecord {
  id: string;
  bu: string;
  month: string;
  year: number;
  indicator: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface FunnelRealizedByIndicator {
  [indicator: string]: {
    [month: string]: number;
  };
}

export interface FunnelRealizedByBU {
  [bu: string]: FunnelRealizedByIndicator;
}

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function useFunnelRealized(year: number = 2026) {
  const queryClient = useQueryClient();

  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['funnel-realized', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_realized')
        .select('*')
        .eq('year', year);

      if (error) throw error;
      return data as FunnelRealizedRecord[];
    },
  });

  // Structure data by BU and indicator
  const dataByBU: FunnelRealizedByBU = {};
  
  if (rawData) {
    rawData.forEach((record) => {
      if (!dataByBU[record.bu]) {
        dataByBU[record.bu] = {};
      }
      if (!dataByBU[record.bu][record.indicator]) {
        dataByBU[record.bu][record.indicator] = {};
      }
      dataByBU[record.bu][record.indicator][record.month] = record.value;
    });
  }

  // Get value for a specific BU, indicator, and month
  const getValue = (bu: BUType, indicator: IndicatorType, month: string): number => {
    return dataByBU[bu]?.[indicator]?.[month] ?? 0;
  };

  // Get total for a BU and indicator across all months
  const getTotal = (bu: BUType, indicator: IndicatorType): number => {
    const indicatorData = dataByBU[bu]?.[indicator];
    if (!indicatorData) return 0;
    return Object.values(indicatorData).reduce((sum, val) => sum + val, 0);
  };

  // Get total for all BUs for a specific indicator
  const getGrandTotal = (indicator: IndicatorType): number => {
    let total = 0;
    Object.keys(dataByBU).forEach((bu) => {
      total += getTotal(bu as BUType, indicator);
    });
    return total;
  };

  // Get monthly totals for an indicator across all BUs or filtered BU
  const getMonthlyTotals = (indicator: IndicatorType, filterBU?: BUType | 'all'): Record<string, number> => {
    const totals: Record<string, number> = {};
    months.forEach((month) => {
      totals[month] = 0;
    });

    Object.keys(dataByBU).forEach((bu) => {
      if (filterBU && filterBU !== 'all' && bu !== filterBU) return;
      const indicatorData = dataByBU[bu]?.[indicator];
      if (indicatorData) {
        Object.entries(indicatorData).forEach(([month, value]) => {
          totals[month] = (totals[month] || 0) + value;
        });
      }
    });

    return totals;
  };

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-pipefy-funnel');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-realized', year] });
      toast.success('Dados sincronizados com sucesso!');
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Erro ao sincronizar dados do Pipefy');
    },
  });

  return {
    data: rawData,
    dataByBU,
    isLoading,
    error,
    refetch,
    getValue,
    getTotal,
    getGrandTotal,
    getMonthlyTotals,
    syncWithPipefy: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  };
}
