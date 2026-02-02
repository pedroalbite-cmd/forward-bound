import { useMemo } from "react";
import { startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import { useModeloAtualMetas } from "./useModeloAtualMetas";
import { useO2TaxMetas } from "./useO2TaxMetas";
import { useOxyHackerMetas } from "./useOxyHackerMetas";
import { useExpansaoMetas } from "./useExpansaoMetas";
import { months, BUKey } from "@/components/planning/salesData";

// Tickets médios por BU (consistente com Indicadores)
const TICKET_O2_TAX = 15000;      // R$ 15.000
const TICKET_OXY_HACKER = 54000;  // R$ 54.000
const TICKET_FRANQUIA = 140000;   // R$ 140.000

// Month name to month index (0-based)
const MONTH_INDEX: Record<string, number> = {
  'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3,
  'Mai': 4, 'Jun': 5, 'Jul': 6, 'Ago': 7,
  'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11,
};

export interface SalesRealizedByBU {
  [bu: string]: {
    [month: string]: number;
  };
}

/**
 * Hook que calcula o realizado das vendas usando a mesma fonte do Indicadores:
 * - Modelo Atual: getValueForPeriod('venda') do pipefy_moviment_cfos
 * - O2 TAX: getQtyForPeriod('venda') * R$ 15.000 do pipefy_cards_movements
 * - Oxy Hacker: getQtyForPeriod('venda') * R$ 54.000 do pipefy_cards_movements_expansao
 * - Franquia: getQtyForPeriod('venda') * R$ 140.000 do pipefy_cards_movements_expansao
 */
export function useIndicatorsRealized(year: number = 2026) {
  // Define year range for all hooks
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  // Use the same hooks as Indicadores tab
  const modeloAtual = useModeloAtualMetas(yearStart, yearEnd);
  const o2Tax = useO2TaxMetas(yearStart, yearEnd);
  const oxyHacker = useOxyHackerMetas(yearStart, yearEnd);
  const franquia = useExpansaoMetas(yearStart, yearEnd);

  // Combine loading states
  const isLoading = modeloAtual.isLoading || o2Tax.isLoading || oxyHacker.isLoading || franquia.isLoading;
  
  // Combine errors
  const error = modeloAtual.error || o2Tax.error || oxyHacker.error || franquia.error;

  // Calculate realized by BU and month
  const realizedByBU = useMemo<SalesRealizedByBU>(() => {
    const result: SalesRealizedByBU = {
      modelo_atual: {},
      o2_tax: {},
      oxy_hacker: {},
      franquia: {},
    };

    // Calculate for each month
    months.forEach((month) => {
      const monthIndex = MONTH_INDEX[month];
      const monthStart = startOfMonth(new Date(year, monthIndex, 1));
      const monthEnd = endOfMonth(new Date(year, monthIndex, 1));

      // Modelo Atual: usa valor monetário real (soma MRR + Setup + Pontual + Educação)
      result.modelo_atual[month] = modeloAtual.getValueForPeriod('venda', monthStart, monthEnd);

      // O2 TAX: quantidade * ticket médio de R$ 15.000
      const o2TaxQty = o2Tax.getQtyForPeriod('venda', monthStart, monthEnd);
      result.o2_tax[month] = o2TaxQty * TICKET_O2_TAX;

      // Oxy Hacker: quantidade * ticket médio de R$ 54.000
      // (getValueForPeriod já aplica a lógica de Taxa de franquia ou default)
      result.oxy_hacker[month] = oxyHacker.getValueForPeriod('venda', monthStart, monthEnd);

      // Franquia: quantidade * ticket médio de R$ 140.000
      // (getValueForPeriod já aplica a lógica de Taxa de franquia ou default)
      result.franquia[month] = franquia.getValueForPeriod('venda', monthStart, monthEnd);
    });

    return result;
  }, [year, modeloAtual, o2Tax, oxyHacker, franquia]);

  // Calculate total realized per BU
  const calculateBURealized = (buKey: BUKey): number => {
    return months.reduce((sum, month) => sum + (realizedByBU[buKey]?.[month] || 0), 0);
  };

  // Calculate grand total
  const totalRealized = useMemo(() => {
    return Object.keys(realizedByBU).reduce(
      (sum, bu) => sum + calculateBURealized(bu as BUKey),
      0
    );
  }, [realizedByBU]);

  return {
    realizedByBU,
    calculateBURealized,
    totalRealized,
    isLoading,
    error,
  };
}
