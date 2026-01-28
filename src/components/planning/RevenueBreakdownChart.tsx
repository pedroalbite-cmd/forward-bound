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

interface ChartDataPoint {
  label: string;
  mrr: number;
  setup: number;
  pontual: number;
  total: number;
  meta: number;
  startDate: Date;
  endDate: Date;
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
  
  // Check if at least one BU is selected
  const hasAnyBUSelected = useModeloAtual || useO2Tax || useOxyHacker || useFranquia;

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

  // Get grouped monetary data aggregating all BUs
  const getGroupedMonetaryData = useMemo(() => {
    if (!hasAnyBUSelected) {
      return { data: [] as ChartDataPoint[] };
    }

    const result: ChartDataPoint[] = [];

    // Get Modelo Atual sales cards (fase === 'Ganho')
    const maSalesCards = maMovements.filter(m => m.fase === 'Ganho');
    const maFilteredCards = selectedClosers.length === 0 ? maSalesCards : 
      maSalesCards.filter(m => {
        const analyticsCard = modeloAtualAnalytics.cards.find(c => c.id === m.id);
        return analyticsCard && selectedClosers.includes(analyticsCard.closer?.trim() || '');
      });

    // Get O2 TAX sales (cards that entered 'Ganho' phase)
    const o2SalesMovements = o2TaxMetas.movements.filter(m => m.fase === 'Ganho');
    
    // Get Franquia and Oxy Hacker sales
    const franquiaSalesMovements = franquiaMetas.movements.filter(m => m.fase === 'Ganho');
    const oxyHackerSalesMovements = oxyHackerMetas.movements.filter(m => m.fase === 'Ganho');

    // Helper function to process sales for a period
    const processPeriod = (periodStart: Date, periodEnd: Date) => {
      const periodStartTime = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate()).getTime();
      const periodEndTime = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate(), 23, 59, 59, 999).getTime();

      let mrr = 0, setup = 0, pontual = 0;
      const processedIds = new Set<string>();

      // Process Modelo Atual
      if (useModeloAtual) {
        for (const card of maFilteredCards) {
          const moveTime = card.dataEntrada.getTime();
          if (moveTime >= periodStartTime && moveTime <= periodEndTime && !processedIds.has(`ma-${card.id}`)) {
            processedIds.add(`ma-${card.id}`);
            mrr += card.valorMRR;
            setup += card.valorSetup;
            pontual += card.valorPontual;
          }
        }
      }

      // Process O2 TAX
      if (useO2Tax) {
        const o2Seen = new Set<string>();
        for (const mov of o2SalesMovements) {
          const moveTime = mov.dataEntrada.getTime();
          if (moveTime >= periodStartTime && moveTime <= periodEndTime && !o2Seen.has(mov.id)) {
            o2Seen.add(mov.id);
            const values = getO2TaxCardValue(mov);
            mrr += values.mrr;
            setup += values.setup;
            pontual += values.pontual;
          }
        }
      }

      // Process Franquia
      if (useFranquia) {
        const frSeen = new Set<string>();
        for (const mov of franquiaSalesMovements) {
          const moveTime = mov.dataEntrada.getTime();
          if (moveTime >= periodStartTime && moveTime <= periodEndTime && !frSeen.has(mov.id)) {
            frSeen.add(mov.id);
            const values = getExpansaoCardValue(mov, 'franquia');
            mrr += values.mrr;
            setup += values.setup;
            pontual += values.pontual;
          }
        }
      }

      // Process Oxy Hacker
      if (useOxyHacker) {
        const ohSeen = new Set<string>();
        for (const mov of oxyHackerSalesMovements) {
          const moveTime = mov.dataEntrada.getTime();
          if (moveTime >= periodStartTime && moveTime <= periodEndTime && !ohSeen.has(mov.id)) {
            ohSeen.add(mov.id);
            const values = getExpansaoCardValue(mov, 'oxy_hacker');
            mrr += values.mrr;
            setup += values.setup;
            pontual += values.pontual;
          }
        }
      }

      return { mrr, setup, pontual };
    };

    if (grouping === 'daily') {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      for (const day of days) {
        const values = processPeriod(day, day);
        result.push({
          label: format(day, 'd', { locale: ptBR }),
          mrr: values.mrr,
          setup: values.setup,
          pontual: values.pontual,
          total: values.mrr + values.setup + values.pontual,
          meta: calcularMetaDoPeriodo(day, day),
          startDate: day,
          endDate: day,
        });
      }
    } else if (grouping === 'weekly') {
      const totalDays = differenceInDays(endDate, startDate) + 1;
      const numWeeks = Math.ceil(totalDays / 7);

      for (let i = 0; i < numWeeks; i++) {
        const weekStart = addDays(startDate, i * 7);
        const weekEnd = i === numWeeks - 1 ? endDate : addDays(weekStart, 6);
        const values = processPeriod(weekStart, weekEnd);

        result.push({
          label: `S${i + 1}`,
          mrr: values.mrr,
          setup: values.setup,
          pontual: values.pontual,
          total: values.mrr + values.setup + values.pontual,
          meta: calcularMetaDoPeriodo(weekStart, weekEnd),
          startDate: weekStart,
          endDate: weekEnd,
        });
      }
    } else {
      // Monthly
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      for (const monthDate of months) {
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const values = processPeriod(monthStart, lastDay);

        result.push({
          label: format(monthDate, 'MMM', { locale: ptBR }),
          mrr: values.mrr,
          setup: values.setup,
          pontual: values.pontual,
          total: values.mrr + values.setup + values.pontual,
          meta: calcularMetaDoPeriodo(monthStart, lastDay),
          startDate: monthStart,
          endDate: lastDay,
        });
      }
    }

    return { data: result };
  }, [
    hasAnyBUSelected, useModeloAtual, useO2Tax, useOxyHacker, useFranquia,
    maMovements, modeloAtualAnalytics.cards, selectedClosers,
    o2TaxMetas.movements, franquiaMetas.movements, oxyHackerMetas.movements,
    grouping, startDate, endDate, metasPorBU
  ]);

  // Calculate totals
  const totals = useMemo(() => {
    const data = getGroupedMonetaryData.data;
    return {
      mrr: data.reduce((sum, d) => sum + d.mrr, 0),
      setup: data.reduce((sum, d) => sum + d.setup, 0),
      pontual: data.reduce((sum, d) => sum + d.pontual, 0),
      total: data.reduce((sum, d) => sum + d.total, 0),
      meta: data.reduce((sum, d) => sum + d.meta, 0),
    };
  }, [getGroupedMonetaryData]);

  // Handle bar click for drill-down
  const handleBarClick = (data: ChartDataPoint) => {
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
    setDetailDescription(`Vendas realizadas no período (MRR + Setup + Pontual)`);
    setDetailItems(allItems);
    setDetailOpen(true);
  };

  const detailColumns = [
    { key: 'product' as keyof DetailItem, label: 'Produto', format: columnFormatters.product },
    { key: 'company' as keyof DetailItem, label: 'Empresa/Contato' },
    { key: 'date' as keyof DetailItem, label: 'Data', format: columnFormatters.date },
    { key: 'mrr' as keyof DetailItem, label: 'MRR', format: columnFormatters.currency },
    { key: 'setup' as keyof DetailItem, label: 'Setup', format: columnFormatters.currency },
    { key: 'pontual' as keyof DetailItem, label: 'Pontual', format: columnFormatters.currency },
    { key: 'value' as keyof DetailItem, label: 'Total', format: columnFormatters.currency },
    { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
  ];

  // Don't render if no BU is selected
  if (!hasAnyBUSelected) {
    return null;
  }

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
              <CardTitle className="text-base font-semibold text-foreground">Faturamento por Período</CardTitle>
            </div>
          </div>
          {/* Summary totals */}
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-muted-foreground">MRR:</span>
              <span className="font-medium">{formatCompactCurrency(totals.mrr)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-orange-500" />
              <span className="text-muted-foreground">Setup:</span>
              <span className="font-medium">{formatCompactCurrency(totals.setup)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-purple-500" />
              <span className="text-muted-foreground">Pontual:</span>
              <span className="font-medium">{formatCompactCurrency(totals.pontual)}</span>
            </div>
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
                    name === 'mrr' ? 'MRR' : name === 'setup' ? 'Setup' : name === 'pontual' ? 'Pontual' : 'Meta'
                  ]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend 
                  formatter={(value) => (
                    <span style={{ color: 'hsl(var(--foreground))' }}>
                      {value === 'mrr' ? 'MRR' : value === 'setup' ? 'Setup' : value === 'pontual' ? 'Pontual' : 'Meta'}
                    </span>
                  )}
                />
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
