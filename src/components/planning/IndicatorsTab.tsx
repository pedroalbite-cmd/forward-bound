import { useState, useMemo } from "react";
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
import { useCloserMetas } from "@/hooks/useCloserMetas";
import { format, startOfYear, endOfYear, endOfDay, differenceInDays, eachMonthOfInterval, addDays, eachDayOfInterval, getMonth, startOfMonth, endOfMonth } from "date-fns";
import { FunnelDataItem } from "@/contexts/MediaMetasContext";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LeadsMqlsStackedChart } from "./LeadsMqlsStackedChart";
import { LeadsStackedChart } from "./LeadsStackedChart";
import { ClickableFunnelChart } from "./ClickableFunnelChart";
import { AnalyticsSection } from "./indicators/AnalyticsSection";
import { DetailSheet, DetailItem, columnFormatters } from "./indicators/DetailSheet";
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

const buOptions: MultiSelectOption[] = [
  { value: 'modelo_atual', label: 'Modelo Atual' },
  { value: 'o2_tax', label: 'O2 TAX' },
  { value: 'oxy_hacker', label: 'Oxy Hacker' },
  { value: 'franquia', label: 'Franquia' },
];

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));

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

const IndicatorChartSection = ({ title, realizedLabel, realizedTotal, metaTotal, chartData, gradientId, isAccumulated }: {
  title: string; realizedLabel: string; realizedTotal: number; metaTotal: number;
  chartData: { label: string; realizado: number; meta: number }[]; gradientId: string; isAccumulated?: boolean;
}) => (
  <Card className="bg-card border-border">
    <CardHeader className="pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {isAccumulated && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Acumulado</span>
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
  </Card>
);

export function IndicatorsTab() {
  const currentYear = new Date().getFullYear();
  // Multi-selection state for BUs (all selected by default = "Consolidado")
  const [selectedBUs, setSelectedBUs] = useState<BUType[]>(['modelo_atual', 'o2_tax', 'oxy_hacker', 'franquia']);
  // Multi-selection state for Closers (empty = all closers)
  const [selectedClosers, setSelectedClosers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  
  // Detail sheet state for radial cards drill-down
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailSheetTitle, setDetailSheetTitle] = useState('');
  const [detailSheetDescription, setDetailSheetDescription] = useState('');
  const [detailSheetItems, setDetailSheetItems] = useState<DetailItem[]>([]);
  const [detailSheetColumns, setDetailSheetColumns] = useState<{ key: keyof DetailItem; label: string; format?: (value: any) => React.ReactNode }[]>([]);
  const [chartsOpen, setChartsOpen] = useState(true);

  const handleSync = () => {
    // Use the year from the start date for sync
    syncWithPipefy(startDate.getFullYear());
  };

  const { getTotal, syncWithPipefy, isSyncing, isLoading } = useFunnelRealized(startDate, endDate);
  const { getQtyForPeriod: getModeloAtualQty, getGroupedData: getModeloAtualGroupedData, isLoading: isLoadingModeloAtual } = useModeloAtualMetas(startDate, endDate);
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

  // Fixed list of closers for the filter dropdown (values match "Closer responsável" column in pipefy_moviment_cfos)
  const availableClosers: MultiSelectOption[] = [
    { value: 'Pedro Albite', label: 'Pedro' },
    { value: 'Daniel Trindade', label: 'Daniel' },
  ];

  // Filter function - checks if a responsavel matches selected closers
  const matchesCloserFilter = (responsavel?: string | null): boolean => {
    if (selectedClosers.length === 0) return true; // No filter = show all
    if (!responsavel) return false;
    return selectedClosers.includes(responsavel);
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
    
    // Modelo Atual - apply closer filter if closers are selected
    if (includesModeloAtual && funnelData.modeloAtual) {
      total += calcularMetaDoPeriodo(
        funnelData.modeloAtual, 
        indicator.key, 
        startDate, 
        endDate,
        'modelo_atual',
        selectedClosers.length > 0 ? selectedClosers : undefined
      );
    }
    // Other BUs - no closer filter (closers only apply to Modelo Atual)
    if (includesO2Tax && funnelData.o2Tax) {
      total += calcularMetaDoPeriodo(funnelData.o2Tax, indicator.key, startDate, endDate);
    }
    if (includesOxyHacker && funnelData.oxyHacker) {
      total += calcularMetaDoPeriodo(funnelData.oxyHacker, indicator.key, startDate, endDate);
    }
    if (includesFranquia && funnelData.franquia) {
      total += calcularMetaDoPeriodo(funnelData.franquia, indicator.key, startDate, endDate);
    }
    
    return total > 0 ? total : Math.round(indicator.annualMeta * periodFraction);
  };

  // Get realized value for indicator - sums realized from selected BUs
  // Applies closer filter for Modelo Atual when closers are selected
  const getRealizedForIndicator = (indicator: IndicatorConfig) => {
    let total = 0;
    
    if (includesModeloAtual) {
      // When closer filter is active, use analytics hook to filter cards by closer field
      if (selectedClosers.length > 0) {
        const cards = modeloAtualAnalytics.getCardsForIndicator(indicator.key);
        const filteredCards = cards.filter(card => {
          const closerValue = (card.closer || '').trim();
          return closerValue && selectedClosers.includes(closerValue);
        });
        total += filteredCards.length;
      } else {
        total += getModeloAtualQty(indicator.key as ModeloAtualIndicator, startDate, endDate);
      }
    }
    if (includesO2Tax) {
      total += getO2TaxQty(indicator.key as O2TaxIndicator, startDate, endDate);
    }
    if (includesOxyHacker) {
      total += getOxyHackerQty(indicator.key as OxyHackerIndicator, startDate, endDate);
    }
    if (includesFranquia) {
      total += getExpansaoQty(indicator.key as ExpansaoIndicator, startDate, endDate);
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

  // Get columns for indicator type
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
        { key: 'value' as keyof DetailItem, label: 'Valor', format: columnFormatters.currency },
        { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
      ];
    }

    return [
      ...baseColumns,
      { key: 'revenueRange' as keyof DetailItem, label: 'Faixa Faturamento' },
      { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
    ];
  };

  // Get detail items for an indicator based on selected BUs and closer filter
  const getItemsForIndicator = (indicatorKey: IndicatorType): DetailItem[] => {
    let items: DetailItem[] = [];
    
    // Aggregate items from selected BUs
    if (includesModeloAtual) {
      items = [...items, ...modeloAtualAnalytics.getDetailItemsForIndicator(indicatorKey)];
    }
    
    if (includesO2Tax) {
      items = [...items, ...o2TaxAnalytics.getDetailItemsForIndicator(indicatorKey)];
    }
    
    if (includesFranquia) {
      items = [...items, ...franquiaAnalytics.getDetailItemsForIndicator(indicatorKey)];
    }
    
    if (includesOxyHacker) {
      items = [...items, ...oxyHackerAnalytics.getDetailItemsForIndicator(indicatorKey)];
    }
    
    // Apply closer filter if any closers are selected
    if (selectedClosers.length > 0) {
      items = items.filter(item => matchesCloserFilter(item.responsible));
    }
    
    return items;
  };

  // Handle radial card click
  const handleRadialCardClick = (indicator: IndicatorConfig) => {
    const items = getItemsForIndicator(indicator.key);
    const columns = getColumnsForIndicator(indicator.key);
    const realized = getRealizedForIndicator(indicator);
    
    setDetailSheetTitle(indicator.label);
    setDetailSheetDescription(`${formatNumber(realized)} registros no período selecionado`);
    setDetailSheetItems(items);
    setDetailSheetColumns(columns);
    setDetailSheetOpen(true);
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

      {/* Cards */}
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

      {/* New Charts - MQLs, Leads and Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <LeadsMqlsStackedChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedBUs={selectedBUs} selectedClosers={selectedClosers} />
          <LeadsStackedChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedBUs={selectedBUs} selectedClosers={selectedClosers} />
        </div>
        <ClickableFunnelChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedBUs={selectedBUs} selectedClosers={selectedClosers} />
      </div>

      {/* Charts Section with View Mode Toggle - Collapsible */}
      <Collapsible open={chartsOpen} onOpenChange={setChartsOpen} className="w-full">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground">Gráficos de Indicadores</h3>
                <p className="text-sm text-muted-foreground">Evolução diária/acumulada de MQLs, RM, RR, Propostas e Vendas</p>
              </div>
            </div>
            {chartsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="flex justify-end">
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
        </CollapsibleContent>
      </Collapsible>

      {/* Analytics Section */}
      <AnalyticsSection buKey={selectedBU} startDate={startDate} endDate={endDate} />

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
      />
    </div>
  );
}
