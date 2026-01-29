import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Line, ComposedChart, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { RefreshCw, Loader2, CalendarIcon, BarChart3, TrendingUp, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useFunnelRealized, IndicatorType, BUType } from "@/hooks/useFunnelRealized";
import { useModeloAtualMetas, ChartGrouping, ModeloAtualIndicator } from "@/hooks/useModeloAtualMetas";
import { useExpansaoMetas, ExpansaoIndicator } from "@/hooks/useExpansaoMetas";
import { useO2TaxMetas, O2TaxIndicator } from "@/hooks/useO2TaxMetas";
import { useOxyHackerMetas, OxyHackerIndicator } from "@/hooks/useOxyHackerMetas";
import { useMediaMetas } from "@/contexts/MediaMetasContext";
import { useModeloAtualAnalytics } from "@/hooks/useModeloAtualAnalytics";
import { useO2TaxAnalytics } from "@/hooks/useO2TaxAnalytics";
import { useExpansaoAnalytics } from "@/hooks/useExpansaoAnalytics";
import { useCloserMetas, BU_CLOSERS, BuType, CloserType } from "@/hooks/useCloserMetas";
import { format, startOfYear, endOfYear, endOfDay, differenceInDays, eachMonthOfInterval, addDays, eachDayOfInterval, getMonth, startOfMonth, endOfMonth } from "date-fns";
import { FunnelDataItem } from "@/contexts/MediaMetasContext";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LeadsMqlsStackedChart } from "./LeadsMqlsStackedChart";
import { MeetingsScheduledChart } from "./MeetingsScheduledChart";
import { ClickableFunnelChart } from "./ClickableFunnelChart";
import { RevenueBreakdownChart } from "./RevenueBreakdownChart";
import { RevenueChartComparison } from "./RevenueChartComparison";
import { DetailSheet, DetailItem, columnFormatters } from "./indicators/DetailSheet";
import { KpiItem } from "./indicators/KpiCard";
import { ChartConfig } from "./indicators/DrillDownCharts";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

type ViewMode = 'daily' | 'accumulated';

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

// Monetary indicator configuration
type MonetaryIndicatorKey = 'sla' | 'faturamento' | 'mrr' | 'setup' | 'pontual';

interface MonetaryIndicatorConfig {
  key: MonetaryIndicatorKey;
  label: string;
  shortLabel: string;
  format: 'currency' | 'multiplier' | 'duration';
}

const monetaryIndicatorConfigs: MonetaryIndicatorConfig[] = [
  { key: 'sla', label: 'SLA', shortLabel: 'SLA', format: 'duration' },
  { key: 'faturamento', label: 'Faturamento', shortLabel: 'Fat.', format: 'currency' },
  { key: 'mrr', label: 'MRR', shortLabel: 'MRR', format: 'currency' },
  { key: 'setup', label: 'Setup', shortLabel: 'Setup', format: 'currency' },
  { key: 'pontual', label: 'Pontual', shortLabel: 'Pont.', format: 'currency' },
];

const buOptions: MultiSelectOption[] = [
  { value: 'modelo_atual', label: 'Modelo Atual' },
  { value: 'o2_tax', label: 'O2 TAX' },
  { value: 'oxy_hacker', label: 'Oxy Hacker' },
  { value: 'franquia', label: 'Franquia' },
];

// SDR mapping by BU
const BU_SDRS: Record<BuType, string[]> = {
  modelo_atual: ['Amanda', 'Carol'],
  o2_tax: ['Carlos'],
  oxy_hacker: ['Amanda', 'Carol'],
  franquia: ['Amanda', 'Carol'],
};

// SDR options for MultiSelect
const sdrOptions: MultiSelectOption[] = [
  { value: 'Amanda', label: 'Amanda' },
  { value: 'Carol', label: 'Carol' },
  { value: 'Carlos', label: 'Carlos' },
];

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));

// Format compact currency (R$ 1.2M, R$ 510k)
const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${Math.round(value)}`;
};

// Format ROI multiplier (4.2x)
const formatMultiplier = (value: number): string => {
  return `${value.toFixed(1)}x`;
};

// Format duration in hours/minutes (for SLA indicator)
const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(minutes)}m`;
};

// Helper to find top performer from items
const findTopPerformer = (items: DetailItem[], key: 'responsible' | 'closer'): { name: string; count: number } => {
  const counts = new Map<string, number>();
  items.forEach(item => {
    const value = item[key] || item.responsible || '';
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  let topName = '-';
  let topCount = 0;
  counts.forEach((count, name) => {
    if (count > topCount) { topName = name; topCount = count; }
  });
  return { name: topName, count: topCount };
};

// Helper to find top performer by revenue
const findTopPerformerByRevenue = (items: DetailItem[]): { name: string; total: number }[] => {
  const totals = new Map<string, number>();
  items.forEach(item => {
    const name = item.responsible || item.closer || '';
    if (name) totals.set(name, (totals.get(name) || 0) + (item.value || 0));
  });
  return Array.from(totals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
};

interface RadialProgressCardProps {
  title: string;
  realized: number;
  meta: number;
  onClick?: () => void;
  isClickable?: boolean;
}

const RadialProgressCard = ({ title, realized, meta, onClick, isClickable = false }: RadialProgressCardProps) => {
  const percentage = meta > 0 ? (realized / meta) * 100 : 0;
  const isAboveMeta = percentage >= 100;
  const chartData = [{ value: Math.min(percentage, 100), fill: isAboveMeta ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }];

  return (
    <Card 
      className={cn(
        "bg-card border-border relative group transition-all duration-200",
        isClickable && "cursor-pointer hover:border-primary/50 hover:shadow-md"
      )}
      onClick={onClick}
    >
      {isClickable && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-0">
        <div className="relative w-32 h-32">
          <RadialBarChart width={128} height={128} innerRadius="70%" outerRadius="100%" data={chartData} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} />
          </RadialBarChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{formatNumber(realized)}</span>
            <span className={`text-sm font-medium ${isAboveMeta ? "text-chart-2" : "text-destructive"}`}>{Math.round(percentage)}%</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Meta: {formatNumber(meta)}</p>
      </CardContent>
    </Card>
  );
};

interface MonetaryRadialCardProps {
  title: string;
  realized: number;
  meta: number;
  format: 'currency' | 'multiplier' | 'duration';
  onClick?: () => void;
  isClickable?: boolean;
}

const MonetaryRadialCard = ({ title, realized, meta, format, onClick, isClickable = false }: MonetaryRadialCardProps) => {
  // For SLA (duration format), lower is better - invert the color logic
  const isInverted = format === 'duration';
  const percentage = meta > 0 ? (realized / meta) * 100 : 0;
  const isAboveMeta = isInverted ? percentage <= 100 : percentage >= 100;
  const chartData = [{ value: Math.min(percentage, 100), fill: isAboveMeta ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }];

  const formatValue = format === 'currency' 
    ? formatCompactCurrency 
    : format === 'duration' 
      ? formatDuration 
      : formatMultiplier;

  return (
    <Card 
      className={cn(
        "bg-card border-border relative group transition-all duration-200",
        isClickable && "cursor-pointer hover:border-primary/50 hover:shadow-md"
      )}
      onClick={onClick}
    >
      {isClickable && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-0">
        <div className="relative w-32 h-32">
          <RadialBarChart width={128} height={128} innerRadius="70%" outerRadius="100%" data={chartData} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} />
          </RadialBarChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">{formatValue(realized)}</span>
            <span className={`text-sm font-medium ${isAboveMeta ? "text-chart-2" : "text-destructive"}`}>{Math.round(percentage)}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Meta: {formatValue(meta)}</p>
      </CardContent>
    </Card>
  );
};

const IndicatorChartSection = ({ title, realizedLabel, realizedTotal, metaTotal, chartData, gradientId, isAccumulated }: {
  title: string; realizedLabel: string; realizedTotal: number; metaTotal: number;
  chartData: { label: string; realizado: number; meta: number }[]; gradientId: string; isAccumulated?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="bg-card border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
                {isAccumulated && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Acumulado</span>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">{realizedLabel}: <span className="text-foreground font-medium">{formatNumber(realizedTotal)}</span></span>
                <span className="text-muted-foreground">Meta: <span className="text-foreground font-medium">{formatNumber(metaTotal)}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-chart-1 rounded" /><span className="text-xs text-muted-foreground">{isAccumulated ? 'Meta Acumulada' : 'Meta'}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-chart-2 rounded" /><span className="text-xs text-muted-foreground">{isAccumulated ? 'Realizado Acumulado' : 'Realizado'}</span></div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="h-72">
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
                  <Area type="monotone" dataKey="realizado" stroke="hsl(var(--chart-2))" strokeWidth={2} fill={`url(#${gradientId})`} name={isAccumulated ? "Realizado Acumulado" : "Realizado"} />
                  <Line type="monotone" dataKey="meta" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name={isAccumulated ? "Meta Acumulada" : "Meta"} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export function IndicatorsTab() {
  const currentYear = new Date().getFullYear();
  // Multi-selection state for BUs (all selected by default = "Consolidado")
  const [selectedBUs, setSelectedBUs] = useState<BUType[]>(['modelo_atual', 'o2_tax', 'oxy_hacker', 'franquia']);
  // Multi-selection state for Closers (empty = all closers)
  const [selectedClosers, setSelectedClosers] = useState<string[]>([]);
  // Multi-selection state for SDRs (empty = all SDRs)
  const [selectedSDRs, setSelectedSDRs] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  
  // Detail sheet state for radial cards drill-down
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailSheetTitle, setDetailSheetTitle] = useState('');
  const [detailSheetDescription, setDetailSheetDescription] = useState('');
  const [detailSheetItems, setDetailSheetItems] = useState<DetailItem[]>([]);
  const [detailSheetColumns, setDetailSheetColumns] = useState<{ key: keyof DetailItem; label: string; format?: (value: any) => React.ReactNode }[]>([]);
  const [detailSheetKpis, setDetailSheetKpis] = useState<KpiItem[]>([]);
  const [detailSheetCharts, setDetailSheetCharts] = useState<ChartConfig[]>([]);
  

  const handleSync = () => {
    // Use the year from the start date for sync
    syncWithPipefy(startDate.getFullYear());
  };

  const { getTotal, syncWithPipefy, isSyncing, isLoading } = useFunnelRealized(startDate, endDate);
  const { getQtyForPeriod: getModeloAtualQty, getValueForPeriod: getModeloAtualValue, getMrrForPeriod, getSetupForPeriod, getPontualForPeriod, getGroupedData: getModeloAtualGroupedData, isLoading: isLoadingModeloAtual } = useModeloAtualMetas(startDate, endDate);
  const { getQtyForPeriod: getExpansaoQty, getGroupedData: getExpansaoGroupedData, isLoading: isLoadingExpansao, refetch: refetchExpansao } = useExpansaoMetas(startDate, endDate);
  const { getQtyForPeriod: getO2TaxQty, getGroupedData: getO2TaxGroupedData, isLoading: isLoadingO2Tax } = useO2TaxMetas(startDate, endDate);
  const { getQtyForPeriod: getOxyHackerQty, getGroupedData: getOxyHackerGroupedData, isLoading: isLoadingOxyHacker } = useOxyHackerMetas(startDate, endDate);
  
  // Analytics hooks for drill-down
  const modeloAtualAnalytics = useModeloAtualAnalytics(startDate, endDate);
  const o2TaxAnalytics = useO2TaxAnalytics(startDate, endDate);
  const franquiaAnalytics = useExpansaoAnalytics(startDate, endDate, 'Franquia');
  const oxyHackerAnalytics = useExpansaoAnalytics(startDate, endDate, 'Oxy Hacker');
  
  // Get funnelData from MediaMetasContext for dynamic metas
  const { funnelData } = useMediaMetas();
  
  // Get closer metas for filtering goals by closer percentage
  const { getFilteredMeta } = useCloserMetas(currentYear);

  // Derive helper flags from multi-selection
  const isConsolidado = selectedBUs.length === 4;
  const hasSingleBU = selectedBUs.length === 1;
  const selectedBU: BUType | 'all' = hasSingleBU ? selectedBUs[0] : 'all';

  // Calculate available closers based on selected BUs
  const availableClosers: MultiSelectOption[] = useMemo(() => {
    const closersSet = new Set<string>();
    
    selectedBUs.forEach(bu => {
      const buClosers = BU_CLOSERS[bu as BuType] || [];
      buClosers.forEach(closer => closersSet.add(closer));
    });
    
    const allClosers = [
      { value: 'Pedro Albite', label: 'Pedro' },
      { value: 'Daniel Trindade', label: 'Daniel' },
      { value: 'Lucas Ilha', label: 'Lucas' },
    ];
    
    return allClosers.filter(c => closersSet.has(c.value));
  }, [selectedBUs]);

  // Calculate available SDRs based on selected BUs
  const availableSDRs: MultiSelectOption[] = useMemo(() => {
    const sdrsSet = new Set<string>();
    
    selectedBUs.forEach(bu => {
      const buSdrs = BU_SDRS[bu as BuType] || [];
      buSdrs.forEach(sdr => sdrsSet.add(sdr));
    });
    
    return sdrOptions.filter(s => sdrsSet.has(s.value));
  }, [selectedBUs]);

  // Clear selected closers that are not valid for the current BU selection
  useEffect(() => {
    const validClosers = selectedClosers.filter(closer => {
      return selectedBUs.some(bu => BU_CLOSERS[bu as BuType]?.includes(closer as CloserType));
    });
    
    if (validClosers.length !== selectedClosers.length) {
      setSelectedClosers(validClosers);
    }
  }, [selectedBUs, selectedClosers]);

  // Clear selected SDRs that are not valid for the current BU selection
  useEffect(() => {
    const validSDRs = selectedSDRs.filter(sdr => {
      return selectedBUs.some(bu => BU_SDRS[bu as BuType]?.includes(sdr));
    });
    
    if (validSDRs.length !== selectedSDRs.length) {
      setSelectedSDRs(validSDRs);
    }
  }, [selectedBUs, selectedSDRs]);

  // Treat "all closers selected" the same as "no filter" to avoid edge cases
  // (e.g., when O2 TAX has only Lucas, selecting him makes selectedClosers.length === availableClosers.length)
  const effectiveSelectedClosers = useMemo(() => {
    if (selectedClosers.length === 0) return [];
    if (selectedClosers.length === availableClosers.length) return []; // All selected = no filter
    return selectedClosers;
  }, [selectedClosers, availableClosers]);

  // Filter function - checks if a responsavel matches selected closers (partial match, case-insensitive)
  const matchesCloserFilter = (closerValue?: string | null): boolean => {
    if (effectiveSelectedClosers.length === 0) return true; // No filter = show all
    if (!closerValue) return false;
    
    // Comparação parcial (case-insensitive) para lidar com variações de nome
    // Ex: "Lucas" no banco deve corresponder a "Lucas Ilha" no filtro
    const normalizedCloser = closerValue.toLowerCase().trim();
    return effectiveSelectedClosers.some(selected => {
      const normalizedSelected = selected.toLowerCase().trim();
      // Match se o closer do banco está contido no filtro OU vice-versa
      return normalizedSelected.includes(normalizedCloser) || 
             normalizedCloser.includes(normalizedSelected);
    });
  };

  // Filter function - checks if a responsible/SDR matches selected SDRs (partial match)
  const matchesSdrFilter = (responsavel?: string | null): boolean => {
    if (selectedSDRs.length === 0) return true; // No filter = show all
    if (!responsavel) return false;
    // Partial match: check if responsavel CONTAINS any selected SDR name
    return selectedSDRs.some(sdr => 
      responsavel.toLowerCase().includes(sdr.toLowerCase())
    );
  };
  
  // Month name mapping for funnelData lookup
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Helper function to calculate meta from funnelData for a given period (pro-rated for partial months)
  // Optionally applies closer percentage filter per month for a specific BU
  const calcularMetaDoPeriodo = (
    funnelItems: FunnelDataItem[] | undefined,
    indicatorKey: IndicatorType,
    start: Date,
    end: Date,
    bu?: string,
    closerFilter?: string[]
  ): number => {
    if (!funnelItems || funnelItems.length === 0) return 0;

    const getItemValue = (item: FunnelDataItem): number => {
      switch (indicatorKey) {
        case 'mql': return item.mqls;
        case 'rm': return item.rms;
        case 'rr': return item.rrs;
        case 'proposta': return item.propostas;
        case 'venda': return item.vendas;
        default: return 0;
      }
    };

    const monthsInPeriod = eachMonthOfInterval({ start, end });
    let total = 0;

    for (const monthDate of monthsInPeriod) {
      const monthName = monthNames[getMonth(monthDate)];
      const item = funnelItems.find(f => f.month === monthName);
      if (!item) continue;

      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const overlapStart = start > monthStart ? start : monthStart;
      const overlapEnd = end < monthEnd ? end : monthEnd;

      if (overlapStart > overlapEnd) continue;

      const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
      const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
      const fraction = daysInMonth > 0 ? overlapDays / daysInMonth : 0;

      let monthMeta = getItemValue(item) * fraction;
      
      // Apply closer percentage filter if BU and closers are provided
      if (bu && closerFilter && closerFilter.length > 0) {
        monthMeta = getFilteredMeta(monthMeta, bu, monthName, closerFilter);
      }

      total += monthMeta;
    }

    return Math.round(total);
  };
  
  // Helper function to get monthly metas array from funnelData for charts
  // Optionally applies closer percentage filter per month for a specific BU
  const getMonthlyMetasFromFunnel = (
    funnelItems: FunnelDataItem[] | undefined,
    indicatorKey: IndicatorType,
    start: Date,
    end: Date,
    bu?: string,
    closerFilter?: string[]
  ): number[] => {
    if (!funnelItems || funnelItems.length === 0) return [];
    
    const monthsInPeriod = eachMonthOfInterval({ start, end });
    return monthsInPeriod.map(monthDate => {
      const monthName = monthNames[getMonth(monthDate)];
      const item = funnelItems.find(f => f.month === monthName);
      if (!item) return 0;
      
      let value = 0;
      switch (indicatorKey) {
        case 'mql': value = item.mqls; break;
        case 'rm': value = item.rms; break;
        case 'rr': value = item.rrs; break;
        case 'proposta': value = item.propostas; break;
        case 'venda': value = item.vendas; break;
        default: value = 0;
      }
      
      // Apply closer percentage filter if BU and closers are provided
      if (bu && closerFilter && closerFilter.length > 0) {
        value = getFilteredMeta(value, bu, monthName, closerFilter);
      }
      
      return Math.round(value);
    });
  };

  // Check which BUs are selected (for multi-selection logic)
  const includesModeloAtual = selectedBUs.includes('modelo_atual');
  const includesO2Tax = selectedBUs.includes('o2_tax');
  const includesOxyHacker = selectedBUs.includes('oxy_hacker');
  const includesFranquia = selectedBUs.includes('franquia');

  const daysInPeriod = differenceInDays(endDate, startDate) + 1;
  const periodFraction = daysInPeriod / 365;
  
  // Determine grouping based on period length
  const grouping: ChartGrouping = daysInPeriod <= 31 ? 'daily' : daysInPeriod <= 90 ? 'weekly' : 'monthly';

  // Generate chart labels based on grouping
  const getChartLabels = (): string[] => {
    if (grouping === 'daily') {
      return eachDayOfInterval({ start: startDate, end: endDate }).map(day => 
        format(day, "d")
      );
    } else if (grouping === 'weekly') {
      const numWeeks = Math.ceil(daysInPeriod / 7);
      return Array.from({ length: numWeeks }, (_, i) => {
        const weekStart = addDays(startDate, i * 7);
        return format(weekStart, "d");
      });
    } else {
      return eachMonthOfInterval({ start: startDate, end: endDate }).map(monthDate => 
        format(monthDate, "MMM", { locale: ptBR })
      );
    }
  };

  const chartLabels = getChartLabels();

  // Get meta for indicator - sums metas from selected BUs using funnelData
  // Applies closer percentage filter for Modelo Atual when closers are selected
  const getMetaForIndicator = (indicator: IndicatorConfig) => {
    if (!funnelData) return Math.round(indicator.annualMeta * periodFraction);
    
    let total = 0;
    
    // Modelo Atual - apply closer filter only if selected closers operate in this BU
    if (includesModeloAtual && funnelData.modeloAtual) {
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.modelo_atual.includes(c as CloserType)
      );
      
      if (closersForBU.length > 0) {
        total += calcularMetaDoPeriodo(
          funnelData.modeloAtual, 
          indicator.key, 
          startDate, 
          endDate,
          'modelo_atual',
          closersForBU
        );
      } else if (effectiveSelectedClosers.length > 0) {
        // Closer selecionado não atua nesta BU - não contar meta
        total += 0;
      } else {
        // Sem filtro - contar tudo
        total += calcularMetaDoPeriodo(funnelData.modeloAtual, indicator.key, startDate, endDate);
      }
    }
    // O2 TAX - apply closer filter only if Lucas is selected
    if (includesO2Tax && funnelData.o2Tax) {
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.o2_tax.includes(c as CloserType)
      );
      
      if (closersForBU.length > 0) {
        total += calcularMetaDoPeriodo(
          funnelData.o2Tax, 
          indicator.key, 
          startDate, 
          endDate,
          'o2_tax',
          closersForBU
        );
      } else if (effectiveSelectedClosers.length > 0) {
        // Pedro ou Daniel selecionados - não contar O2 TAX
        total += 0;
      } else {
        // Sem filtro - contar tudo
        total += calcularMetaDoPeriodo(funnelData.o2Tax, indicator.key, startDate, endDate);
      }
    }
    if (includesOxyHacker && funnelData.oxyHacker) {
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.oxy_hacker.includes(c as CloserType)
      );
      
      if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
        total += calcularMetaDoPeriodo(funnelData.oxyHacker, indicator.key, startDate, endDate);
      }
      // Se closer selecionado não atua nesta BU, não conta
    }
    if (includesFranquia && funnelData.franquia) {
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.franquia.includes(c as CloserType)
      );
      
      if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
        total += calcularMetaDoPeriodo(funnelData.franquia, indicator.key, startDate, endDate);
      }
      // Se closer selecionado não atua nesta BU, não conta
    }
    
    return total > 0 ? total : Math.round(indicator.annualMeta * periodFraction);
  };

  // Get realized value for indicator - sums realized from selected BUs
  // Applies closer filter only when the selected closer operates in that BU
  const getRealizedForIndicator = (indicator: IndicatorConfig) => {
    let total = 0;
    
    if (includesModeloAtual) {
      // Check if any selected closer operates in Modelo Atual
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.modelo_atual.includes(c as CloserType)
      );
      
      if (closersForBU.length > 0) {
        // Filter cards by closers that operate in this BU (using partial match)
        const cards = modeloAtualAnalytics.getCardsForIndicator(indicator.key);
        const filteredCards = cards.filter(card => {
          const closerValue = (card.closer || '').trim();
          return closerValue && matchesCloserFilter(closerValue);
        });
        total += filteredCards.length;
      } else if (effectiveSelectedClosers.length > 0) {
        // Closer selecionado não atua nesta BU - não contar nada
        total += 0;
      } else {
        // Sem filtro - contar tudo
        total += getModeloAtualQty(indicator.key as ModeloAtualIndicator, startDate, endDate);
      }
    }
    if (includesO2Tax) {
      // Check if any selected closer operates in O2 TAX (only Lucas)
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.o2_tax.includes(c as CloserType)
      );
      
      if (closersForBU.length > 0) {
        // Filter cards by Lucas (using partial match for name variations)
        const cards = o2TaxAnalytics.getDetailItemsForIndicator(indicator.key);
        const filteredCards = cards.filter(card => {
          const closerValue = (card.closer || card.responsible || '').trim();
          return closerValue && matchesCloserFilter(closerValue);
        });
        total += filteredCards.length;
      } else if (effectiveSelectedClosers.length > 0) {
        // Pedro ou Daniel selecionados - não contar O2 TAX
        total += 0;
      } else {
        // Sem filtro - contar tudo
        total += getO2TaxQty(indicator.key as O2TaxIndicator, startDate, endDate);
      }
    }
    if (includesOxyHacker) {
      // Check if any selected closer operates in Oxy Hacker
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.oxy_hacker.includes(c as CloserType)
      );
      
      if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
        total += getOxyHackerQty(indicator.key as OxyHackerIndicator, startDate, endDate);
      }
      // Se closer selecionado não atua nesta BU, não conta
    }
    if (includesFranquia) {
      // Check if any selected closer operates in Franquia
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.franquia.includes(c as CloserType)
      );
      
      if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
        total += getExpansaoQty(indicator.key as ExpansaoIndicator, startDate, endDate);
      }
      // Se closer selecionado não atua nesta BU, não conta
    }
    
    return total;
  };

  const buildChartData = (indicator: IndicatorConfig) => {
    const getProratedMetaSeries = (totalMetaPeriodo: number): number[] => {
      if (totalMetaPeriodo <= 0) return [];
      const metaPorDia = totalMetaPeriodo / daysInPeriod;

      if (grouping === 'daily') {
        // Keep decimals to avoid rounding errors when accumulating
        return chartLabels.map(() => metaPorDia);
      }

      if (grouping === 'weekly') {
        const numWeeks = chartLabels.length;
        const lastWeekDays = daysInPeriod - (numWeeks - 1) * 7;
        return chartLabels.map((_, index) => {
          const days = index === numWeeks - 1 ? lastWeekDays : 7;
          // Keep decimals to avoid rounding errors when accumulating
          return metaPorDia * days;
        });
      }

      // monthly handled elsewhere
      return [];
    };

    // For single BU selection - Franquia
    if (hasSingleBU && includesFranquia) {
      const expansaoData = getExpansaoGroupedData(indicator.key as ExpansaoIndicator, startDate, endDate, grouping);
      const funnelMetasMensais = funnelData?.franquia ? getMonthlyMetasFromFunnel(funnelData.franquia, indicator.key, startDate, endDate) : [];
      const metaPeriodo = funnelData?.franquia ? calcularMetaDoPeriodo(funnelData.franquia, indicator.key, startDate, endDate) : 0;
      const metasProrateadas = grouping !== 'monthly' ? getProratedMetaSeries(metaPeriodo) : [];

      return chartLabels.map((label, index) => ({
        label,
        realizado: expansaoData.qty[index] || 0,
        meta:
          grouping === 'monthly'
            ? (funnelMetasMensais[index] ?? 0)
            : (metasProrateadas[index] ?? 0),
      }));
    }

    // For single BU selection - O2 TAX
    if (hasSingleBU && includesO2Tax) {
      const o2taxData = getO2TaxGroupedData(indicator.key as O2TaxIndicator, startDate, endDate, grouping);
      const funnelMetasMensais = funnelData?.o2Tax ? getMonthlyMetasFromFunnel(funnelData.o2Tax, indicator.key, startDate, endDate) : [];
      const metaPeriodo = funnelData?.o2Tax ? calcularMetaDoPeriodo(funnelData.o2Tax, indicator.key, startDate, endDate) : 0;
      const metasProrateadas = grouping !== 'monthly' ? getProratedMetaSeries(metaPeriodo) : [];

      return chartLabels.map((label, index) => ({
        label,
        realizado: o2taxData.qty[index] || 0,
        meta:
          grouping === 'monthly'
            ? (funnelMetasMensais[index] ?? 0)
            : (metasProrateadas[index] ?? 0),
      }));
    }

    // For single BU selection - Oxy Hacker
    if (hasSingleBU && includesOxyHacker) {
      const oxyHackerData = getOxyHackerGroupedData(indicator.key as OxyHackerIndicator, startDate, endDate, grouping);
      const funnelMetasMensais = funnelData?.oxyHacker ? getMonthlyMetasFromFunnel(funnelData.oxyHacker, indicator.key, startDate, endDate) : [];
      const metaPeriodo = funnelData?.oxyHacker ? calcularMetaDoPeriodo(funnelData.oxyHacker, indicator.key, startDate, endDate) : 0;
      const metasProrateadas = grouping !== 'monthly' ? getProratedMetaSeries(metaPeriodo) : [];

      return chartLabels.map((label, index) => ({
        label,
        realizado: oxyHackerData.qty[index] || 0,
        meta:
          grouping === 'monthly'
            ? (funnelMetasMensais[index] ?? 0)
            : (metasProrateadas[index] ?? 0),
      }));
    }
    
    // For single BU selection - Modelo Atual (with closer filter support)
    if (hasSingleBU && includesModeloAtual && funnelData?.modeloAtual) {
      const modeloAtualData = getModeloAtualGroupedData(indicator.key as ModeloAtualIndicator, startDate, endDate, grouping);
      
      // Apply closer filter to metas if closers are selected
      const closerFilter = selectedClosers.length > 0 ? selectedClosers : undefined;
      const funnelMetasMensais = getMonthlyMetasFromFunnel(funnelData.modeloAtual, indicator.key, startDate, endDate, 'modelo_atual', closerFilter);
      const metaPeriodo = calcularMetaDoPeriodo(funnelData.modeloAtual, indicator.key, startDate, endDate, 'modelo_atual', closerFilter);
      const metasProrateadas = grouping !== 'monthly' ? getProratedMetaSeries(metaPeriodo) : [];

      return chartLabels.map((label, index) => ({
        label,
        realizado: modeloAtualData.qty[index] || 0,
        meta: grouping === 'monthly'
          ? (funnelMetasMensais[index] ?? 0)
          : (metasProrateadas[index] ?? 0),
      }));
    }

    // For multi-BU selection (or Consolidado), sum metas from selected BUs
    if (selectedBUs.length > 1 || !hasSingleBU) {
      // Get data for each selected BU
      const modeloAtualData = includesModeloAtual ? getModeloAtualGroupedData(indicator.key as ModeloAtualIndicator, startDate, endDate, grouping) : { qty: [], meta: [] };
      const o2taxData = includesO2Tax ? getO2TaxGroupedData(indicator.key as O2TaxIndicator, startDate, endDate, grouping) : { qty: [], meta: [] };
      const oxyHackerData = includesOxyHacker ? getOxyHackerGroupedData(indicator.key as OxyHackerIndicator, startDate, endDate, grouping) : { qty: [], meta: [] };
      const expansaoData = includesFranquia ? getExpansaoGroupedData(indicator.key as ExpansaoIndicator, startDate, endDate, grouping) : { qty: [], meta: [] };
      
      // Apply closer filter to Modelo Atual metas only (closers only apply to Modelo Atual)
      const closerFilter = selectedClosers.length > 0 ? selectedClosers : undefined;
      
      // Get monthly metas for each selected BU (with closer filter for Modelo Atual)
      const metasModeloAtual = (includesModeloAtual && funnelData?.modeloAtual) ? getMonthlyMetasFromFunnel(funnelData.modeloAtual, indicator.key, startDate, endDate, 'modelo_atual', closerFilter) : [];
      const metasO2Tax = (includesO2Tax && funnelData?.o2Tax) ? getMonthlyMetasFromFunnel(funnelData.o2Tax, indicator.key, startDate, endDate) : [];
      const metasOxyHacker = (includesOxyHacker && funnelData?.oxyHacker) ? getMonthlyMetasFromFunnel(funnelData.oxyHacker, indicator.key, startDate, endDate) : [];
      const metasFranquia = (includesFranquia && funnelData?.franquia) ? getMonthlyMetasFromFunnel(funnelData.franquia, indicator.key, startDate, endDate) : [];
      
      // Get period metas for prorating (with closer filter for Modelo Atual)
      const metaPeriodoModeloAtual = (includesModeloAtual && funnelData?.modeloAtual) ? calcularMetaDoPeriodo(funnelData.modeloAtual, indicator.key, startDate, endDate, 'modelo_atual', closerFilter) : 0;
      const metaPeriodoO2Tax = (includesO2Tax && funnelData?.o2Tax) ? calcularMetaDoPeriodo(funnelData.o2Tax, indicator.key, startDate, endDate) : 0;
      const metaPeriodoOxyHacker = (includesOxyHacker && funnelData?.oxyHacker) ? calcularMetaDoPeriodo(funnelData.oxyHacker, indicator.key, startDate, endDate) : 0;
      const metaPeriodoFranquia = (includesFranquia && funnelData?.franquia) ? calcularMetaDoPeriodo(funnelData.franquia, indicator.key, startDate, endDate) : 0;
      const totalMetaPeriodo = metaPeriodoModeloAtual + metaPeriodoO2Tax + metaPeriodoOxyHacker + metaPeriodoFranquia;
      
      const metasProrateadas = grouping !== 'monthly' ? getProratedMetaSeries(totalMetaPeriodo) : [];

      return chartLabels.map((label, index) => {
        // Sum realized from selected BUs
        const realizadoModeloAtual = includesModeloAtual ? (modeloAtualData.qty[index] || 0) : 0;
        const realizadoO2Tax = includesO2Tax ? (o2taxData.qty[index] || 0) : 0;
        const realizadoOxyHacker = includesOxyHacker ? (oxyHackerData.qty[index] || 0) : 0;
        const realizadoFranquia = includesFranquia ? (expansaoData.qty[index] || 0) : 0;
        
        // Sum metas from selected BUs
        const metaTotal = grouping === 'monthly'
          ? (metasModeloAtual[index] ?? 0) + (metasO2Tax[index] ?? 0) + (metasOxyHacker[index] ?? 0) + (metasFranquia[index] ?? 0)
          : (metasProrateadas[index] ?? 0);

        return {
          label,
          realizado: realizadoModeloAtual + realizadoO2Tax + realizadoOxyHacker + realizadoFranquia,
          meta: metaTotal,
        };
      });
    }
    
    // Fallback: use external db data for Modelo Atual
    const fallbackData = getModeloAtualGroupedData(indicator.key as ModeloAtualIndicator, startDate, endDate, grouping);
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
      realizado: fallbackData.qty[index] || 0, 
      meta: Math.round(getMetaPerPoint(index)) 
    }));
  };

  // Function to convert chart data to accumulated (running sum) view
  const toAccumulatedData = (data: { label: string; realizado: number; meta: number }[]) => {
    let accumulatedRealized = 0;
    let accumulatedMeta = 0;
    return data.map((item) => {
      accumulatedRealized += item.realizado;
      accumulatedMeta += item.meta;
      return {
        label: item.label,
        realizado: Math.round(accumulatedRealized),
        meta: Math.round(accumulatedMeta),
      };
    });
  };

  // Get chart data with optional accumulation based on viewMode
  const getChartDataForIndicator = (indicator: IndicatorConfig) => {
    const baseData = buildChartData(indicator);
    return viewMode === 'accumulated' ? toAccumulatedData(baseData) : baseData;
  };

  // Get detail items for an indicator based on selected BUs and closer/SDR filters
  // Uses the SAME BU exclusion logic as getRealizedForIndicator:
  // If a closer is selected and doesn't operate in a BU, skip that BU entirely
  const getItemsForIndicator = (indicatorKey: IndicatorType): DetailItem[] => {
    let items: DetailItem[] = [];
    
    // Modelo Atual: Include if no closer filter OR at least one selected closer operates here
    if (includesModeloAtual) {
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.modelo_atual.includes(c as CloserType)
      );
      if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
        const buItems = modeloAtualAnalytics.getDetailItemsForIndicator(indicatorKey);
        if (effectiveSelectedClosers.length > 0) {
          items = [...items, ...buItems.filter(item => matchesCloserFilter(item.closer))];
        } else {
          items = [...items, ...buItems];
        }
      }
    }
    
    // O2 TAX: Include if no closer filter OR at least one selected closer operates here
    if (includesO2Tax) {
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.o2_tax.includes(c as CloserType)
      );
      if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
        const buItems = o2TaxAnalytics.getDetailItemsForIndicator(indicatorKey);
        if (effectiveSelectedClosers.length > 0) {
          items = [...items, ...buItems.filter(item => matchesCloserFilter(item.closer))];
        } else {
          items = [...items, ...buItems];
        }
      }
    }
    
    // Franquia: Include if no closer filter OR at least one selected closer operates here
    if (includesFranquia) {
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.franquia.includes(c as CloserType)
      );
      if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
        const buItems = franquiaAnalytics.getDetailItemsForIndicator(indicatorKey);
        if (effectiveSelectedClosers.length > 0) {
          items = [...items, ...buItems.filter(item => matchesCloserFilter(item.closer))];
        } else {
          items = [...items, ...buItems];
        }
      }
    }
    
    // Oxy Hacker: Include if no closer filter OR at least one selected closer operates here
    if (includesOxyHacker) {
      const closersForBU = effectiveSelectedClosers.filter(c => 
        BU_CLOSERS.oxy_hacker.includes(c as CloserType)
      );
      if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
        const buItems = oxyHackerAnalytics.getDetailItemsForIndicator(indicatorKey);
        if (effectiveSelectedClosers.length > 0) {
          items = [...items, ...buItems.filter(item => matchesCloserFilter(item.closer))];
        } else {
          items = [...items, ...buItems];
        }
      }
    }
    
    // Apply SDR filter if any SDRs are selected
    if (selectedSDRs.length > 0) {
      items = items.filter(item => matchesSdrFilter(item.responsible));
    }
    
    return items;
  };

  // === STRATEGIC DRILL-DOWN HANDLERS ===
  
  // Handle radial card click with strategic narratives
  const handleRadialCardClick = (indicator: IndicatorConfig) => {
    const items = getItemsForIndicator(indicator.key);
    const now = new Date();
    
    switch (indicator.key) {
      case 'mql': {
        // MQL: "De Onde Vêm Nossos Melhores Leads?"
        const itemsWithCalcs = items.map(item => {
          const entryDate = item.date ? new Date(item.date) : now;
          // diasAteQualificar: estimate from duration (already in seconds, convert to days)
          const diasAteQualificar = item.duration ? Math.floor(item.duration / 86400) : 0;
          return { ...item, diasAteQualificar };
        });
        
        const premiumCount = itemsWithCalcs.filter(i => {
          const range = (i.revenueRange || '').toLowerCase();
          return range.includes('50') || range.includes('100') || range.includes('acima');
        }).length;
        const premiumPct = items.length > 0 ? Math.round((premiumCount / items.length) * 100) : 0;
        const avgDias = itemsWithCalcs.length > 0 
          ? Math.round(itemsWithCalcs.reduce((sum, i) => sum + (i.diasAteQualificar || 0), 0) / itemsWithCalcs.length)
          : 0;
        const topSDR = findTopPerformer(items, 'responsible');
        
        // KPIs para MQL
        const kpis: KpiItem[] = [
          { icon: '📊', value: items.length, label: 'Total MQLs', highlight: 'neutral' },
          { icon: '💎', value: `${premiumPct}%`, label: 'Premium', highlight: premiumPct >= 30 ? 'success' : premiumPct >= 15 ? 'neutral' : 'warning' },
          { icon: '⏱️', value: `${avgDias}d`, label: 'Tempo Médio', highlight: avgDias <= 3 ? 'success' : avgDias <= 7 ? 'neutral' : 'warning' },
          { icon: '🏆', value: topSDR.name.split(' ')[0], label: `Top (${topSDR.count})`, highlight: 'neutral' },
        ];
        
        // Charts para MQL
        // 1. Distribuição por Faixa de Faturamento
        const revenueRangeCounts = new Map<string, number>();
        items.forEach(i => {
          const range = i.revenueRange || 'Não informado';
          revenueRangeCounts.set(range, (revenueRangeCounts.get(range) || 0) + 1);
        });
        const revenueRangeData = Array.from(revenueRangeCounts.entries())
          .map(([label, value]) => {
            const isHigh = label.toLowerCase().includes('50') || label.toLowerCase().includes('100') || label.toLowerCase().includes('acima');
            return { label, value, highlight: isHigh ? 'success' as const : 'neutral' as const };
          })
          .sort((a, b) => b.value - a.value);
        
        // 2. Tempo até qualificar (distribuição)
        const tempoDistribution = [
          { label: '1-3 dias', value: itemsWithCalcs.filter(i => (i.diasAteQualificar || 0) <= 3).length, highlight: 'success' as const },
          { label: '4-7 dias', value: itemsWithCalcs.filter(i => (i.diasAteQualificar || 0) > 3 && (i.diasAteQualificar || 0) <= 7).length, highlight: 'neutral' as const },
          { label: '8-14 dias', value: itemsWithCalcs.filter(i => (i.diasAteQualificar || 0) > 7 && (i.diasAteQualificar || 0) <= 14).length, highlight: 'warning' as const },
          { label: '14+ dias', value: itemsWithCalcs.filter(i => (i.diasAteQualificar || 0) > 14).length, highlight: 'danger' as const },
        ];
        
        const charts: ChartConfig[] = [
          { type: 'bar', title: 'Por Faixa de Faturamento', data: revenueRangeData },
          { type: 'distribution', title: 'Tempo até Qualificar', data: tempoDistribution },
        ];
        
        setDetailSheetTitle('MQL - De Onde Vêm Nossos Melhores Leads?');
        setDetailSheetDescription(
          `${items.length} MQLs captados | ${premiumPct}% faixa premium (>R$50k) | Top SDR: ${topSDR.name} (${topSDR.count}) | Tempo médio: ${avgDias}d`
        );
        setDetailSheetKpis(kpis);
        setDetailSheetCharts(charts);
        setDetailSheetColumns([
          { key: 'product', label: 'Produto', format: columnFormatters.product },
          { key: 'company', label: 'Empresa' },
          { key: 'revenueRange', label: 'Faixa Faturamento', format: columnFormatters.revenueRange },
          { key: 'diasAteQualificar', label: 'Dias até MQL', format: columnFormatters.diasAteQualificar },
          { key: 'responsible', label: 'SDR' },
          { key: 'date', label: 'Data', format: columnFormatters.date },
        ]);
        setDetailSheetItems(itemsWithCalcs);
        setDetailSheetOpen(true);
        return;
      }
      
      case 'rm': {
        // RM: "Estamos Convertendo MQLs em Reuniões?"
        const mqlCount = getRealizedForIndicator(indicatorConfigs.find(c => c.key === 'mql')!);
        const taxaMqlRm = mqlCount > 0 ? Math.round((items.length / mqlCount) * 100) : 0;
        
        const itemsWithCalcs = items.map(item => {
          const diasComoMQL = item.duration ? Math.floor(item.duration / 86400) : 0;
          return { ...item, diasComoMQL };
        });
        
        const avgDias = itemsWithCalcs.length > 0 
          ? Math.round(itemsWithCalcs.reduce((sum, i) => sum + (i.diasComoMQL || 0), 0) / itemsWithCalcs.length)
          : 0;
        const topCloser = findTopPerformer(items, 'closer');
        
        // KPIs para RM
        const kpis: KpiItem[] = [
          { icon: '📅', value: items.length, label: 'Reuniões', highlight: 'neutral' },
          { icon: '🎯', value: `${taxaMqlRm}%`, label: 'Taxa MQL→RM', highlight: taxaMqlRm >= 50 ? 'success' : taxaMqlRm >= 30 ? 'neutral' : 'warning' },
          { icon: '⏱️', value: `${avgDias}d`, label: 'Tempo Médio', highlight: avgDias <= 7 ? 'success' : avgDias <= 14 ? 'neutral' : 'warning' },
          { icon: '🏆', value: topCloser.name.split(' ')[0], label: `Top (${topCloser.count})`, highlight: 'neutral' },
        ];
        
        // Charts para RM
        // 1. Ranking de Closers por quantidade
        const closerCounts = new Map<string, number>();
        items.forEach(i => {
          const closer = i.responsible || i.closer || 'Sem Closer';
          closerCounts.set(closer, (closerCounts.get(closer) || 0) + 1);
        });
        const closerRankingData = Array.from(closerCounts.entries())
          .map(([label, value]) => ({ label: label.split(' ')[0], value }))
          .sort((a, b) => b.value - a.value);
        
        // 2. Tempo como MQL antes de agendar
        const tempoDistribution = [
          { label: '1-7 dias', value: itemsWithCalcs.filter(i => (i.diasComoMQL || 0) <= 7).length, highlight: 'success' as const },
          { label: '8-14 dias', value: itemsWithCalcs.filter(i => (i.diasComoMQL || 0) > 7 && (i.diasComoMQL || 0) <= 14).length, highlight: 'neutral' as const },
          { label: '15-30 dias', value: itemsWithCalcs.filter(i => (i.diasComoMQL || 0) > 14 && (i.diasComoMQL || 0) <= 30).length, highlight: 'warning' as const },
          { label: '30+ dias', value: itemsWithCalcs.filter(i => (i.diasComoMQL || 0) > 30).length, highlight: 'danger' as const },
        ];
        
        const charts: ChartConfig[] = [
          { type: 'bar', title: 'Ranking por Closer', data: closerRankingData },
          { type: 'distribution', title: 'Tempo como MQL', data: tempoDistribution },
        ];
        
        setDetailSheetTitle('RM - Estamos Convertendo MQLs em Reuniões?');
        setDetailSheetDescription(
          `${items.length} reuniões agendadas | Taxa MQL→RM: ${taxaMqlRm}% | Tempo médio: ${avgDias}d | Top: ${topCloser.name} (${topCloser.count})`
        );
        setDetailSheetKpis(kpis);
        setDetailSheetCharts(charts);
        setDetailSheetColumns([
          { key: 'product', label: 'Produto', format: columnFormatters.product },
          { key: 'company', label: 'Empresa' },
          { key: 'responsible', label: 'Closer' },
          { key: 'diasComoMQL', label: 'Dias como MQL', format: columnFormatters.diasAteAgendar },
          { key: 'revenueRange', label: 'Faixa Faturamento', format: columnFormatters.revenueRange },
          { key: 'date', label: 'Data', format: columnFormatters.date },
        ]);
        setDetailSheetItems(itemsWithCalcs);
        setDetailSheetOpen(true);
        return;
      }
      
      case 'rr': {
        // RR: "Quem Apareceu nas Reuniões?"
        const rmCount = getRealizedForIndicator(indicatorConfigs.find(c => c.key === 'rm')!);
        const taxaShow = rmCount > 0 ? Math.round((items.length / rmCount) * 100) : 0;
        const noShows = rmCount - items.length;
        const potencial = items.reduce((sum, i) => sum + (i.value || 0), 0);
        const topCloser = findTopPerformer(items, 'closer');
        
        // KPIs para RR
        const kpis: KpiItem[] = [
          { icon: '✅', value: items.length, label: 'Realizadas', highlight: 'neutral' },
          { icon: '📊', value: `${taxaShow}%`, label: 'Taxa Show', highlight: taxaShow >= 80 ? 'success' : taxaShow >= 60 ? 'neutral' : 'warning' },
          { icon: '❌', value: noShows > 0 ? noShows : '-', label: 'No-Shows', highlight: noShows > 5 ? 'danger' : noShows > 0 ? 'warning' : 'success' },
          { icon: '💰', value: formatCompactCurrency(potencial), label: 'Potencial', highlight: 'neutral' },
          { icon: '🏆', value: topCloser.name.split(' ')[0], label: `Top`, highlight: 'neutral' },
        ];
        
        // Charts para RR
        // 1. Ranking de Closers por taxa de show
        const closerStats = new Map<string, { realized: number }>();
        items.forEach(i => {
          const closer = i.responsible || i.closer || 'Sem Closer';
          const stats = closerStats.get(closer) || { realized: 0 };
          stats.realized += 1;
          closerStats.set(closer, stats);
        });
        const closerRankingData = Array.from(closerStats.entries())
          .map(([label, stats]) => ({ label: label.split(' ')[0], value: stats.realized }))
          .sort((a, b) => b.value - a.value);
        
        // 2. Potencial por faixa de faturamento
        const revenueRangeCounts = new Map<string, number>();
        items.forEach(i => {
          const range = i.revenueRange || 'Não informado';
          revenueRangeCounts.set(range, (revenueRangeCounts.get(range) || 0) + 1);
        });
        const revenueRangeData = Array.from(revenueRangeCounts.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value);
        
        const charts: ChartConfig[] = [
          { type: 'bar', title: 'Ranking por Closer', data: closerRankingData },
          { type: 'bar', title: 'Por Faixa Faturamento', data: revenueRangeData },
        ];
        
        setDetailSheetTitle('RR - Quem Apareceu nas Reuniões?');
        setDetailSheetDescription(
          `${items.length} realizadas | Taxa Show: ${taxaShow}% (${items.length} de ${rmCount}) | ${noShows > 0 ? `${noShows} no-shows | ` : ''}Potencial: ${formatCompactCurrency(potencial)} | Top: ${topCloser.name}`
        );
        setDetailSheetKpis(kpis);
        setDetailSheetCharts(charts);
        setDetailSheetColumns([
          { key: 'product', label: 'Produto', format: columnFormatters.product },
          { key: 'company', label: 'Empresa' },
          { key: 'responsible', label: 'Closer' },
          { key: 'revenueRange', label: 'Faixa Faturamento', format: columnFormatters.revenueRange },
          { key: 'duration', label: 'Tempo até Reunir', format: columnFormatters.duration },
          { key: 'date', label: 'Data', format: columnFormatters.date },
        ]);
        setDetailSheetItems(items);
        setDetailSheetOpen(true);
        return;
      }
      
      case 'proposta': {
        // Proposta: "Onde o Pipeline Está Travando?"
        const itemsWithAging = items.map(item => {
          const entryDate = item.date ? new Date(item.date) : now;
          const diasEmProposta = Math.floor((now.getTime() - entryDate.getTime()) / 86400000);
          return { ...item, diasEmProposta };
        });
        
        const pipeline = items.reduce((sum, i) => sum + (i.value || 0), 0);
        const ticketMedio = items.length > 0 ? pipeline / items.length : 0;
        const propostasAntigas = itemsWithAging.filter(i => (i.diasEmProposta || 0) > 14);
        const valorEmRisco = propostasAntigas.reduce((sum, i) => sum + (i.value || 0), 0);
        
        // KPIs para Proposta
        const kpis: KpiItem[] = [
          { icon: '📊', value: items.length, label: 'Propostas', highlight: 'neutral' },
          { icon: '💰', value: formatCompactCurrency(pipeline), label: 'Pipeline', highlight: 'neutral' },
          { icon: '🎯', value: formatCompactCurrency(ticketMedio), label: 'Ticket Médio', highlight: 'neutral' },
          { icon: '⚠️', value: propostasAntigas.length, label: 'Envelhecidas', highlight: propostasAntigas.length > 0 ? 'warning' : 'success' },
          { icon: '🔴', value: formatCompactCurrency(valorEmRisco), label: 'em Risco', highlight: valorEmRisco > 0 ? 'danger' : 'success' },
        ];
        
        // Charts para Proposta
        // 1. Pipeline por Closer
        const closerTotals = new Map<string, number>();
        itemsWithAging.forEach(i => {
          const closer = i.responsible || i.closer || 'Sem Closer';
          closerTotals.set(closer, (closerTotals.get(closer) || 0) + (i.value || 0));
        });
        const pipelineByCloserData = Array.from(closerTotals.entries())
          .map(([label, value]) => ({ label: label.split(' ')[0], value }))
          .sort((a, b) => b.value - a.value);
        
        // 2. Aging das Propostas
        const agingDistribution = [
          { label: '0-7 dias', value: itemsWithAging.filter(i => (i.diasEmProposta || 0) <= 7).length, highlight: 'success' as const },
          { label: '8-14 dias', value: itemsWithAging.filter(i => (i.diasEmProposta || 0) > 7 && (i.diasEmProposta || 0) <= 14).length, highlight: 'neutral' as const },
          { label: '15-30 dias', value: itemsWithAging.filter(i => (i.diasEmProposta || 0) > 14 && (i.diasEmProposta || 0) <= 30).length, highlight: 'warning' as const },
          { label: '30+ dias', value: itemsWithAging.filter(i => (i.diasEmProposta || 0) > 30).length, highlight: 'danger' as const },
        ];
        
        const charts: ChartConfig[] = [
          { type: 'bar', title: 'Pipeline por Closer', data: pipelineByCloserData, formatValue: formatCompactCurrency },
          { type: 'distribution', title: 'Aging das Propostas', data: agingDistribution },
        ];
        
        const descricao = `${items.length} propostas | Pipeline: ${formatCompactCurrency(pipeline)} | Ticket médio: ${formatCompactCurrency(ticketMedio)}` +
          (propostasAntigas.length > 0 
            ? ` | ⚠️ ${propostasAntigas.length} com mais de 14 dias (${formatCompactCurrency(valorEmRisco)} em risco)` 
            : ' | ✅ Nenhuma envelhecida');
        
        setDetailSheetTitle('Propostas - Onde o Pipeline Está Travando?');
        setDetailSheetDescription(descricao);
        setDetailSheetKpis(kpis);
        setDetailSheetCharts(charts);
        setDetailSheetColumns([
          { key: 'product', label: 'Produto', format: columnFormatters.product },
          { key: 'company', label: 'Empresa' },
          { key: 'value', label: 'Valor Total', format: columnFormatters.currency },
          { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
          { key: 'responsible', label: 'Closer' },
          { key: 'diasEmProposta', label: 'Dias em Proposta', format: columnFormatters.agingWithAlert },
          { key: 'date', label: 'Data Envio', format: columnFormatters.date },
        ]);
        // Sort by aging descending (oldest first = action needed)
        setDetailSheetItems(itemsWithAging.sort((a, b) => (b.diasEmProposta || 0) - (a.diasEmProposta || 0)));
        setDetailSheetOpen(true);
        return;
      }
      
      case 'venda': {
        // Venda: "O Que Fechamos e Como?"
        const totalFaturamento = items.reduce((sum, i) => sum + (i.value || 0), 0);
        const totalMrr = items.reduce((sum, i) => sum + (i.mrr || 0), 0);
        const totalSetup = items.reduce((sum, i) => sum + (i.setup || 0), 0);
        const totalPontual = items.reduce((sum, i) => sum + (i.pontual || 0), 0);
        
        const pctMrr = totalFaturamento > 0 ? Math.round((totalMrr / totalFaturamento) * 100) : 0;
        const pctSetup = totalFaturamento > 0 ? Math.round((totalSetup / totalFaturamento) * 100) : 0;
        const pctPontual = totalFaturamento > 0 ? Math.round((totalPontual / totalFaturamento) * 100) : 0;
        
        // Calculate cycle for each item and podium
        const itemsWithCycle = items.map(item => {
          const cicloVenda = item.duration ? Math.floor(item.duration / 86400) : 0;
          const percentualTotal = totalFaturamento > 0 ? ((item.value || 0) / totalFaturamento) * 100 : 0;
          return { ...item, cicloVenda, percentualTotal };
        });
        
        const podium = findTopPerformerByRevenue(items);
        const podiumStr = podium.map((p, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
          return `${medal}${p.name.split(' ')[0]}`;
        }).join(' ');
        
        // KPIs para Venda
        const kpis: KpiItem[] = [
          { icon: '📝', value: items.length, label: 'Contratos', highlight: 'neutral' },
          { icon: '💰', value: formatCompactCurrency(totalFaturamento), label: 'Total', highlight: 'neutral' },
          { icon: '🔄', value: `${pctMrr}%`, label: 'MRR', highlight: pctMrr >= 50 ? 'success' : 'neutral' },
          { icon: '🔧', value: `${pctSetup}%`, label: 'Setup', highlight: 'neutral' },
          { icon: '🏆', value: podium[0]?.name.split(' ')[0] || '-', label: 'Top Closer', highlight: 'neutral' },
        ];
        
        // Charts para Venda
        // 1. Ranking de Closers por valor
        const closerTotals = new Map<string, number>();
        items.forEach(i => {
          const closer = i.responsible || i.closer || 'Sem Closer';
          closerTotals.set(closer, (closerTotals.get(closer) || 0) + (i.value || 0));
        });
        const closerRankingData = Array.from(closerTotals.entries())
          .map(([label, value]) => ({ label: label.split(' ')[0], value }))
          .sort((a, b) => b.value - a.value);
        
        // 2. Composição MRR/Setup/Pontual (Pie)
        const compositionData = [
          { label: 'MRR', value: totalMrr },
          { label: 'Setup', value: totalSetup },
          { label: 'Pontual', value: totalPontual },
        ].filter(d => d.value > 0);
        
        const charts: ChartConfig[] = [
          { type: 'bar', title: 'Ranking por Closer', data: closerRankingData, formatValue: formatCompactCurrency },
          { type: 'pie', title: 'Composição do Faturamento', data: compositionData, formatValue: formatCompactCurrency },
        ];
        
        setDetailSheetTitle('Vendas - O Que Fechamos e Como?');
        setDetailSheetDescription(
          `${items.length} contratos | Total: ${formatCompactCurrency(totalFaturamento)} | Composição: MRR ${pctMrr}% + Setup ${pctSetup}% + Pontual ${pctPontual}% | ${podiumStr}`
        );
        setDetailSheetKpis(kpis);
        setDetailSheetCharts(charts);
        setDetailSheetColumns([
          { key: 'product', label: 'Produto', format: columnFormatters.product },
          { key: 'company', label: 'Empresa' },
          { key: 'dataAssinatura', label: 'Data Assinatura', format: columnFormatters.date },
          { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
          { key: 'setup', label: 'Setup', format: columnFormatters.currency },
          { key: 'pontual', label: 'Pontual', format: columnFormatters.currency },
          { key: 'value', label: 'Total', format: columnFormatters.currency },
          { key: 'sdr', label: 'SDR' },
          { key: 'responsible', label: 'Closer' },
          { key: 'cicloVenda', label: 'Ciclo', format: columnFormatters.cicloVenda },
        ]);
        // Sort by value descending
        setDetailSheetItems(itemsWithCycle.sort((a, b) => (b.value || 0) - (a.value || 0)));
        setDetailSheetOpen(true);
        return;
      }
      
      default: {
        // Fallback for other indicators
        const columns = getColumnsForIndicator(indicator.key);
        setDetailSheetTitle(indicator.label);
        setDetailSheetDescription(`${formatNumber(items.length)} registros no período`);
        setDetailSheetKpis([]);
        setDetailSheetCharts([]);
        setDetailSheetItems(items);
        setDetailSheetColumns(columns);
        setDetailSheetOpen(true);
      }
    }
  };

  // Get columns for indicator type (legacy, used as fallback)
  const getColumnsForIndicator = (indicatorKey: IndicatorType): { key: keyof DetailItem; label: string; format?: (value: any) => React.ReactNode }[] => {
    const baseColumns: { key: keyof DetailItem; label: string; format?: (value: any) => React.ReactNode }[] = [
      { key: 'product', label: 'Produto', format: columnFormatters.product },
      { key: 'company', label: 'Empresa/Contato' },
      { key: 'date', label: 'Data', format: columnFormatters.date },
      { key: 'duration', label: 'Tempo na Fase', format: columnFormatters.duration },
    ];

    if (indicatorKey === 'proposta' || indicatorKey === 'venda') {
      return [
        ...baseColumns,
        { key: 'mrr' as keyof DetailItem, label: 'MRR', format: columnFormatters.currency },
        { key: 'setup' as keyof DetailItem, label: 'Setup', format: columnFormatters.currency },
        { key: 'pontual' as keyof DetailItem, label: 'Pontual', format: columnFormatters.currency },
        { key: 'value' as keyof DetailItem, label: 'Total', format: columnFormatters.currency },
        { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
      ];
    }

    return [
      ...baseColumns,
      { key: 'revenueRange' as keyof DetailItem, label: 'Faixa Faturamento' },
      { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
    ];
  };

  // === Monetary Indicators Logic ===
  
  // Get investimento from funnelData for ROI calculation
  const getInvestimentoPeriodo = (): number => {
    if (!funnelData) return 0;
    
    let total = 0;
    const monthsInPeriod = eachMonthOfInterval({ start: startDate, end: endDate });
    
    for (const monthDate of monthsInPeriod) {
      const monthName = monthNames[getMonth(monthDate)];
      
      if (includesModeloAtual && funnelData.modeloAtual) {
        const item = funnelData.modeloAtual.find(f => f.month === monthName);
        if (item) total += item.investimento || 0;
      }
      if (includesO2Tax && funnelData.o2Tax) {
        const item = funnelData.o2Tax.find(f => f.month === monthName);
        if (item) total += item.investimento || 0;
      }
      if (includesOxyHacker && funnelData.oxyHacker) {
        const item = funnelData.oxyHacker.find(f => f.month === monthName);
        if (item) total += item.investimento || 0;
      }
      if (includesFranquia && funnelData.franquia) {
        const item = funnelData.franquia.find(f => f.month === monthName);
        if (item) total += item.investimento || 0;
      }
    }
    
    return total;
  };

  // Get faturamento meta from funnelData (calcular de vendas * ticket médio ou valor fixo)
  const getFaturamentoMetaPeriodo = (): number => {
    if (!funnelData) return 0;
    
    // Calculate meta based on sales target * average ticket per BU
    // Modelo Atual: avg ticket ~R$ 17.000
    // O2 TAX: avg ticket ~R$ 15.000
    // Franquia: avg ticket ~R$ 140.000
    // Oxy Hacker: avg ticket ~R$ 54.000
    
    let total = 0;
    const monthsInPeriod = eachMonthOfInterval({ start: startDate, end: endDate });
    
    for (const monthDate of monthsInPeriod) {
      const monthName = monthNames[getMonth(monthDate)];
      
      if (includesModeloAtual && funnelData.modeloAtual) {
        const item = funnelData.modeloAtual.find(f => f.month === monthName);
        if (item) total += (item.vendas || 0) * 17000;
      }
      if (includesO2Tax && funnelData.o2Tax) {
        const item = funnelData.o2Tax.find(f => f.month === monthName);
        if (item) total += (item.vendas || 0) * 15000;
      }
      if (includesOxyHacker && funnelData.oxyHacker) {
        const item = funnelData.oxyHacker.find(f => f.month === monthName);
        if (item) total += (item.vendas || 0) * 54000;
      }
      if (includesFranquia && funnelData.franquia) {
        const item = funnelData.franquia.find(f => f.month === monthName);
        if (item) total += (item.vendas || 0) * 140000;
      }
    }
    
    return total;
  };

  // Get realized monetary value for monetary indicators (respecting BU and Closer filters)
  const getRealizedMonetaryForIndicator = (indicator: MonetaryIndicatorConfig): number => {
    switch (indicator.key) {
      case 'faturamento': {
        let total = 0;
        
        // For Modelo Atual: apply closer filter if active
        if (includesModeloAtual) {
          if (selectedClosers.length > 0) {
            // Filter by closer using analytics
            const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
            const filteredCards = salesCards.filter(card => 
              matchesCloserFilter((card.closer || '').trim())
            );
            total += filteredCards.reduce((acc, card) => acc + (card.valor || 0), 0);
          } else {
            total += getModeloAtualValue('venda', startDate, endDate);
          }
        }
        
        // Other BUs don't have closer filter
        if (includesO2Tax) {
          total += getO2TaxQty('venda' as O2TaxIndicator, startDate, endDate) * 15000;
        }
        if (includesOxyHacker) {
          total += getOxyHackerQty('venda' as OxyHackerIndicator, startDate, endDate) * 54000;
        }
        if (includesFranquia) {
          total += getExpansaoQty('venda' as ExpansaoIndicator, startDate, endDate) * 140000;
        }
        
        return total;
      }
      
      case 'sla': {
        // SLA: Average time from card creation to "Tentativas de contato" phase
        // Only available for Modelo Atual which has this phase
        if (includesModeloAtual) {
          return modeloAtualAnalytics.getAverageSlaMinutes;
        }
        return 0;
      }
      
      case 'mrr': {
        let total = 0;
        
        if (includesModeloAtual) {
          if (selectedClosers.length > 0) {
            // Filter by closer using analytics
            const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
            const filteredCards = salesCards.filter(card => 
              matchesCloserFilter((card.closer || '').trim())
            );
            total += filteredCards.reduce((acc, card) => acc + (card.valorMRR || 0), 0);
          } else {
            total += getMrrForPeriod(startDate, endDate);
          }
        }
        
        // Other BUs don't have MRR breakdown - their "ticket" is all-inclusive
        // No additional MRR for O2 TAX, Oxy Hacker, Franquia
        
        return total;
      }
      
      case 'setup': {
        let total = 0;
        
        if (includesModeloAtual) {
          if (selectedClosers.length > 0) {
            const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
            const filteredCards = salesCards.filter(card => 
              matchesCloserFilter((card.closer || '').trim())
            );
            total += filteredCards.reduce((acc, card) => acc + (card.valorSetup || 0), 0);
          } else {
            total += getSetupForPeriod(startDate, endDate);
          }
        }
        
        return total;
      }
      
      case 'pontual': {
        let total = 0;
        
        if (includesModeloAtual) {
          if (selectedClosers.length > 0) {
            const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
            const filteredCards = salesCards.filter(card => 
              matchesCloserFilter((card.closer || '').trim())
            );
            total += filteredCards.reduce((acc, card) => acc + (card.valorPontual || 0), 0);
          } else {
            total += getPontualForPeriod(startDate, endDate);
          }
        }
        
        return total;
      }
      
      default:
        return 0;
    }
  };

  // Get meta for monetary indicators (respecting closer filter for Modelo Atual)
  const getMetaMonetaryForIndicator = (indicator: MonetaryIndicatorConfig): number => {
    // Helper to calculate faturamento meta with closer filter applied
    const getFilteredFaturamentoMeta = (): number => {
      if (!funnelData) return 0;
      
      let total = 0;
      const monthsInPeriod = eachMonthOfInterval({ start: startDate, end: endDate });
      const closerFilter = selectedClosers.length > 0 ? selectedClosers : undefined;
      
      for (const monthDate of monthsInPeriod) {
        const monthName = monthNames[getMonth(monthDate)];
        
        if (includesModeloAtual && funnelData.modeloAtual) {
          const item = funnelData.modeloAtual.find(f => f.month === monthName);
          if (item) {
            let vendas = item.vendas || 0;
            // Apply closer percentage if filter is active
            if (closerFilter && closerFilter.length > 0) {
              const totalPercentage = closerFilter.reduce((sum, closer) => {
                return sum + getFilteredMeta(vendas, 'modelo_atual', monthName, [closer]) / vendas * 100;
              }, 0);
              vendas = vendas * (totalPercentage / 100);
            }
            total += vendas * 17000;
          }
        }
        if (includesO2Tax && funnelData.o2Tax) {
          const item = funnelData.o2Tax.find(f => f.month === monthName);
          if (item) total += (item.vendas || 0) * 15000;
        }
        if (includesOxyHacker && funnelData.oxyHacker) {
          const item = funnelData.oxyHacker.find(f => f.month === monthName);
          if (item) total += (item.vendas || 0) * 54000;
        }
        if (includesFranquia && funnelData.franquia) {
          const item = funnelData.franquia.find(f => f.month === monthName);
          if (item) total += (item.vendas || 0) * 140000;
        }
      }
      
      return total;
    };
    
    switch (indicator.key) {
      case 'sla':
        return 30; // Meta de 30 minutos para primeira tentativa de contato
      
      case 'faturamento':
        return getFilteredFaturamentoMeta();
      
      case 'mrr':
        // MRR = ~60% do faturamento
        return getFilteredFaturamentoMeta() * 0.6;
      
      case 'setup':
        // Setup = ~25% do faturamento
        return getFilteredFaturamentoMeta() * 0.25;
      
      case 'pontual':
        // Pontual = ~15% do faturamento
        return getFilteredFaturamentoMeta() * 0.15;
      
      default:
        return 0;
    }
  };

  // Handle monetary card click with strategic narratives
  const handleMonetaryCardClick = (indicator: MonetaryIndicatorConfig) => {
    const items = getItemsForIndicator('venda');
    const totalFaturamento = items.reduce((sum, i) => sum + (i.value || 0), 0);
    const totalMrr = items.reduce((sum, i) => sum + (i.mrr || 0), 0);
    const totalSetup = items.reduce((sum, i) => sum + (i.setup || 0), 0);
    const totalPontual = items.reduce((sum, i) => sum + (i.pontual || 0), 0);
    
    // SLA drill-down: "Estamos Respondendo Rápido?"
    if (indicator.key === 'sla') {
      const tentativasCards = modeloAtualAnalytics.cards.filter(card => 
        card.fase === 'Tentativas de contato' && card.dataCriacao
      ).map(card => {
        const slaMinutes = (card.dataEntrada.getTime() - card.dataCriacao!.getTime()) / 1000 / 60;
        const slaStatus: 'ok' | 'warning' | 'danger' = slaMinutes <= 30 ? 'ok' : slaMinutes <= 60 ? 'warning' : 'danger';
        return {
          id: card.id,
          name: card.titulo || card.empresa || 'Sem título',
          company: card.empresa || card.contato || undefined,
          phase: 'Tentativas de contato',
          date: card.dataEntrada.toISOString(),
          value: 0,
          sla: slaMinutes,
          slaStatus,
          responsible: card.responsavel || undefined,
          product: 'CaaS',
        } as DetailItem;
      });
      
      // Calculate SLA metrics
      const avgSla = modeloAtualAnalytics.getAverageSlaMinutes;
      const withinTarget = tentativasCards.filter(c => (c.sla || 0) <= 30).length;
      const withinTargetPct = tentativasCards.length > 0 ? Math.round((withinTarget / tentativasCards.length) * 100) : 0;
      const slaValues = tentativasCards.map(c => c.sla || 0).sort((a, b) => a - b);
      const medianSla = slaValues.length > 0 ? slaValues[Math.floor(slaValues.length / 2)] : 0;
      const outliers = tentativasCards.filter(c => (c.sla || 0) > 120).length;
      
      // KPIs para SLA
      const kpis: KpiItem[] = [
        { icon: '📊', value: tentativasCards.length, label: 'Leads', highlight: 'neutral' },
        { icon: '⏱️', value: formatDuration(avgSla), label: 'SLA Médio', highlight: avgSla <= 30 ? 'success' : avgSla <= 60 ? 'warning' : 'danger' },
        { icon: '🎯', value: `${withinTargetPct}%`, label: '% Meta', highlight: withinTargetPct >= 80 ? 'success' : withinTargetPct >= 50 ? 'warning' : 'danger' },
        { icon: '📈', value: formatDuration(medianSla), label: 'Mediana', highlight: 'neutral' },
        { icon: '⚠️', value: outliers > 0 ? outliers : '-', label: 'Outliers', highlight: outliers > 5 ? 'danger' : outliers > 0 ? 'warning' : 'success' },
      ];
      
      // Charts para SLA
      // 1. SLA por SDR
      const sdrSlaMap = new Map<string, { total: number; count: number }>();
      tentativasCards.forEach(c => {
        const sdr = c.responsible || 'Sem SDR';
        const stats = sdrSlaMap.get(sdr) || { total: 0, count: 0 };
        stats.total += c.sla || 0;
        stats.count += 1;
        sdrSlaMap.set(sdr, stats);
      });
      const sdrSlaData = Array.from(sdrSlaMap.entries())
        .map(([label, stats]) => {
          const avgMinutes = stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
          return {
            label: label.split(' ')[0],
            value: avgMinutes,
            highlight: avgMinutes <= 30 ? 'success' as const : avgMinutes <= 60 ? 'warning' as const : 'danger' as const
          };
        })
        .sort((a, b) => b.value - a.value);
      
      // 2. Distribuição de SLA
      const slaDistribution = [
        { label: '< 30m', value: tentativasCards.filter(c => (c.sla || 0) <= 30).length, highlight: 'success' as const },
        { label: '30m-1h', value: tentativasCards.filter(c => (c.sla || 0) > 30 && (c.sla || 0) <= 60).length, highlight: 'warning' as const },
        { label: '1h-2h', value: tentativasCards.filter(c => (c.sla || 0) > 60 && (c.sla || 0) <= 120).length, highlight: 'warning' as const },
        { label: '> 2h', value: tentativasCards.filter(c => (c.sla || 0) > 120).length, highlight: 'danger' as const },
      ];
      
      const charts: ChartConfig[] = [
        { type: 'bar', title: 'SLA Médio por SDR (min)', data: sdrSlaData },
        { type: 'distribution', title: 'Distribuição de SLA', data: slaDistribution },
      ];
      
      setDetailSheetTitle('SLA - Estamos Respondendo Rápido?');
      setDetailSheetDescription(
        `${tentativasCards.length} leads | SLA médio: ${formatDuration(avgSla)} | Dentro da meta (<30m): ${withinTargetPct}% | Mediana: ${formatDuration(medianSla)}` +
        (outliers > 0 ? ` | ⚠️ ${outliers} leads com SLA > 2h` : '')
      );
      setDetailSheetKpis(kpis);
      setDetailSheetCharts(charts);
      setDetailSheetColumns([
        { key: 'product', label: 'Produto', format: columnFormatters.product },
        { key: 'company', label: 'Empresa' },
        { key: 'sla', label: 'Tempo SLA', format: columnFormatters.slaWithStatus },
        { key: 'responsible', label: 'SDR' },
        { key: 'date', label: 'Data', format: columnFormatters.date },
      ]);
      // Sort by SLA descending (worst first = coaching)
      setDetailSheetItems(tentativasCards.sort((a, b) => (b.sla || 0) - (a.sla || 0)));
      setDetailSheetOpen(true);
      return;
    }
    
    // Faturamento: "De Onde Veio o Dinheiro?"
    if (indicator.key === 'faturamento') {
      const meta = getMetaMonetaryForIndicator(indicator);
      const pctMeta = meta > 0 ? Math.round((totalFaturamento / meta) * 100) : 0;
      const pctMrr = totalFaturamento > 0 ? Math.round((totalMrr / totalFaturamento) * 100) : 0;
      const pctSetup = totalFaturamento > 0 ? Math.round((totalSetup / totalFaturamento) * 100) : 0;
      const pctPontual = totalFaturamento > 0 ? Math.round((totalPontual / totalFaturamento) * 100) : 0;
      
      const itemsWithPct = items.map(item => ({
        ...item,
        percentualTotal: totalFaturamento > 0 ? ((item.value || 0) / totalFaturamento) * 100 : 0
      }));
      
      const topCliente = items.length > 0 
        ? items.reduce((top, i) => (i.value || 0) > (top.value || 0) ? i : top, items[0])
        : null;
      
      // KPIs para Faturamento
      const kpis: KpiItem[] = [
        { icon: '💰', value: formatCompactCurrency(totalFaturamento), label: 'Total', highlight: 'neutral' },
        { icon: '🔄', value: `${pctMrr}%`, label: 'MRR', highlight: pctMrr >= 50 ? 'success' : 'neutral' },
        { icon: '🔧', value: `${pctSetup}%`, label: 'Setup', highlight: 'neutral' },
        { icon: '💎', value: `${pctPontual}%`, label: 'Pontual', highlight: pctPontual > 30 ? 'warning' : 'neutral' },
        { icon: '🎯', value: `${pctMeta}%`, label: 'vs Meta', highlight: pctMeta >= 100 ? 'success' : pctMeta >= 70 ? 'neutral' : 'warning' },
      ];
      
      // Charts para Faturamento
      // 1. Faturamento por Closer
      const closerTotals = new Map<string, number>();
      items.forEach(i => {
        const closer = i.responsible || i.closer || 'Sem Closer';
        closerTotals.set(closer, (closerTotals.get(closer) || 0) + (i.value || 0));
      });
      const closerRankingData = Array.from(closerTotals.entries())
        .map(([label, value]) => ({ label: label.split(' ')[0], value }))
        .sort((a, b) => b.value - a.value);
      
      // 2. Composição MRR/Setup/Pontual (Pie)
      const compositionData = [
        { label: 'MRR', value: totalMrr },
        { label: 'Setup', value: totalSetup },
        { label: 'Pontual', value: totalPontual },
      ].filter(d => d.value > 0);
      
      const charts: ChartConfig[] = [
        { type: 'bar', title: 'Faturamento por Closer', data: closerRankingData, formatValue: formatCompactCurrency },
        { type: 'pie', title: 'Composição', data: compositionData, formatValue: formatCompactCurrency },
      ];
      
      setDetailSheetTitle('Faturamento - De Onde Veio o Dinheiro?');
      setDetailSheetDescription(
        `Total: ${formatCompactCurrency(totalFaturamento)} | Composição: MRR ${formatCompactCurrency(totalMrr)} (${pctMrr}%) + Setup ${formatCompactCurrency(totalSetup)} (${pctSetup}%) + Pontual ${formatCompactCurrency(totalPontual)} (${pctPontual}%) | vs Meta: ${pctMeta}%` +
        (topCliente ? ` | Top: ${topCliente.company || topCliente.name} (${formatCompactCurrency(topCliente.value || 0)})` : '')
      );
      setDetailSheetKpis(kpis);
      setDetailSheetCharts(charts);
      setDetailSheetColumns([
        { key: 'product', label: 'Produto', format: columnFormatters.product },
        { key: 'company', label: 'Empresa' },
        { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
        { key: 'setup', label: 'Setup', format: columnFormatters.currency },
        { key: 'pontual', label: 'Pontual', format: columnFormatters.currency },
        { key: 'value', label: 'Total', format: columnFormatters.currency },
        { key: 'percentualTotal', label: '% do Fat.', format: columnFormatters.percentualTotal },
        { key: 'responsible', label: 'Closer' },
      ]);
      setDetailSheetItems(itemsWithPct.sort((a, b) => (b.value || 0) - (a.value || 0)));
      setDetailSheetOpen(true);
      return;
    }
    
    // MRR: "Quanto de Base Recorrente Construímos?"
    if (indicator.key === 'mrr') {
      const mrrItems = items.filter(i => (i.mrr || 0) > 0);
      const arrProjetado = totalMrr * 12;
      const avgMrr = mrrItems.length > 0 ? totalMrr / mrrItems.length : 0;
      const topCliente = mrrItems.length > 0 
        ? mrrItems.reduce((top, i) => (i.mrr || 0) > (top.mrr || 0) ? i : top, mrrItems[0])
        : null;
      
      const itemsWithPct = mrrItems.map(item => ({
        ...item,
        percentualTotal: totalMrr > 0 ? ((item.mrr || 0) / totalMrr) * 100 : 0
      }));
      
      // KPIs para MRR
      const kpis: KpiItem[] = [
        { icon: '📝', value: mrrItems.length, label: 'Contratos', highlight: 'neutral' },
        { icon: '🔄', value: formatCompactCurrency(totalMrr), label: 'Total/mês', highlight: 'neutral' },
        { icon: '📈', value: formatCompactCurrency(arrProjetado), label: 'ARR', highlight: 'neutral' },
        { icon: '📊', value: formatCompactCurrency(avgMrr), label: 'Média', highlight: 'neutral' },
        { icon: '👑', value: topCliente ? (topCliente.company || topCliente.name).substring(0, 10) : '-', label: 'Maior', highlight: 'neutral' },
      ];
      
      // Charts para MRR
      // 1. Ranking por Closer
      const closerTotals = new Map<string, number>();
      mrrItems.forEach(i => {
        const closer = i.responsible || i.closer || 'Sem Closer';
        closerTotals.set(closer, (closerTotals.get(closer) || 0) + (i.mrr || 0));
      });
      const closerRankingData = Array.from(closerTotals.entries())
        .map(([label, value]) => ({ label: label.split(' ')[0], value }))
        .sort((a, b) => b.value - a.value);
      
      // 2. Top 3 clientes vs resto (concentração)
      const sortedByMrr = [...mrrItems].sort((a, b) => (b.mrr || 0) - (a.mrr || 0));
      const top3Mrr = sortedByMrr.slice(0, 3).reduce((sum, i) => sum + (i.mrr || 0), 0);
      const restoMrr = totalMrr - top3Mrr;
      const concentrationData = [
        { label: 'Top 3', value: top3Mrr },
        { label: 'Outros', value: restoMrr },
      ].filter(d => d.value > 0);
      
      const charts: ChartConfig[] = [
        { type: 'bar', title: 'MRR por Closer', data: closerRankingData, formatValue: formatCompactCurrency },
        { type: 'pie', title: 'Concentração de Receita', data: concentrationData, formatValue: formatCompactCurrency },
      ];
      
      setDetailSheetTitle('MRR - Quanto de Base Recorrente Construímos?');
      setDetailSheetDescription(
        `${mrrItems.length} contratos com MRR | Total: ${formatCompactCurrency(totalMrr)}/mês | ARR projetado: ${formatCompactCurrency(arrProjetado)} | Média: ${formatCompactCurrency(avgMrr)}` +
        (topCliente ? ` | Maior: ${topCliente.company || topCliente.name} (${formatCompactCurrency(topCliente.mrr || 0)}/mês)` : '')
      );
      setDetailSheetKpis(kpis);
      setDetailSheetCharts(charts);
      setDetailSheetColumns([
        { key: 'product', label: 'Produto', format: columnFormatters.product },
        { key: 'company', label: 'Empresa' },
        { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
        { key: 'percentualTotal', label: '% do MRR', format: columnFormatters.percentualTotal },
        { key: 'value', label: 'Total Contrato', format: columnFormatters.currency },
        { key: 'responsible', label: 'Closer' },
        { key: 'date', label: 'Data', format: columnFormatters.date },
      ]);
      setDetailSheetItems(itemsWithPct.sort((a, b) => (b.mrr || 0) - (a.mrr || 0)));
      setDetailSheetOpen(true);
      return;
    }
    
    // Setup: "Quantas Implantações Vendemos?"
    if (indicator.key === 'setup') {
      const setupItems = items.filter(i => (i.setup || 0) > 0);
      const avgSetup = setupItems.length > 0 ? totalSetup / setupItems.length : 0;
      const pctFaturamento = totalFaturamento > 0 ? Math.round((totalSetup / totalFaturamento) * 100) : 0;
      const topCliente = setupItems.length > 0 
        ? setupItems.reduce((top, i) => (i.setup || 0) > (top.setup || 0) ? i : top, setupItems[0])
        : null;
      
      const itemsWithPct = setupItems.map(item => ({
        ...item,
        percentualTotal: totalSetup > 0 ? ((item.setup || 0) / totalSetup) * 100 : 0
      }));
      
      // KPIs para Setup
      const kpis: KpiItem[] = [
        { icon: '🔧', value: setupItems.length, label: 'Projetos', highlight: 'neutral' },
        { icon: '💰', value: formatCompactCurrency(totalSetup), label: 'Total', highlight: 'neutral' },
        { icon: '📊', value: formatCompactCurrency(avgSetup), label: 'Média', highlight: 'neutral' },
        { icon: '📈', value: `${pctFaturamento}%`, label: '% Fat.', highlight: 'neutral' },
        { icon: '👑', value: topCliente ? (topCliente.company || topCliente.name).substring(0, 10) : '-', label: 'Maior', highlight: 'neutral' },
      ];
      
      // Charts para Setup
      // 1. Ranking por Closer
      const closerTotals = new Map<string, number>();
      setupItems.forEach(i => {
        const closer = i.responsible || i.closer || 'Sem Closer';
        closerTotals.set(closer, (closerTotals.get(closer) || 0) + (i.setup || 0));
      });
      const closerRankingData = Array.from(closerTotals.entries())
        .map(([label, value]) => ({ label: label.split(' ')[0], value }))
        .sort((a, b) => b.value - a.value);
      
      const charts: ChartConfig[] = [
        { type: 'bar', title: 'Setup por Closer', data: closerRankingData, formatValue: formatCompactCurrency },
      ];
      
      setDetailSheetTitle('Setup - Quantas Implantações Vendemos?');
      setDetailSheetDescription(
        `${setupItems.length} projetos com setup | Total: ${formatCompactCurrency(totalSetup)} | Média: ${formatCompactCurrency(avgSetup)} | Setup = ${pctFaturamento}% do faturamento` +
        (topCliente ? ` | Maior: ${topCliente.company || topCliente.name} (${formatCompactCurrency(topCliente.setup || 0)})` : '')
      );
      setDetailSheetKpis(kpis);
      setDetailSheetCharts(charts);
      setDetailSheetColumns([
        { key: 'product', label: 'Produto', format: columnFormatters.product },
        { key: 'company', label: 'Empresa' },
        { key: 'setup', label: 'Setup', format: columnFormatters.currency },
        { key: 'mrr', label: 'MRR Associado', format: columnFormatters.currency },
        { key: 'value', label: 'Total Contrato', format: columnFormatters.currency },
        { key: 'responsible', label: 'Closer' },
        { key: 'date', label: 'Data', format: columnFormatters.date },
      ]);
      setDetailSheetItems(itemsWithPct.sort((a, b) => (b.setup || 0) - (a.setup || 0)));
      setDetailSheetOpen(true);
      return;
    }
    
    // Pontual: "Receitas Extraordinárias"
    if (indicator.key === 'pontual') {
      const pontualItems = items.filter(i => (i.pontual || 0) > 0);
      const avgPontual = pontualItems.length > 0 ? totalPontual / pontualItems.length : 0;
      const pctFaturamento = totalFaturamento > 0 ? Math.round((totalPontual / totalFaturamento) * 100) : 0;
      const topCliente = pontualItems.length > 0 
        ? pontualItems.reduce((top, i) => (i.pontual || 0) > (top.pontual || 0) ? i : top, pontualItems[0])
        : null;
      
      const itemsWithPct = pontualItems.map(item => ({
        ...item,
        percentualTotal: totalPontual > 0 ? ((item.pontual || 0) / totalPontual) * 100 : 0
      }));
      
      // KPIs para Pontual
      const kpis: KpiItem[] = [
        { icon: '💎', value: pontualItems.length, label: 'Ocorrências', highlight: 'neutral' },
        { icon: '💰', value: formatCompactCurrency(totalPontual), label: 'Total', highlight: 'neutral' },
        { icon: '📊', value: formatCompactCurrency(avgPontual), label: 'Média', highlight: 'neutral' },
        { icon: '📈', value: `${pctFaturamento}%`, label: '% Fat.', highlight: pctFaturamento > 30 ? 'warning' : 'neutral' },
        { icon: '👑', value: topCliente ? (topCliente.company || topCliente.name).substring(0, 10) : '-', label: 'Maior', highlight: 'neutral' },
      ];
      
      // Charts para Pontual
      const closerTotals = new Map<string, number>();
      pontualItems.forEach(i => {
        const closer = i.responsible || i.closer || 'Sem Closer';
        closerTotals.set(closer, (closerTotals.get(closer) || 0) + (i.pontual || 0));
      });
      const closerRankingData = Array.from(closerTotals.entries())
        .map(([label, value]) => ({ label: label.split(' ')[0], value }))
        .sort((a, b) => b.value - a.value);
      
      const charts: ChartConfig[] = [
        { type: 'bar', title: 'Pontual por Closer', data: closerRankingData, formatValue: formatCompactCurrency },
      ];
      
      setDetailSheetTitle('Pontual - Receitas Extraordinárias');
      setDetailSheetDescription(
        `${pontualItems.length} ocorrências | Total: ${formatCompactCurrency(totalPontual)} | Média: ${formatCompactCurrency(avgPontual)} | Pontual = ${pctFaturamento}% do faturamento` +
        (pctFaturamento > 30 ? ' ⚠️ Alta dependência' : '') +
        (topCliente ? ` | Maior: ${topCliente.company || topCliente.name} (${formatCompactCurrency(topCliente.pontual || 0)})` : '')
      );
      setDetailSheetKpis(kpis);
      setDetailSheetCharts(charts);
      setDetailSheetColumns([
        { key: 'product', label: 'Produto', format: columnFormatters.product },
        { key: 'company', label: 'Empresa' },
        { key: 'pontual', label: 'Pontual', format: columnFormatters.currency },
        { key: 'mrr', label: 'MRR Associado', format: columnFormatters.currency },
        { key: 'value', label: 'Total Contrato', format: columnFormatters.currency },
        { key: 'responsible', label: 'Closer' },
        { key: 'date', label: 'Data', format: columnFormatters.date },
      ]);
      setDetailSheetItems(itemsWithPct.sort((a, b) => (b.pontual || 0) - (a.pontual || 0)));
      setDetailSheetOpen(true);
      return;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">Visão Meta Pace</h2>
          <div className="flex flex-wrap items-center gap-3">
            <MultiSelect
              options={buOptions}
              selected={selectedBUs}
              onSelectionChange={(v) => setSelectedBUs(v as BUType[])}
              placeholder="Selecionar BUs"
              allLabel="Consolidado"
              className="w-44"
            />

            {availableClosers.length > 0 && (
              <MultiSelect
                options={availableClosers}
                selected={selectedClosers}
                onSelectionChange={setSelectedClosers}
                placeholder="Todos Closers"
                allLabel="Todos Closers"
                className="w-44"
              />
            )}

            {availableSDRs.length > 0 && (
              <MultiSelect
                options={availableSDRs}
                selected={selectedSDRs}
                onSelectionChange={setSelectedSDRs}
                placeholder="Todos SDRs"
                allLabel="Todos SDRs"
                className="w-40"
              />
            )}

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
                  <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(endOfDay(d))} locale={ptBR} className="pointer-events-auto" />
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

      {/* Cards - Quantity Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {indicatorConfigs.map((indicator) => (
          <RadialProgressCard 
            key={indicator.key} 
            title={indicator.label} 
            realized={getRealizedForIndicator(indicator)} 
            meta={getMetaForIndicator(indicator)} 
            isClickable={true}
            onClick={() => handleRadialCardClick(indicator)}
          />
        ))}
      </div>

      {/* Cards - Monetary Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {monetaryIndicatorConfigs.map((indicator) => (
          <MonetaryRadialCard 
            key={indicator.key} 
            title={indicator.label} 
            realized={getRealizedMonetaryForIndicator(indicator)} 
            meta={getMetaMonetaryForIndicator(indicator)}
            format={indicator.format}
            isClickable={true}
            onClick={() => handleMonetaryCardClick(indicator)}
          />
        ))}
      </div>

      {/* New Charts - MQLs, Leads and Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <LeadsMqlsStackedChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedBUs={selectedBUs} selectedClosers={selectedClosers} />
          <MeetingsScheduledChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedBUs={selectedBUs} selectedClosers={selectedClosers} />
        </div>
        <ClickableFunnelChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedBUs={selectedBUs} selectedClosers={selectedClosers} />
      </div>

      {/* Charts Section with View Mode Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Gráficos de Indicadores</h3>
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="bg-muted rounded-lg p-1"
          >
            <ToggleGroupItem 
              value="daily" 
              aria-label="Meta Diária"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm gap-2 px-3"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Meta Diária</span>
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="accumulated" 
              aria-label="Meta Acumulada"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm gap-2 px-3"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Meta Acumulada</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {indicatorConfigs.map((indicator) => (
          <IndicatorChartSection 
            key={indicator.key} 
            title={indicator.label} 
            realizedLabel={indicator.shortLabel}
            realizedTotal={getRealizedForIndicator(indicator)} 
            metaTotal={getMetaForIndicator(indicator)}
            chartData={getChartDataForIndicator(indicator)} 
            gradientId={`gradient-${indicator.key}`}
            isAccumulated={viewMode === 'accumulated'}
          />
        ))}
      </div>

      {/* Revenue Breakdown Chart */}
      <RevenueBreakdownChart 
        startDate={startDate} 
        endDate={endDate} 
        selectedBU={selectedBU} 
        selectedBUs={selectedBUs}
        selectedClosers={selectedClosers}
      />

      {/* Chart Comparison Section - Temporary for selection */}
      <RevenueChartComparison
        startDate={startDate}
        endDate={endDate}
        selectedBUs={selectedBUs}
        selectedClosers={selectedClosers}
      />

      {(isLoading || isLoadingExpansao || isLoadingO2Tax) && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-2 bg-card p-4 rounded-lg shadow-lg"><Loader2 className="h-5 w-5 animate-spin" /><span>Carregando dados...</span></div>
        </div>
      )}

      {/* Detail Sheet for Radial Cards */}
      <DetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        title={detailSheetTitle}
        description={detailSheetDescription}
        items={detailSheetItems}
        columns={detailSheetColumns}
        kpis={detailSheetKpis}
        charts={detailSheetCharts}
      />
    </div>
  );
}
