import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DollarSign, ExternalLink } from "lucide-react";
import { useModeloAtualMetas, ChartGrouping } from "@/hooks/useModeloAtualMetas";
import { useModeloAtualAnalytics } from "@/hooks/useModeloAtualAnalytics";
import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";
import { useO2TaxAnalytics } from "@/hooks/useO2TaxAnalytics";
import { useExpansaoMetas } from "@/hooks/useExpansaoMetas";
import { useOxyHackerMetas } from "@/hooks/useOxyHackerMetas";
import { useExpansaoAnalytics } from "@/hooks/useExpansaoAnalytics";
import { differenceInDays, eachDayOfInterval, eachMonthOfInterval, addDays, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BUType } from "@/hooks/useFunnelRealized";
import { DetailSheet, DetailItem, columnFormatters } from "./indicators/DetailSheet";
import { useMediaMetas } from "@/contexts/MediaMetasContext";

interface RevenueBreakdownChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  selectedBUs?: BUType[];
  selectedClosers?: string[];
}

// Base chart data point
interface BaseChartDataPoint {
  label: string;
  total: number;
  meta: number;
  startDate: Date;
  endDate: Date;
}

// Single-BU mode: breakdown by revenue type
interface SingleBuChartDataPoint extends BaseChartDataPoint {
  mrr: number;
  setup: number;
  pontual: number;
}

// Multi-BU mode: breakdown by business unit
interface MultiBuChartDataPoint extends BaseChartDataPoint {
  modelo_atual: number;
  o2_tax: number;
  oxy_hacker: number;
  franquia: number;
}

const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${Math.round(value)}`;
};

// Default ticket values by BU
const DEFAULT_TICKETS = {
  o2_tax: 15000,
  oxy_hacker: 54000,
  franquia: 140000,
};

// BU colors and labels
const BU_COLORS: Record<string, string> = {
  modelo_atual: '#3b82f6',
  o2_tax: '#f59e0b',
  oxy_hacker: '#8b5cf6',
  franquia: '#22c55e',
};

const BU_LABELS: Record<string, string> = {
  modelo_atual: 'Modelo Atual',
  o2_tax: 'O2 TAX',
  oxy_hacker: 'Oxy Hacker',
  franquia: 'Franquia',
};

export function RevenueBreakdownChart({ 
  startDate, 
  endDate, 
  selectedBU, 
  selectedBUs = [],
  selectedClosers = []
}: RevenueBreakdownChartProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailDescription, setDetailDescription] = useState('');
  const [detailItems, setDetailItems] = useState<DetailItem[]>([]);

  // Hooks for data retrieval
  const { movements: maMovements } = useModeloAtualMetas(startDate, endDate);
  const modeloAtualAnalytics = useModeloAtualAnalytics(startDate, endDate);
  
  // O2 TAX hooks
  const o2TaxMetas = useO2TaxMetas(startDate, endDate);
  const o2TaxAnalytics = useO2TaxAnalytics(startDate, endDate);
  
  // Expansion hooks
  const franquiaMetas = useExpansaoMetas(startDate, endDate);
  const oxyHackerMetas = useOxyHackerMetas(startDate, endDate);
  const franquiaAnalytics = useExpansaoAnalytics(startDate, endDate, 'Franquia');
  const oxyHackerAnalytics = useExpansaoAnalytics(startDate, endDate, 'Oxy Hacker');
  
  const { metasPorBU } = useMediaMetas();

  // Check which BUs are selected
  const useModeloAtual = selectedBUs.includes('modelo_atual') || selectedBU === 'modelo_atual';
  const useO2Tax = selectedBUs.includes('o2_tax') || selectedBU === 'o2_tax';
  const useOxyHacker = selectedBUs.includes('oxy_hacker') || selectedBU === 'oxy_hacker';
  const useFranquia = selectedBUs.includes('franquia') || selectedBU === 'franquia';
  
  // Check if at least one BU is selected and count active BUs
  const activeBUs = [useModeloAtual, useO2Tax, useOxyHacker, useFranquia].filter(Boolean);
  const hasAnyBUSelected = activeBUs.length > 0;
  const isMultiBUMode = activeBUs.length > 1;

  // Determine chart grouping based on period length
  const grouping: ChartGrouping = useMemo(() => {
    const days = differenceInDays(endDate, startDate) + 1;
    if (days <= 31) return 'daily';
    if (days <= 90) return 'weekly';
    return 'monthly';
  }, [startDate, endDate]);

  // Calculate pro-rated meta for a period for specific BUs
  const calcularMetaDoPeriodo = (start: Date, end: Date): number => {
    if (!metasPorBU) return 0;
    
    let total = 0;
    
    const busToCheck = [
      { key: 'modelo_atual', active: useModeloAtual },
      { key: 'o2_tax', active: useO2Tax },
      { key: 'oxy_hacker', active: useOxyHacker },
      { key: 'franquia', active: useFranquia },
    ];
    
    for (const bu of busToCheck) {
      if (!bu.active) continue;
      
      const metas = metasPorBU[bu.key as keyof typeof metasPorBU];
      if (!metas || Object.keys(metas).length === 0) continue;
      
      const monthsInPeriod = eachMonthOfInterval({ start, end });
      
      for (const monthDate of monthsInPeriod) {
        const monthName = format(monthDate, 'MMM', { locale: ptBR });
        const monthMeta = metas[monthName] || 0;
        
        const monthStartDate = startOfMonth(monthDate);
        const monthEndDate = endOfMonth(monthDate);
        const overlapStart = start > monthStartDate ? start : monthStartDate;
        const overlapEnd = end < monthEndDate ? end : monthEndDate;
        const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
        const daysInMonth = differenceInDays(monthEndDate, monthStartDate) + 1;
        
        total += monthMeta * (overlapDays / daysInMonth);
      }
    }
    
    return total;
  };

  // Helper to get value for a card considering its BU
  const getO2TaxCardValue = (movement: any): { mrr: number; setup: number; pontual: number } => {
    const mrr = movement.valorMRR || 0;
    const setup = movement.valorSetup || 0;
    const pontual = movement.valorPontual || 0;
    const sum = mrr + setup + pontual;
    
    // If no values, use default ticket
    if (sum === 0) {
      return { mrr: 0, setup: 0, pontual: DEFAULT_TICKETS.o2_tax };
    }
    return { mrr, setup, pontual };
  };

  const getExpansaoCardValue = (movement: any, buType: 'oxy_hacker' | 'franquia'): { mrr: number; setup: number; pontual: number } => {
    const taxaFranquia = movement.taxaFranquia || 0;
    if (taxaFranquia > 0) {
      return { mrr: 0, setup: 0, pontual: taxaFranquia };
    }
    
    const mrr = movement.valorMRR || 0;
    const setup = movement.valorSetup || 0;
    const pontual = movement.valorPontual || 0;
    const sum = mrr + setup + pontual;
    
    if (sum === 0) {
      return { mrr: 0, setup: 0, pontual: DEFAULT_TICKETS[buType] };
    }
    return { mrr, setup, pontual };
  };

  // Get grouped monetary data - returns different structure based on mode
  const getGroupedMonetaryData = useMemo(() => {
    if (!hasAnyBUSelected) {
      return { data: [], isMultiBU: false };
    }

    // Get sales cards for each BU
    const maSalesCards = maMovements.filter(m => m.fase === 'Ganho');
    const maFilteredCards = selectedClosers.length === 0 ? maSalesCards : 
      maSalesCards.filter(m => {
        const analyticsCard = modeloAtualAnalytics.cards.find(c => c.id === m.id);
        return analyticsCard && selectedClosers.includes(analyticsCard.closer?.trim() || '');
      });

    const o2SalesMovements = o2TaxMetas.movements.filter(m => m.fase === 'Ganho');
    const franquiaSalesMovements = franquiaMetas.movements.filter(m => m.fase === 'Ganho');
    const oxyHackerSalesMovements = oxyHackerMetas.movements.filter(m => m.fase === 'Ganho');

    // Helper function to process sales for a period - returns by-BU breakdown
    const processPeriodByBU = (periodStart: Date, periodEnd: Date) => {
      const periodStartTime = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate()).getTime();
      const periodEndTime = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate(), 23, 59, 59, 999).getTime();

      const result = {
        modelo_atual: { mrr: 0, setup: 0, pontual: 0, total: 0 },
        o2_tax: { mrr: 0, setup: 0, pontual: 0, total: 0 },
        oxy_hacker: { mrr: 0, setup: 0, pontual: 0, total: 0 },
        franquia: { mrr: 0, setup: 0, pontual: 0, total: 0 },
      };

      // Process Modelo Atual
      if (useModeloAtual) {
        const seen = new Set<string>();
        for (const card of maFilteredCards) {
          const moveTime = card.dataEntrada.getTime();
          if (moveTime >= periodStartTime && moveTime <= periodEndTime && !seen.has(card.id)) {
            seen.add(card.id);
            result.modelo_atual.mrr += card.valorMRR;
            result.modelo_atual.setup += card.valorSetup;
            result.modelo_atual.pontual += card.valorPontual;
            result.modelo_atual.total += card.valorMRR + card.valorSetup + card.valorPontual;
          }
        }
      }

      // Process O2 TAX
      if (useO2Tax) {
        const seen = new Set<string>();
        for (const mov of o2SalesMovements) {
          const moveTime = mov.dataEntrada.getTime();
          if (moveTime >= periodStartTime && moveTime <= periodEndTime && !seen.has(mov.id)) {
            seen.add(mov.id);
            const values = getO2TaxCardValue(mov);
            result.o2_tax.mrr += values.mrr;
            result.o2_tax.setup += values.setup;
            result.o2_tax.pontual += values.pontual;
            result.o2_tax.total += values.mrr + values.setup + values.pontual;
          }
        }
      }

      // Process Franquia
      if (useFranquia) {
        const seen = new Set<string>();
        for (const mov of franquiaSalesMovements) {
          const moveTime = mov.dataEntrada.getTime();
          if (moveTime >= periodStartTime && moveTime <= periodEndTime && !seen.has(mov.id)) {
            seen.add(mov.id);
            const values = getExpansaoCardValue(mov, 'franquia');
            result.franquia.mrr += values.mrr;
            result.franquia.setup += values.setup;
            result.franquia.pontual += values.pontual;
            result.franquia.total += values.mrr + values.setup + values.pontual;
          }
        }
      }

      // Process Oxy Hacker
      if (useOxyHacker) {
        const seen = new Set<string>();
        for (const mov of oxyHackerSalesMovements) {
          const moveTime = mov.dataEntrada.getTime();
          if (moveTime >= periodStartTime && moveTime <= periodEndTime && !seen.has(mov.id)) {
            seen.add(mov.id);
            const values = getExpansaoCardValue(mov, 'oxy_hacker');
            result.oxy_hacker.mrr += values.mrr;
            result.oxy_hacker.setup += values.setup;
            result.oxy_hacker.pontual += values.pontual;
            result.oxy_hacker.total += values.mrr + values.setup + values.pontual;
          }
        }
      }

      return result;
    };

    // Generate periods based on grouping
    const generatePeriods = () => {
      const periods: { label: string; start: Date; end: Date }[] = [];
      
      if (grouping === 'daily') {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        for (const day of days) {
          periods.push({
            label: format(day, 'd', { locale: ptBR }),
            start: day,
            end: day,
          });
        }
      } else if (grouping === 'weekly') {
        const totalDays = differenceInDays(endDate, startDate) + 1;
        const numWeeks = Math.ceil(totalDays / 7);

        for (let i = 0; i < numWeeks; i++) {
          const weekStart = addDays(startDate, i * 7);
          const weekEnd = i === numWeeks - 1 ? endDate : addDays(weekStart, 6);
          periods.push({
            label: `S${i + 1}`,
            start: weekStart,
            end: weekEnd,
          });
        }
      } else {
        const months = eachMonthOfInterval({ start: startDate, end: endDate });
        for (const monthDate of months) {
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
          periods.push({
            label: format(monthDate, 'MMM', { locale: ptBR }),
            start: monthStart,
            end: lastDay,
          });
        }
      }
      
      return periods;
    };

    const periods = generatePeriods();

    if (isMultiBUMode) {
      // Multi-BU mode: breakdown by business unit
      const result: MultiBuChartDataPoint[] = periods.map(period => {
        const buData = processPeriodByBU(period.start, period.end);
        return {
          label: period.label,
          modelo_atual: buData.modelo_atual.total,
          o2_tax: buData.o2_tax.total,
          oxy_hacker: buData.oxy_hacker.total,
          franquia: buData.franquia.total,
          total: buData.modelo_atual.total + buData.o2_tax.total + buData.oxy_hacker.total + buData.franquia.total,
          meta: calcularMetaDoPeriodo(period.start, period.end),
          startDate: period.start,
          endDate: period.end,
        };
      });
      return { data: result, isMultiBU: true };
    } else {
      // Single-BU mode: breakdown by revenue type
      const result: SingleBuChartDataPoint[] = periods.map(period => {
        const buData = processPeriodByBU(period.start, period.end);
        // Sum all active BUs (should be just one in single mode)
        const mrr = buData.modelo_atual.mrr + buData.o2_tax.mrr + buData.oxy_hacker.mrr + buData.franquia.mrr;
        const setup = buData.modelo_atual.setup + buData.o2_tax.setup + buData.oxy_hacker.setup + buData.franquia.setup;
        const pontual = buData.modelo_atual.pontual + buData.o2_tax.pontual + buData.oxy_hacker.pontual + buData.franquia.pontual;
        
        return {
          label: period.label,
          mrr,
          setup,
          pontual,
          total: mrr + setup + pontual,
          meta: calcularMetaDoPeriodo(period.start, period.end),
          startDate: period.start,
          endDate: period.end,
        };
      });
      return { data: result, isMultiBU: false };
    }
  }, [
    hasAnyBUSelected, isMultiBUMode, useModeloAtual, useO2Tax, useOxyHacker, useFranquia,
    maMovements, modeloAtualAnalytics.cards, selectedClosers,
    o2TaxMetas.movements, franquiaMetas.movements, oxyHackerMetas.movements,
    grouping, startDate, endDate, metasPorBU
  ]);

  // Calculate totals based on mode
  const totals = useMemo(() => {
    const { data, isMultiBU } = getGroupedMonetaryData;
    
    if (isMultiBU) {
      const multiBuData = data as MultiBuChartDataPoint[];
      return {
        modelo_atual: multiBuData.reduce((sum, d) => sum + d.modelo_atual, 0),
        o2_tax: multiBuData.reduce((sum, d) => sum + d.o2_tax, 0),
        oxy_hacker: multiBuData.reduce((sum, d) => sum + d.oxy_hacker, 0),
        franquia: multiBuData.reduce((sum, d) => sum + d.franquia, 0),
        total: multiBuData.reduce((sum, d) => sum + d.total, 0),
        meta: multiBuData.reduce((sum, d) => sum + d.meta, 0),
      };
    } else {
      const singleBuData = data as SingleBuChartDataPoint[];
      return {
        mrr: singleBuData.reduce((sum, d) => sum + d.mrr, 0),
        setup: singleBuData.reduce((sum, d) => sum + d.setup, 0),
        pontual: singleBuData.reduce((sum, d) => sum + d.pontual, 0),
        total: singleBuData.reduce((sum, d) => sum + d.total, 0),
        meta: singleBuData.reduce((sum, d) => sum + d.meta, 0),
      };
    }
  }, [getGroupedMonetaryData]);

  // Handle bar click for drill-down
  const handleBarClick = (data: any) => {
    const periodStart = data.startDate.getTime();
    const periodEnd = new Date(data.endDate.getFullYear(), data.endDate.getMonth(), data.endDate.getDate(), 23, 59, 59, 999).getTime();

    const allItems: DetailItem[] = [];

    // Add Modelo Atual cards
    if (useModeloAtual) {
      const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
      const filteredCards = selectedClosers.length === 0 ? salesCards :
        salesCards.filter(card => selectedClosers.includes(card.closer?.trim() || ''));

      const periodCards = filteredCards.filter(card => {
        const entryTime = card.dataEntrada.getTime();
        return entryTime >= periodStart && entryTime <= periodEnd;
      });

      for (const card of periodCards) {
        allItems.push({
          id: card.id,
          name: card.titulo || card.empresa || 'Sem título',
          company: card.empresa || card.contato,
          phase: card.faseDestino,
          date: card.dataEntrada.toISOString(),
          value: card.valor,
          mrr: card.valorMRR,
          setup: card.valorSetup,
          pontual: card.valorPontual,
          responsible: card.closer || card.responsavel,
          product: 'CaaS',
        });
      }
    }

    // Add O2 TAX cards
    if (useO2Tax) {
      const o2WonData = o2TaxAnalytics.getDealsWon;
      const o2Cards = o2WonData.cards.filter(card => 
        card.dataEntrada.getTime() >= periodStart && 
        card.dataEntrada.getTime() <= periodEnd
      );
      
      for (const card of o2Cards) {
        const values = getO2TaxCardValue(card);
        allItems.push({
          id: card.id,
          name: card.titulo || 'Sem título',
          company: card.contato || card.titulo,
          phase: 'Ganho',
          date: card.dataEntrada.toISOString(),
          value: values.mrr + values.setup + values.pontual,
          mrr: values.mrr,
          setup: values.setup,
          pontual: values.pontual,
          responsible: card.closer || card.responsavel,
          product: 'O2 TAX',
        });
      }
    }

    // Add Franquia cards
    if (useFranquia) {
      const frCards = franquiaAnalytics.getCardsForIndicator('venda');
      const periodCards = frCards.filter(card => 
        card.dataEntrada.getTime() >= periodStart && 
        card.dataEntrada.getTime() <= periodEnd
      );
      
      for (const card of periodCards) {
        const values = getExpansaoCardValue(card, 'franquia');
        allItems.push({
          id: card.id,
          name: card.titulo || 'Sem título',
          company: card.titulo,
          phase: 'Ganho',
          date: card.dataEntrada.toISOString(),
          value: values.mrr + values.setup + values.pontual,
          mrr: values.mrr,
          setup: values.setup,
          pontual: values.pontual,
          responsible: card.responsavel,
          product: 'Franquia',
        });
      }
    }

    // Add Oxy Hacker cards
    if (useOxyHacker) {
      const ohCards = oxyHackerAnalytics.getCardsForIndicator('venda');
      const periodCards = ohCards.filter(card => 
        card.dataEntrada.getTime() >= periodStart && 
        card.dataEntrada.getTime() <= periodEnd
      );
      
      for (const card of periodCards) {
        const values = getExpansaoCardValue(card, 'oxy_hacker');
        allItems.push({
          id: card.id,
          name: card.titulo || 'Sem título',
          company: card.titulo,
          phase: 'Ganho',
          date: card.dataEntrada.toISOString(),
          value: values.mrr + values.setup + values.pontual,
          mrr: values.mrr,
          setup: values.setup,
          pontual: values.pontual,
          responsible: card.responsavel,
          product: 'Oxy Hacker',
        });
      }
    }

    setDetailTitle(`Faturamento - ${data.label}`);
    setDetailDescription(`Vendas realizadas no período`);
    setDetailItems(allItems);
    setDetailOpen(true);
  };

  // Determine columns based on mode
  const detailColumns = isMultiBUMode ? [
    { key: 'product' as keyof DetailItem, label: 'Produto', format: columnFormatters.product },
    { key: 'company' as keyof DetailItem, label: 'Empresa/Contato' },
    { key: 'date' as keyof DetailItem, label: 'Data', format: columnFormatters.date },
    { key: 'value' as keyof DetailItem, label: 'Valor', format: columnFormatters.currency },
    { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
  ] : [
    { key: 'product' as keyof DetailItem, label: 'Produto', format: columnFormatters.product },
    { key: 'company' as keyof DetailItem, label: 'Empresa/Contato' },
    { key: 'date' as keyof DetailItem, label: 'Data', format: columnFormatters.date },
    { key: 'mrr' as keyof DetailItem, label: 'MRR', format: columnFormatters.currency },
    { key: 'setup' as keyof DetailItem, label: 'Setup', format: columnFormatters.currency },
    { key: 'pontual' as keyof DetailItem, label: 'Pontual', format: columnFormatters.currency },
    { key: 'value' as keyof DetailItem, label: 'Total', format: columnFormatters.currency },
    { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
  ];

  // Get selected BU keys for multi-BU mode
  const selectedBUKeys = [
    useModeloAtual && 'modelo_atual',
    useO2Tax && 'o2_tax',
    useOxyHacker && 'oxy_hacker',
    useFranquia && 'franquia',
  ].filter(Boolean) as string[];

  // Don't render if no BU is selected
  if (!hasAnyBUSelected) {
    return null;
  }

  const { isMultiBU } = getGroupedMonetaryData;

  return (
    <>
      <Card className="bg-card border-2 border-green-500 relative group cursor-pointer hover:border-green-400 transition-colors">
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">
                Faturamento por Período
                {isMultiBU && <span className="text-xs text-muted-foreground ml-2">(Consolidado)</span>}
              </CardTitle>
            </div>
          </div>
          {/* Summary totals - dynamic based on mode */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold text-green-500">{formatCompactCurrency(totals.total)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border-2 border-green-500 border-dashed" />
              <span className="text-muted-foreground">Meta:</span>
              <span className="font-medium text-green-500">{formatCompactCurrency(totals.meta)}</span>
            </div>
            {isMultiBU ? (
              // Multi-BU mode: show totals per BU
              selectedBUKeys.map(bu => (
                <div key={bu} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: BU_COLORS[bu] }} />
                  <span className="text-muted-foreground">{BU_LABELS[bu]}:</span>
                  <span className="font-medium">{formatCompactCurrency((totals as any)[bu] || 0)}</span>
                </div>
              ))
            ) : (
              // Single-BU mode: show MRR/Setup/Pontual
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-blue-500" />
                  <span className="text-muted-foreground">MRR:</span>
                  <span className="font-medium">{formatCompactCurrency((totals as any).mrr || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-orange-500" />
                  <span className="text-muted-foreground">Setup:</span>
                  <span className="font-medium">{formatCompactCurrency((totals as any).setup || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-purple-500" />
                  <span className="text-muted-foreground">Pontual:</span>
                  <span className="font-medium">{formatCompactCurrency((totals as any).pontual || 0)}</span>
                </div>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={getGroupedMonetaryData.data} 
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                onClick={(e) => e?.activePayload?.[0]?.payload && handleBarClick(e.activePayload[0].payload)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => formatCompactCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: "8px", 
                    color: "hsl(var(--popover-foreground))" 
                  }}
                  formatter={(value: number, name: string) => [
                    formatCompactCurrency(value),
                    isMultiBU ? BU_LABELS[name] || name : 
                      name === 'mrr' ? 'MRR' : name === 'setup' ? 'Setup' : name === 'pontual' ? 'Pontual' : 'Meta'
                  ]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend 
                  formatter={(value) => (
                    <span style={{ color: 'hsl(var(--foreground))' }}>
                      {isMultiBU ? BU_LABELS[value] || value :
                        value === 'mrr' ? 'MRR' : value === 'setup' ? 'Setup' : value === 'pontual' ? 'Pontual' : 'Meta'}
                    </span>
                  )}
                />
                {isMultiBU ? (
                  // Multi-BU mode: bars per BU
                  <>
                    {useModeloAtual && (
                      <Bar 
                        dataKey="modelo_atual" 
                        stackId="revenue" 
                        fill={BU_COLORS.modelo_atual} 
                        name="modelo_atual" 
                        radius={[0, 0, 0, 0]}
                        className="cursor-pointer"
                      />
                    )}
                    {useO2Tax && (
                      <Bar 
                        dataKey="o2_tax" 
                        stackId="revenue" 
                        fill={BU_COLORS.o2_tax} 
                        name="o2_tax" 
                        radius={[0, 0, 0, 0]}
                        className="cursor-pointer"
                      />
                    )}
                    {useOxyHacker && (
                      <Bar 
                        dataKey="oxy_hacker" 
                        stackId="revenue" 
                        fill={BU_COLORS.oxy_hacker} 
                        name="oxy_hacker" 
                        radius={[0, 0, 0, 0]}
                        className="cursor-pointer"
                      />
                    )}
                    {useFranquia && (
                      <Bar 
                        dataKey="franquia" 
                        stackId="revenue" 
                        fill={BU_COLORS.franquia} 
                        name="franquia" 
                        radius={[4, 4, 0, 0]}
                        className="cursor-pointer"
                      />
                    )}
                  </>
                ) : (
                  // Single-BU mode: MRR/Setup/Pontual bars
                  <>
                    <Bar 
                      dataKey="mrr" 
                      stackId="revenue" 
                      fill="#3b82f6" 
                      name="mrr" 
                      radius={[0, 0, 0, 0]}
                      className="cursor-pointer"
                    />
                    <Bar 
                      dataKey="setup" 
                      stackId="revenue" 
                      fill="#f97316" 
                      name="setup" 
                      radius={[0, 0, 0, 0]}
                      className="cursor-pointer"
                    />
                    <Bar 
                      dataKey="pontual" 
                      stackId="revenue" 
                      fill="#8b5cf6" 
                      name="pontual" 
                      radius={[4, 4, 0, 0]}
                      className="cursor-pointer"
                    />
                  </>
                )}
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={false}
                  name="meta"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <DetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={detailTitle}
        description={detailDescription}
        items={detailItems}
        columns={detailColumns}
      />
    </>
  );
}
