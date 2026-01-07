import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Line,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { RefreshCw, Loader2 } from "lucide-react";
import { useFunnelRealized, IndicatorType, BUType } from "@/hooks/useFunnelRealized";
import { useMediaMetas, FunnelDataItem } from "@/contexts/MediaMetasContext";

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type FilterBU = BUType | 'all';

interface IndicatorConfig {
  key: IndicatorType;
  label: string;
  shortLabel: string;
  metaKey: 'mqls' | 'rms' | 'rrs' | 'propostas' | 'vendas';
}

const indicatorConfigs: IndicatorConfig[] = [
  { key: 'mql', label: 'MQLs', shortLabel: 'MQLs', metaKey: 'mqls' },
  { key: 'rm', label: 'Reuniões Agendadas', shortLabel: 'Agendadas', metaKey: 'rms' },
  { key: 'rr', label: 'Reuniões Realizadas', shortLabel: 'Realizadas', metaKey: 'rrs' },
  { key: 'proposta', label: 'Propostas Enviadas', shortLabel: 'Propostas', metaKey: 'propostas' },
  { key: 'venda', label: 'Vendas', shortLabel: 'Vendas', metaKey: 'vendas' },
];

const buOptions: { value: FilterBU; label: string }[] = [
  { value: 'all', label: 'Consolidado' },
  { value: 'modelo_atual', label: 'Modelo Atual' },
  { value: 'o2_tax', label: 'O2 TAX' },
  { value: 'oxy_hacker', label: 'Oxy Hacker' },
  { value: 'franquia', label: 'Franquia' },
];

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
};

interface RadialProgressCardProps {
  title: string;
  realized: number;
  meta: number;
}

const RadialProgressCard = ({ title, realized, meta }: RadialProgressCardProps) => {
  const percentage = meta > 0 ? (realized / meta) * 100 : 0;
  const isAboveMeta = percentage >= 100;
  const displayPercentage = Math.round(percentage);
  
  const chartData = [{ value: Math.min(percentage, 100), fill: isAboveMeta ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground text-center">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-0">
        <div className="relative w-24 h-24">
          <RadialBarChart
            width={96}
            height={96}
            innerRadius="70%"
            outerRadius="100%"
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "hsl(var(--muted))" }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{formatNumber(realized)}</span>
            <span className={`text-xs font-medium ${isAboveMeta ? "text-chart-2" : "text-destructive"}`}>
              {displayPercentage}%
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Meta: {formatNumber(meta)}
        </p>
      </CardContent>
    </Card>
  );
};

interface IndicatorChartSectionProps {
  title: string;
  realizedLabel: string;
  realizedTotal: number;
  metaTotal: number;
  chartData: { month: string; realizado: number; meta: number }[];
  gradientId: string;
}

const IndicatorChartSection = ({
  title,
  realizedLabel,
  realizedTotal,
  metaTotal,
  chartData,
  gradientId,
}: IndicatorChartSectionProps) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground">
            {title}
          </CardTitle>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">
              {realizedLabel}: <span className="text-foreground font-medium">{formatNumber(realizedTotal)}</span>
            </span>
            <span className="text-muted-foreground">
              Meta: <span className="text-foreground font-medium">{formatNumber(metaTotal)}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-chart-1 rounded" />
            <span className="text-xs text-muted-foreground">Meta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-chart-2 rounded" />
            <span className="text-xs text-muted-foreground">Realizado</span>
          </div>
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
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Area
                type="monotone"
                dataKey="realizado"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                name="Realizado"
              />
              <Line
                type="monotone"
                dataKey="meta"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
                name="Meta"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export function IndicatorsTab() {
  const [selectedBU, setSelectedBU] = useState<FilterBU>('all');
  const [startMonth, setStartMonth] = useState<string>('Jan');
  const [endMonth, setEndMonth] = useState<string>('Dez');

  const { getMonthlyTotals, syncWithPipefy, isSyncing, isLoading } = useFunnelRealized(2026);
  const { funnelData } = useMediaMetas();

  // Get filtered months based on period selection
  const filteredMonths = useMemo(() => {
    const startIdx = months.indexOf(startMonth);
    const endIdx = months.indexOf(endMonth);
    if (startIdx > endIdx) return months;
    return months.slice(startIdx, endIdx + 1);
  }, [startMonth, endMonth]);

  // Calculate metas from MediaMetas context (funnelData)
  const getMetaForIndicator = (metaKey: 'mqls' | 'rms' | 'rrs' | 'propostas' | 'vendas'): Record<string, number> => {
    const result: Record<string, number> = {};
    months.forEach((month) => {
      result[month] = 0;
    });

    if (!funnelData) return result;

    type FunnelBUKey = 'modeloAtual' | 'o2Tax' | 'oxyHacker' | 'franquia';
    
    const buMapping: Record<FilterBU, FunnelBUKey[]> = {
      'all': ['modeloAtual', 'o2Tax', 'oxyHacker', 'franquia'],
      'modelo_atual': ['modeloAtual'],
      'o2_tax': ['o2Tax'],
      'oxy_hacker': ['oxyHacker'],
      'franquia': ['franquia'],
    };

    const buKeys = buMapping[selectedBU];

    buKeys.forEach((buKey) => {
      const buFunnel = funnelData[buKey] as FunnelDataItem[] | undefined;
      if (buFunnel) {
        buFunnel.forEach((item) => {
          const monthName = item.month;
          const value = item[metaKey];
          if (monthName && typeof value === 'number') {
            result[monthName] = (result[monthName] || 0) + value;
          }
        });
      }
    });

    return result;
  };

  // Calculate totals for cards
  const calculateTotals = (indicator: IndicatorConfig) => {
    const realized = getMonthlyTotals(indicator.key, selectedBU);
    const meta = getMetaForIndicator(indicator.metaKey);

    let totalRealized = 0;
    let totalMeta = 0;

    filteredMonths.forEach((month) => {
      totalRealized += realized[month] || 0;
      totalMeta += meta[month] || 0;
    });

    return { totalRealized, totalMeta };
  };

  // Generate chart data for an indicator
  const getChartData = (indicator: IndicatorConfig) => {
    const realized = getMonthlyTotals(indicator.key, selectedBU);
    const meta = getMetaForIndicator(indicator.metaKey);

    return filteredMonths.map((month) => ({
      month,
      meta: Math.round(meta[month] || 0),
      realizado: realized[month] || 0,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">Visão Meta Pace</h2>
          <div className="flex items-center gap-3">
            <Select value={selectedBU} onValueChange={(v) => setSelectedBU(v as FilterBU)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">a</span>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => syncWithPipefy()} 
              disabled={isSyncing}
              variant="outline"
              size="icon"
              title="Sincronizar Pipefy"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Radial Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {indicatorConfigs.map((indicator) => {
          const { totalRealized, totalMeta } = calculateTotals(indicator);
          return (
            <RadialProgressCard
              key={indicator.key}
              title={indicator.label}
              realized={totalRealized}
              meta={totalMeta}
            />
          );
        })}
      </div>

      {/* Area Charts - Stacked Vertically */}
      <div className="space-y-4">
        {indicatorConfigs.map((indicator) => {
          const chartData = getChartData(indicator);
          const { totalRealized, totalMeta } = calculateTotals(indicator);
          
          return (
            <IndicatorChartSection
              key={indicator.key}
              title={indicator.label}
              realizedLabel={indicator.shortLabel}
              realizedTotal={totalRealized}
              metaTotal={totalMeta}
              chartData={chartData}
              gradientId={`gradient-${indicator.key}`}
            />
          );
        })}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-2 bg-card p-4 rounded-lg shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando dados...</span>
          </div>
        </div>
      )}
    </div>
  );
}
