import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import type { BuType, MonthType } from "./useMonetaryMetas";
import { MONTHS } from "./useMonetaryMetas";

// Mapeamento de grupos DRE para BUs internas
const DRE_GROUP_TO_BU: Record<string, BuType> = {
  'CaaS': 'modelo_atual',
  'caas': 'modelo_atual',
  'Tax': 'o2_tax',
  'tax': 'o2_tax',
  'SaaS': 'oxy_hacker',
  'saas': 'oxy_hacker',
  'Expansão': 'franquia',
  'expansao': 'franquia',
  'Expansao': 'franquia',
};

const MONTH_INDEX_TO_NAME: Record<number, MonthType> = {
  0: 'Jan', 1: 'Fev', 2: 'Mar', 3: 'Abr',
  4: 'Mai', 5: 'Jun', 6: 'Jul', 7: 'Ago',
  8: 'Set', 9: 'Out', 10: 'Nov', 11: 'Dez',
};

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2, 'abril': 3,
  'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
  'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
  'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3,
  'mai': 4, 'jun': 5, 'jul': 6, 'ago': 7,
  'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
};

export interface CashflowChartPoint {
  month: string;
  inflows: number;
  outflows: number;
  balance: number;
}

export interface OxyFinanceResult {
  dreByBU: Record<BuType, Record<MonthType, number>>;
  dreRaw: any;
  cashflowChart: CashflowChartPoint[];
  cashflowByMonth: Record<MonthType, number>;
  cashflowRaw: any;
  isLoading: boolean;
  error: Error | null;
}

function parseMonthFromDate(dateStr: string): MonthType | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})-(\d{2})/);
  if (match) {
    const monthIdx = parseInt(match[2], 10) - 1;
    return MONTH_INDEX_TO_NAME[monthIdx] || null;
  }
  // Try Portuguese month names
  const lower = dateStr.toLowerCase();
  for (const [name, idx] of Object.entries(MONTH_NAME_TO_INDEX)) {
    if (lower.includes(name)) return MONTH_INDEX_TO_NAME[idx] || null;
  }
  return null;
}

function matchBU(groupName: string): BuType | null {
  if (!groupName) return null;
  // Direct match
  if (DRE_GROUP_TO_BU[groupName]) return DRE_GROUP_TO_BU[groupName];
  // Case-insensitive partial match
  const lower = groupName.toLowerCase();
  for (const [key, bu] of Object.entries(DRE_GROUP_TO_BU)) {
    if (lower.includes(key.toLowerCase())) return bu;
  }
  return null;
}

function initDreByBU(): Record<BuType, Record<MonthType, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const bu of ['modelo_atual', 'o2_tax', 'oxy_hacker', 'franquia']) {
    result[bu] = {};
    for (const m of MONTHS) result[bu][m] = 0;
  }
  return result as Record<BuType, Record<MonthType, number>>;
}

/**
 * Hook para buscar dados financeiros da API Oxy Finance via Edge Function.
 * Retorna DRE por BU/mês e dados de fluxo de caixa.
 */
export function useOxyFinance(year: number = 2026): OxyFinanceResult {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // DRE query
  const { data: dreData, isLoading: dreLoading, error: dreError } = useQuery({
    queryKey: ['oxy-finance-dre', year],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-oxy-finance', {
        body: { action: 'dre', startDate, endDate },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 min cache
    retry: 2,
  });

  // Cashflow chart query
  const { data: cashflowData, isLoading: cfLoading, error: cfError } = useQuery({
    queryKey: ['oxy-finance-cashflow-chart', year],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-oxy-finance', {
        body: { action: 'cashflow_chart', startDate, endDate },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Parse DRE into dreByBU
  const dreByBU = useMemo(() => {
    const result = initDreByBU();
    if (!dreData) return result;

    try {
      // The DRE API returns grouped data - we need to map groups to BUs
      // Structure varies: could be array of rows or nested object
      const rows = Array.isArray(dreData) ? dreData : dreData?.data || dreData?.rows || [];
      
      if (Array.isArray(rows)) {
        for (const row of rows) {
          const group = row.grupo || row.group || row.name || row.categoria || '';
          const bu = matchBU(group);
          if (!bu) continue;

          // Try to extract monthly values
          // Could be in 'months' array, or direct month keys
          if (row.months && Array.isArray(row.months)) {
            for (const monthEntry of row.months) {
              const monthName = parseMonthFromDate(monthEntry.date || monthEntry.month || '');
              if (monthName) {
                result[bu][monthName] += Number(monthEntry.value || monthEntry.total || 0);
              }
            }
          } else {
            // Try direct month keys (janeiro, fevereiro, etc.)
            for (const [key, value] of Object.entries(row)) {
              const monthIdx = MONTH_NAME_TO_INDEX[key.toLowerCase()];
              if (monthIdx !== undefined && typeof value === 'number') {
                const monthName = MONTH_INDEX_TO_NAME[monthIdx];
                if (monthName) result[bu][monthName] += value;
              }
            }
            // Also try short month keys
            for (const m of MONTHS) {
              if (row[m] !== undefined) {
                result[bu][m] += Number(row[m] || 0);
              }
            }
          }

          // Single total value with a date
          if (row.value && row.date) {
            const monthName = parseMonthFromDate(row.date);
            if (monthName) {
              result[bu][monthName] += Number(row.value || 0);
            }
          }
        }
      }
    } catch (e) {
      console.error('[useOxyFinance] Error parsing DRE data:', e);
    }

    return result;
  }, [dreData]);

  // Parse cashflow chart data
  const cashflowChart = useMemo<CashflowChartPoint[]>(() => {
    if (!cashflowData) return [];
    try {
      const items = Array.isArray(cashflowData) ? cashflowData : cashflowData?.items || [];
      return items.map((item: any) => {
        const monthName = parseMonthFromDate(item.month || item.date || '') || '';
        const vals: any[] = item.values || [];
        const getVal = (label: string) => {
          const found = vals.find((v: any) => v.label === label);
          return found ? Number(found.value || 0) : 0;
        };
        return {
          month: monthName,
          inflows: getVal('Entradas'),
          outflows: Math.abs(getVal('Saídas')),
          balance: getVal('Saldo'),
        };
      });
    } catch (e) {
      console.error('[useOxyFinance] Error parsing cashflow data:', e);
      return [];
    }
  }, [cashflowData]);

  // Derive cashflowByMonth: month -> total inflows
  const cashflowByMonth = useMemo<Record<MonthType, number>>(() => {
    const result: Record<string, number> = {};
    for (const m of MONTHS) result[m] = 0;
    for (const point of cashflowChart) {
      const month = point.month as MonthType;
      if (MONTHS.includes(month)) {
        result[month] += point.inflows;
      }
    }
    return result as Record<MonthType, number>;
  }, [cashflowChart]);

  return {
    dreByBU,
    dreRaw: dreData,
    cashflowChart,
    cashflowByMonth,
    cashflowRaw: cashflowData,
    isLoading: dreLoading || cfLoading,
    error: (dreError || cfError) as Error | null,
  };
}
