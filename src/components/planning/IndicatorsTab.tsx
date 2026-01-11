import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Line, ComposedChart, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { RefreshCw, Loader2, CalendarIcon } from "lucide-react";
import { useFunnelRealized, IndicatorType, BUType } from "@/hooks/useFunnelRealized";
import { useSheetMetas } from "@/hooks/useSheetMetas";
import { useMediaMetas } from "@/contexts/MediaMetasContext";
import { format, startOfYear, endOfYear, differenceInDays, eachMonthOfInterval, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LeadsMqlsStackedChart } from "./LeadsMqlsStackedChart";
import { PeriodFunnelChart } from "./PeriodFunnelChart";

type FilterBU = BUType | 'all';

interface IndicatorConfig {
  key: IndicatorType;
  label: string;
  shortLabel: string;
  annualMeta: number;
  useSheetMeta?: boolean; // Flag to use meta from Google Sheets
}

const indicatorConfigs: IndicatorConfig[] = [
  { key: 'mql', label: 'MQLs', shortLabel: 'MQLs', annualMeta: 2400, useSheetMeta: true },
  { key: 'rm', label: 'Reuniões Agendadas', shortLabel: 'Agendadas', annualMeta: 1200 },
  { key: 'rr', label: 'Reuniões Realizadas', shortLabel: 'Realizadas', annualMeta: 960 },
  { key: 'proposta', label: 'Propostas Enviadas', shortLabel: 'Propostas', annualMeta: 480 },
  { key: 'venda', label: 'Vendas', shortLabel: 'Vendas', annualMeta: 240 },
];

const buOptions: { value: FilterBU; label: string }[] = [
  { value: 'all', label: 'Consolidado' },
  { value: 'modelo_atual', label: 'Modelo Atual' },
  { value: 'o2_tax', label: 'O2 TAX' },
  { value: 'oxy_hacker', label: 'Oxy Hacker' },
  { value: 'franquia', label: 'Franquia' },
];

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));

const RadialProgressCard = ({ title, realized, meta }: { title: string; realized: number; meta: number }) => {
  const percentage = meta > 0 ? (realized / meta) * 100 : 0;
  const isAboveMeta = percentage >= 100;
  const chartData = [{ value: Math.min(percentage, 100), fill: isAboveMeta ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-0">
        <div className="relative w-24 h-24">
          <RadialBarChart width={96} height={96} innerRadius="70%" outerRadius="100%" data={chartData} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} />
          </RadialBarChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{formatNumber(realized)}</span>
            <span className={`text-xs font-medium ${isAboveMeta ? "text-chart-2" : "text-destructive"}`}>{Math.round(percentage)}%</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Meta: {formatNumber(meta)}</p>
      </CardContent>
    </Card>
  );
};

const IndicatorChartSection = ({ title, realizedLabel, realizedTotal, metaTotal, chartData, gradientId }: {
  title: string; realizedLabel: string; realizedTotal: number; metaTotal: number;
  chartData: { label: string; realizado: number; meta: number }[]; gradientId: string;
}) => (
  <Card className="bg-card border-border">
    <CardHeader className="pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">{realizedLabel}: <span className="text-foreground font-medium">{formatNumber(realizedTotal)}</span></span>
          <span className="text-muted-foreground">Meta: <span className="text-foreground font-medium">{formatNumber(metaTotal)}</span></span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-chart-1 rounded" /><span className="text-xs text-muted-foreground">Meta</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-chart-2 rounded" /><span className="text-xs text-muted-foreground">Realizado</span></div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--popover-foreground))" }} />
            <Area type="monotone" dataKey="realizado" stroke="hsl(var(--chart-2))" strokeWidth={2} fill={`url(#${gradientId})`} name="Realizado" />
            <Line type="monotone" dataKey="meta" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Meta" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export function IndicatorsTab() {
  const currentYear = new Date().getFullYear();
  const [selectedBU, setSelectedBU] = useState<FilterBU>('all');
  const [startDate, setStartDate] = useState<Date>(startOfYear(new Date(currentYear, 0, 1)));
  const [endDate, setEndDate] = useState<Date>(endOfYear(new Date(currentYear, 0, 1)));

  const handleSync = () => {
    // Use the year from the start date for sync
    syncWithPipefy(startDate.getFullYear());
  };

  const { getTotal, getChartLabels, getGroupedData, getChartGrouping, syncWithPipefy, isSyncing, isLoading } = useFunnelRealized(startDate, endDate);
  const { getMqlsMetaForPeriod, isLoading: isLoadingMetas } = useSheetMetas(startDate, endDate);

  const daysInPeriod = differenceInDays(endDate, startDate) + 1;
  const periodFraction = daysInPeriod / 365;

  // Get meta for indicator - uses sheet meta for MQLs, calculated meta for others
  const getMetaForIndicator = (indicator: IndicatorConfig) => {
    if (indicator.useSheetMeta && indicator.key === 'mql') {
      const sheetMeta = getMqlsMetaForPeriod(startDate, endDate);
      // If sheet meta is available, use it; otherwise fallback to calculated
      if (sheetMeta > 0) return sheetMeta;
    }
    return Math.round(indicator.annualMeta * periodFraction);
  };

  const chartLabels = getChartLabels();
  const grouping = getChartGrouping();

  const buildChartData = (indicator: IndicatorConfig) => {
    const realizedValues = getGroupedData(indicator.key, selectedBU);
    
    // For MQLs with sheet meta, use proportional distribution based on total meta
    if (indicator.useSheetMeta && indicator.key === 'mql') {
      const totalMeta = getMqlsMetaForPeriod(startDate, endDate);
      if (totalMeta > 0) {
        // Distribute meta proportionally across chart points
        const metaPerPoint = totalMeta / chartLabels.length;
        return chartLabels.map((label, index) => ({ 
          label, 
          realizado: realizedValues[index] || 0, 
          meta: Math.round(metaPerPoint) 
        }));
      }
    }
    
    // Default behavior for other indicators
    const metaDiaria = indicator.annualMeta / 365;
    
    // Calculate meta per data point based on grouping
    const getMetaPerPoint = (index: number): number => {
      if (grouping === 'daily') {
        return metaDiaria;
      } else if (grouping === 'weekly') {
        const totalDays = daysInPeriod;
        const numWeeks = chartLabels.length;
        const fullWeekDays = 7;
        const lastWeekDays = totalDays - (numWeeks - 1) * 7;
        // Last week may have fewer days
        return metaDiaria * (index === numWeeks - 1 ? lastWeekDays : fullWeekDays);
      } else {
        // Monthly: calculate days in each month within the period
        const months = eachMonthOfInterval({ start: startDate, end: endDate });
        if (index >= months.length) return 0;
        const monthStart = months[index];
        const monthEnd = index < months.length - 1 ? addDays(months[index + 1], -1) : endDate;
        const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
        return metaDiaria * daysInMonth;
      }
    };
    
    return chartLabels.map((label, index) => ({ 
      label, 
      realizado: realizedValues[index] || 0, 
      meta: Math.round(getMetaPerPoint(index)) 
    }));
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">Visão Meta Pace</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedBU} onValueChange={(v) => setSelectedBU(v as FilterBU)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{buOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">De:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} locale={ptBR} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Até:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} locale={ptBR} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleSync} disabled={isSyncing} variant="outline" className="gap-2" title="Sincronizar Pipefy">
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Sincronizando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Sincronizar</span>
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Período: {daysInPeriod} dias | Agrupamento: {grouping === 'daily' ? 'Diário' : grouping === 'weekly' ? 'Semanal' : 'Mensal'}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {indicatorConfigs.map((indicator) => (
          <RadialProgressCard key={indicator.key} title={indicator.label} realized={getTotal(indicator.key, selectedBU)} meta={getMetaForIndicator(indicator)} />
        ))}
      </div>

      {/* New Charts - Leads/MQLs and Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadsMqlsStackedChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} />
        <PeriodFunnelChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} />
      </div>

      {/* Charts */}
      <div className="space-y-4">
        {indicatorConfigs.map((indicator) => (
          <IndicatorChartSection key={indicator.key} title={indicator.label} realizedLabel={indicator.shortLabel}
            realizedTotal={getTotal(indicator.key, selectedBU)} metaTotal={getMetaForIndicator(indicator)}
            chartData={buildChartData(indicator)} gradientId={`gradient-${indicator.key}`} />
        ))}
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-2 bg-card p-4 rounded-lg shadow-lg"><Loader2 className="h-5 w-5 animate-spin" /><span>Carregando dados...</span></div>
        </div>
      )}
    </div>
  );
}
