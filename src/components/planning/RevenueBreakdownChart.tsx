import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DollarSign, ExternalLink } from "lucide-react";
import { useModeloAtualMetas, ChartGrouping } from "@/hooks/useModeloAtualMetas";
import { useModeloAtualAnalytics } from "@/hooks/useModeloAtualAnalytics";
import { differenceInDays, eachDayOfInterval, eachMonthOfInterval, addDays, format, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BUType } from "@/hooks/useFunnelRealized";
import { DetailSheet, DetailItem, columnFormatters } from "./indicators/DetailSheet";

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
  const { movements, getMrrForPeriod, getSetupForPeriod, getPontualForPeriod } = useModeloAtualMetas(startDate, endDate);
  const modeloAtualAnalytics = useModeloAtualAnalytics(startDate, endDate);

  // Check which BUs are selected
  const useModeloAtual = selectedBUs.includes('modelo_atual') || selectedBU === 'modelo_atual';

  // Determine chart grouping based on period length
  const grouping: ChartGrouping = useMemo(() => {
    const days = differenceInDays(endDate, startDate) + 1;
    if (days <= 31) return 'daily';
    if (days <= 90) return 'weekly';
    return 'monthly';
  }, [startDate, endDate]);

  // Filter cards by closer if needed
  const filterByCloser = (cards: any[]) => {
    if (selectedClosers.length === 0) return cards;
    return cards.filter(card => selectedClosers.includes(card.closer?.trim() || ''));
  };

  // Get grouped monetary data for Modelo Atual
  const getGroupedMonetaryData = useMemo(() => {
    if (!useModeloAtual || movements.length === 0) {
      return { data: [] as ChartDataPoint[] };
    }

    const result: ChartDataPoint[] = [];

    // Filter cards by 'Ganho' phase (venda) for monetary values
    const salesCards = movements.filter(m => m.fase === 'Ganho');
    const filteredCards = selectedClosers.length === 0 ? salesCards : 
      salesCards.filter(m => {
        // We need to match by card ID with analytics data for closer info
        const analyticsCard = modeloAtualAnalytics.cards.find(c => c.id === m.id);
        return analyticsCard && selectedClosers.includes(analyticsCard.closer?.trim() || '');
      });

    if (grouping === 'daily') {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      for (const day of days) {
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).getTime();

        let mrr = 0, setup = 0, pontual = 0;
        const cardIds = new Set<string>();

        for (const card of filteredCards) {
          const moveTime = card.dataEntrada.getTime();
          if (moveTime >= dayStart && moveTime <= dayEnd && !cardIds.has(card.id)) {
            cardIds.add(card.id);
            mrr += card.valorMRR;
            setup += card.valorSetup;
            pontual += card.valorPontual;
          }
        }

        result.push({
          label: format(day, 'd', { locale: ptBR }),
          mrr,
          setup,
          pontual,
          total: mrr + setup + pontual,
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

        const weekStartTime = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
        const weekEndTime = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999).getTime();

        let mrr = 0, setup = 0, pontual = 0;
        const cardIds = new Set<string>();

        for (const card of filteredCards) {
          const moveTime = card.dataEntrada.getTime();
          if (moveTime >= weekStartTime && moveTime <= weekEndTime && !cardIds.has(card.id)) {
            cardIds.add(card.id);
            mrr += card.valorMRR;
            setup += card.valorSetup;
            pontual += card.valorPontual;
          }
        }

        result.push({
          label: `S${i + 1}`,
          mrr,
          setup,
          pontual,
          total: mrr + setup + pontual,
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
        
        const monthStartTime = monthStart.getTime();
        const monthEndTime = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999).getTime();

        let mrr = 0, setup = 0, pontual = 0;
        const cardIds = new Set<string>();

        for (const card of filteredCards) {
          const moveTime = card.dataEntrada.getTime();
          if (moveTime >= monthStartTime && moveTime <= monthEndTime && !cardIds.has(card.id)) {
            cardIds.add(card.id);
            mrr += card.valorMRR;
            setup += card.valorSetup;
            pontual += card.valorPontual;
          }
        }

        result.push({
          label: format(monthDate, 'MMM', { locale: ptBR }),
          mrr,
          setup,
          pontual,
          total: mrr + setup + pontual,
          startDate: monthStart,
          endDate: lastDay,
        });
      }
    }

    return { data: result };
  }, [useModeloAtual, movements, modeloAtualAnalytics.cards, selectedClosers, grouping, startDate, endDate]);

  // Calculate totals
  const totals = useMemo(() => {
    const data = getGroupedMonetaryData.data;
    return {
      mrr: data.reduce((sum, d) => sum + d.mrr, 0),
      setup: data.reduce((sum, d) => sum + d.setup, 0),
      pontual: data.reduce((sum, d) => sum + d.pontual, 0),
      total: data.reduce((sum, d) => sum + d.total, 0),
    };
  }, [getGroupedMonetaryData]);

  // Handle bar click for drill-down
  const handleBarClick = (data: ChartDataPoint) => {
    if (!useModeloAtual) return;

    const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
    const filteredCards = selectedClosers.length === 0 ? salesCards :
      salesCards.filter(card => selectedClosers.includes(card.closer?.trim() || ''));

    const periodStart = data.startDate.getTime();
    const periodEnd = new Date(data.endDate.getFullYear(), data.endDate.getMonth(), data.endDate.getDate(), 23, 59, 59, 999).getTime();

    const periodCards = filteredCards.filter(card => {
      const entryTime = card.dataEntrada.getTime();
      return entryTime >= periodStart && entryTime <= periodEnd;
    });

    const detailItems: DetailItem[] = periodCards.map(card => ({
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
    }));

    setDetailTitle(`Faturamento - ${data.label}`);
    setDetailDescription(`Vendas realizadas no período (MRR + Setup + Pontual)`);
    setDetailItems(detailItems);
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

  // Don't render if no Modelo Atual data available
  if (!useModeloAtual) {
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
              <BarChart 
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
                    name === 'mrr' ? 'MRR' : name === 'setup' ? 'Setup' : 'Pontual'
                  ]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend 
                  formatter={(value) => (
                    <span style={{ color: 'hsl(var(--foreground))' }}>
                      {value === 'mrr' ? 'MRR' : value === 'setup' ? 'Setup' : 'Pontual'}
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
              </BarChart>
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
