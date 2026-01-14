import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Line, ComposedChart, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { RefreshCw, Loader2, CalendarIcon } from "lucide-react";
import { useFunnelRealized, IndicatorType, BUType } from "@/hooks/useFunnelRealized";
import { useSheetMetas, ChartGrouping } from "@/hooks/useSheetMetas";
import { useClosersMetas, CloserIndicator } from "@/hooks/useClosersMetas";
import { useExpansaoMetas, ExpansaoIndicator } from "@/hooks/useExpansaoMetas";
import { useO2TaxMetas, O2TaxIndicator } from "@/hooks/useO2TaxMetas";
import { useOxyHackerMetas, OxyHackerIndicator } from "@/hooks/useOxyHackerMetas";
import { useMediaMetas } from "@/contexts/MediaMetasContext";
import { format, startOfYear, endOfYear, differenceInDays, eachMonthOfInterval, addDays, eachDayOfInterval, getMonth } from "date-fns";
import { FunnelDataItem } from "@/contexts/MediaMetasContext";
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
  useSheetMeta?: boolean; // Flag to use meta from Google Sheets (MQLs)
  useClosersMeta?: boolean; // Flag to use meta from closers sheet (RM, RR, Proposta, Venda)
}

const indicatorConfigs: IndicatorConfig[] = [
  { key: 'mql', label: 'MQLs', shortLabel: 'MQLs', annualMeta: 2400, useSheetMeta: true },
  { key: 'rm', label: 'Reuniões Agendadas', shortLabel: 'Agendadas', annualMeta: 1200, useClosersMeta: true },
  { key: 'rr', label: 'Reuniões Realizadas', shortLabel: 'Realizadas', annualMeta: 960, useClosersMeta: true },
  { key: 'proposta', label: 'Propostas Enviadas', shortLabel: 'Propostas', annualMeta: 480, useClosersMeta: true },
  { key: 'venda', label: 'Vendas', shortLabel: 'Vendas', annualMeta: 240, useClosersMeta: true },
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

  const { getTotal, syncWithPipefy, isSyncing, isLoading } = useFunnelRealized(startDate, endDate);
  const { getMqlsMetaForPeriod, getMqlsQtyForPeriod, getMqlsGroupedData, isLoading: isLoadingMetas } = useSheetMetas(startDate, endDate);
  const { getQtyForPeriod: getClosersQty, getMetaForPeriod: getClosersMeta, getGroupedData: getClosersGroupedData, isLoading: isLoadingClosers } = useClosersMetas(startDate, endDate);
  const { getQtyForPeriod: getExpansaoQty, getGroupedData: getExpansaoGroupedData, isLoading: isLoadingExpansao, refetch: refetchExpansao } = useExpansaoMetas(startDate, endDate);
  const { getQtyForPeriod: getO2TaxQty, getGroupedData: getO2TaxGroupedData, isLoading: isLoadingO2Tax } = useO2TaxMetas(startDate, endDate);
  const { getQtyForPeriod: getOxyHackerQty, getGroupedData: getOxyHackerGroupedData, isLoading: isLoadingOxyHacker } = useOxyHackerMetas(startDate, endDate);
  
  // Get funnelData from MediaMetasContext for dynamic metas
  const { funnelData } = useMediaMetas();
  
  // Month name mapping for funnelData lookup
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Helper function to calculate meta from funnelData for a given period
  const calcularMetaDoPeriodo = (
    funnelItems: FunnelDataItem[] | undefined,
    indicatorKey: IndicatorType,
    start: Date,
    end: Date
  ): number => {
    if (!funnelItems || funnelItems.length === 0) return 0;
    
    const monthsInPeriod = eachMonthOfInterval({ start, end });
    let total = 0;
    
    for (const monthDate of monthsInPeriod) {
      const monthName = monthNames[getMonth(monthDate)];
      const item = funnelItems.find(f => f.month === monthName);
      if (item) {
        switch (indicatorKey) {
          case 'mql': total += item.mqls; break;
          case 'rm': total += item.rms; break;
          case 'rr': total += item.rrs; break;
          case 'proposta': total += item.propostas; break;
          case 'venda': total += item.vendas; break;
        }
      }
    }
    return Math.round(total);
  };
  
  // Helper function to get monthly metas array from funnelData for charts
  const getMonthlyMetasFromFunnel = (
    funnelItems: FunnelDataItem[] | undefined,
    indicatorKey: IndicatorType,
    start: Date,
    end: Date
  ): number[] => {
    if (!funnelItems || funnelItems.length === 0) return [];
    
    const monthsInPeriod = eachMonthOfInterval({ start, end });
    return monthsInPeriod.map(monthDate => {
      const monthName = monthNames[getMonth(monthDate)];
      const item = funnelItems.find(f => f.month === monthName);
      if (!item) return 0;
      
      switch (indicatorKey) {
        case 'mql': return Math.round(item.mqls);
        case 'rm': return Math.round(item.rms);
        case 'rr': return Math.round(item.rrs);
        case 'proposta': return Math.round(item.propostas);
        case 'venda': return Math.round(item.vendas);
        default: return 0;
      }
    });
  };

  // Check if we should use external database data
  const useExpansaoData = selectedBU === 'franquia';
  const useO2TaxData = selectedBU === 'o2_tax';
  const useOxyHackerData = selectedBU === 'oxy_hacker';

  const daysInPeriod = differenceInDays(endDate, startDate) + 1;
  const periodFraction = daysInPeriod / 365;
  
  // Determine grouping based on period length
  const grouping: ChartGrouping = daysInPeriod <= 31 ? 'daily' : daysInPeriod <= 90 ? 'weekly' : 'monthly';

  // Generate chart labels based on grouping
  const getChartLabels = (): string[] => {
    if (grouping === 'daily') {
      return eachDayOfInterval({ start: startDate, end: endDate }).map(day => 
        format(day, "d 'de' MMM", { locale: ptBR })
      );
    } else if (grouping === 'weekly') {
      const numWeeks = Math.ceil(daysInPeriod / 7);
      return Array.from({ length: numWeeks }, (_, i) => {
        const weekStart = addDays(startDate, i * 7);
        return format(weekStart, "d 'de' MMM", { locale: ptBR });
      });
    } else {
      return eachMonthOfInterval({ start: startDate, end: endDate }).map(monthDate => 
        format(monthDate, "MMM", { locale: ptBR })
      );
    }
  };

  const chartLabels = getChartLabels();

  // Get meta for indicator - uses funnelData from Plan Growth for O2 TAX/Oxy Hacker/Franquia
  const getMetaForIndicator = (indicator: IndicatorConfig) => {
    // For Franquia BU, use funnelData from Plan Growth
    if (useExpansaoData && funnelData?.franquia) {
      return calcularMetaDoPeriodo(funnelData.franquia, indicator.key, startDate, endDate);
    }
    
    // For O2 TAX BU, use funnelData from Plan Growth
    if (useO2TaxData && funnelData?.o2Tax) {
      return calcularMetaDoPeriodo(funnelData.o2Tax, indicator.key, startDate, endDate);
    }
    
    // For Oxy Hacker BU, use funnelData from Plan Growth
    if (useOxyHackerData && funnelData?.oxyHacker) {
      return calcularMetaDoPeriodo(funnelData.oxyHacker, indicator.key, startDate, endDate);
    }
    
    if (indicator.useSheetMeta && indicator.key === 'mql') {
      const sheetMeta = getMqlsMetaForPeriod(startDate, endDate);
      if (sheetMeta > 0) return sheetMeta;
    }
    if (indicator.useClosersMeta && (indicator.key === 'rm' || indicator.key === 'rr' || indicator.key === 'proposta' || indicator.key === 'venda')) {
      const closersMeta = getClosersMeta(indicator.key, startDate, endDate);
      if (closersMeta > 0) return closersMeta;
    }
    return Math.round(indicator.annualMeta * periodFraction);
  };

  // Get realized value for indicator - uses external db data for Franquia/O2 TAX/Oxy Hacker, sheet qty for MQLs, closers qty for others
  const getRealizedForIndicator = (indicator: IndicatorConfig) => {
    // For Franquia BU, use expansão data from external database
    if (useExpansaoData) {
      return getExpansaoQty(indicator.key as ExpansaoIndicator, startDate, endDate);
    }
    
    // For O2 TAX BU, use O2 TAX data from external database
    if (useO2TaxData) {
      return getO2TaxQty(indicator.key as O2TaxIndicator, startDate, endDate);
    }
    
    // For Oxy Hacker BU, use Oxy Hacker data from external database
    if (useOxyHackerData) {
      return getOxyHackerQty(indicator.key as OxyHackerIndicator, startDate, endDate);
    }
    
    if (indicator.useSheetMeta && indicator.key === 'mql') {
      const sheetQty = getMqlsQtyForPeriod(startDate, endDate);
      if (sheetQty > 0) return sheetQty;
    }
    if (indicator.useClosersMeta && (indicator.key === 'rm' || indicator.key === 'rr' || indicator.key === 'proposta' || indicator.key === 'venda')) {
      const closersQty = getClosersQty(indicator.key, startDate, endDate);
      if (closersQty > 0) return closersQty;
    }
    return getTotal(indicator.key, selectedBU);
  };

  const buildChartData = (indicator: IndicatorConfig) => {
    // For Franquia BU, use funnelData metas from Plan Growth + realized from external db
    if (useExpansaoData) {
      const expansaoData = getExpansaoGroupedData(indicator.key as ExpansaoIndicator, startDate, endDate, grouping);
      const funnelMetas = funnelData?.franquia ? getMonthlyMetasFromFunnel(funnelData.franquia, indicator.key, startDate, endDate) : [];
      
      return chartLabels.map((label, index) => ({ 
        label, 
        realizado: expansaoData.qty[index] || 0, 
        meta: grouping === 'monthly' && funnelMetas[index] !== undefined ? funnelMetas[index] : expansaoData.meta[index] || 0 
      }));
    }
    
    // For O2 TAX BU, use funnelData metas from Plan Growth + realized from external db
    if (useO2TaxData) {
      const o2taxData = getO2TaxGroupedData(indicator.key as O2TaxIndicator, startDate, endDate, grouping);
      const funnelMetas = funnelData?.o2Tax ? getMonthlyMetasFromFunnel(funnelData.o2Tax, indicator.key, startDate, endDate) : [];
      
      return chartLabels.map((label, index) => ({ 
        label, 
        realizado: o2taxData.qty[index] || 0, 
        meta: grouping === 'monthly' && funnelMetas[index] !== undefined ? funnelMetas[index] : o2taxData.meta[index] || 0 
      }));
    }
    
    // For Oxy Hacker BU, use funnelData metas from Plan Growth + realized from external db
    if (useOxyHackerData) {
      const oxyHackerData = getOxyHackerGroupedData(indicator.key as OxyHackerIndicator, startDate, endDate, grouping);
      const funnelMetas = funnelData?.oxyHacker ? getMonthlyMetasFromFunnel(funnelData.oxyHacker, indicator.key, startDate, endDate) : [];
      
      return chartLabels.map((label, index) => ({ 
        label, 
        realizado: oxyHackerData.qty[index] || 0, 
        meta: grouping === 'monthly' && funnelMetas[index] !== undefined ? funnelMetas[index] : oxyHackerData.meta[index] || 0 
      }));
    }
    
    // For MQLs, use sheet data
    if (indicator.useSheetMeta && indicator.key === 'mql') {
      const sheetData = getMqlsGroupedData(startDate, endDate, grouping);
      return chartLabels.map((label, index) => ({ 
        label, 
        realizado: sheetData.qty[index] || 0, 
        meta: sheetData.meta[index] || 0 
      }));
    }
    
    // For closers indicators (RM, RR, Proposta, Venda), use closers sheet data
    if (indicator.useClosersMeta && (indicator.key === 'rm' || indicator.key === 'rr' || indicator.key === 'proposta' || indicator.key === 'venda')) {
      const closersData = getClosersGroupedData(indicator.key as CloserIndicator, startDate, endDate, grouping);
      return chartLabels.map((label, index) => ({ 
        label, 
        realizado: closersData.qty[index] || 0, 
        meta: closersData.meta[index] || 0 
      }));
    }
    
    // Fallback for other indicators (shouldn't be reached with current config)
    const metaDiaria = indicator.annualMeta / 365;
    
    const getMetaPerPoint = (index: number): number => {
      if (grouping === 'daily') {
        return metaDiaria;
      } else if (grouping === 'weekly') {
        const numWeeks = chartLabels.length;
        const fullWeekDays = 7;
        const lastWeekDays = daysInPeriod - (numWeeks - 1) * 7;
        return metaDiaria * (index === numWeeks - 1 ? lastWeekDays : fullWeekDays);
      } else {
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
      realizado: 0, 
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
          <RadialProgressCard key={indicator.key} title={indicator.label} realized={getRealizedForIndicator(indicator)} meta={getMetaForIndicator(indicator)} />
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
            realizedTotal={getRealizedForIndicator(indicator)} metaTotal={getMetaForIndicator(indicator)}
            chartData={buildChartData(indicator)} gradientId={`gradient-${indicator.key}`} />
        ))}
      </div>

      {(isLoading || isLoadingExpansao || isLoadingO2Tax) && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-2 bg-card p-4 rounded-lg shadow-lg"><Loader2 className="h-5 w-5 animate-spin" /><span>Carregando dados...</span></div>
        </div>
      )}
    </div>
  );
}
