import { useMemo } from "react";
import { startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import { useModeloAtualMetas } from "./useModeloAtualMetas";
import { useO2TaxMetas } from "./useO2TaxMetas";
import { useOxyHackerMetas } from "./useOxyHackerMetas";
import { useExpansaoMetas } from "./useExpansaoMetas";
import { months, BUKey } from "@/components/planning/salesData";

// Month name to month index (0-based)
const MONTH_INDEX: Record<string, number> = {
  'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3,
  'Mai': 4, 'Jun': 5, 'Jul': 6, 'Ago': 7,
  'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11,
};

export interface FunnelRealized {
  vendas: number;
  propostas: number;
  rrs: number;
  rms: number;
  mqls: number;
  leads: number;
  valor: number;
}

export interface FunnelRealizedByBU {
  [bu: string]: {
    [month: string]: FunnelRealized;
  };
}

export interface SalesRealizedByBU {
  [bu: string]: {
    [month: string]: number;
  };
}

/**
 * Hook que calcula o realizado das vendas e funil completo usando a mesma fonte do Indicadores.
 */
export function useIndicatorsRealized(year: number = 2026) {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const modeloAtual = useModeloAtualMetas(yearStart, yearEnd);
  const o2Tax = useO2TaxMetas(yearStart, yearEnd);
  const oxyHacker = useOxyHackerMetas(yearStart, yearEnd);
  const franquia = useExpansaoMetas(yearStart, yearEnd);

  const isLoading = modeloAtual.isLoading || o2Tax.isLoading || oxyHacker.isLoading || franquia.isLoading;
  const error = modeloAtual.error || o2Tax.error || oxyHacker.error || franquia.error;

  // Full funnel realized by BU and month
  const realizedFunnelByBU = useMemo<FunnelRealizedByBU>(() => {
    const result: FunnelRealizedByBU = {
      modelo_atual: {},
      o2_tax: {},
      oxy_hacker: {},
      franquia: {},
    };

    const buHooks = {
      modelo_atual: modeloAtual,
      o2_tax: o2Tax,
      oxy_hacker: oxyHacker,
      franquia: franquia,
    };

    months.forEach((month) => {
      const monthIndex = MONTH_INDEX[month];
      const mStart = startOfMonth(new Date(year, monthIndex, 1));
      const mEnd = endOfMonth(new Date(year, monthIndex, 1));

      for (const [buKey, hook] of Object.entries(buHooks)) {
        const vendas = hook.getQtyForPeriod('venda', mStart, mEnd);
        const propostas = hook.getQtyForPeriod('proposta', mStart, mEnd);
        const rrs = hook.getQtyForPeriod('rr', mStart, mEnd);
        const rms = hook.getQtyForPeriod('rm', mStart, mEnd);
        const mqls = hook.getQtyForPeriod('mql', mStart, mEnd);
        const leads = hook.getQtyForPeriod('leads', mStart, mEnd);

        // Valor monetário
        let valor: number;
        if (buKey === 'modelo_atual') {
          valor = hook.getValueForPeriod('venda', mStart, mEnd);
        } else if (buKey === 'o2_tax') {
          valor = hook.getValueForPeriod('venda', mStart, mEnd);
        } else {
          valor = hook.getValueForPeriod('venda', mStart, mEnd);
        }

        result[buKey][month] = { vendas, propostas, rrs, rms, mqls, leads, valor };
      }
    });

    return result;
  }, [year, modeloAtual, o2Tax, oxyHacker, franquia]);

  // Backward-compatible realizedByBU (valor only)
  const realizedByBU = useMemo<SalesRealizedByBU>(() => {
    const result: SalesRealizedByBU = {};
    for (const [bu, monthData] of Object.entries(realizedFunnelByBU)) {
      result[bu] = {};
      for (const [month, funnel] of Object.entries(monthData)) {
        result[bu][month] = funnel.valor;
      }
    }
    return result;
  }, [realizedFunnelByBU]);

  const calculateBURealized = (buKey: BUKey): number => {
    return months.reduce((sum, month) => sum + (realizedByBU[buKey]?.[month] || 0), 0);
  };

  const totalRealized = useMemo(() => {
    return Object.keys(realizedByBU).reduce(
      (sum, bu) => sum + calculateBURealized(bu as BUKey),
      0
    );
  }, [realizedByBU]);

  return {
    realizedByBU,
    realizedFunnelByBU,
    calculateBURealized,
    totalRealized,
    isLoading,
    error,
  };
}
