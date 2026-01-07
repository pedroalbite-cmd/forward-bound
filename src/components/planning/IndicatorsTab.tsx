import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Users, Calendar, CheckCircle, FileText, ShoppingCart, RefreshCw, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useFunnelRealized, IndicatorType, BUType } from "@/hooks/useFunnelRealized";
import { useMediaMetas, FunnelDataItem } from "@/contexts/MediaMetasContext";

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type FilterBU = BUType | 'all';

interface IndicatorConfig {
  key: IndicatorType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  metaKey: 'mqls' | 'rms' | 'rrs' | 'propostas' | 'vendas';
  color: string;
}

const indicatorConfigs: IndicatorConfig[] = [
  { key: 'mql', label: 'MQLs', icon: Users, metaKey: 'mqls', color: 'hsl(var(--primary))' },
  { key: 'rm', label: 'Reuniões Agendadas', icon: Calendar, metaKey: 'rms', color: 'hsl(var(--warning))' },
  { key: 'rr', label: 'Reuniões Realizadas', icon: CheckCircle, metaKey: 'rrs', color: 'hsl(var(--accent))' },
  { key: 'proposta', label: 'Propostas Enviadas', icon: FileText, metaKey: 'propostas', color: 'hsl(var(--secondary))' },
  { key: 'venda', label: 'Vendas', icon: ShoppingCart, metaKey: 'vendas', color: 'hsl(142, 76%, 36%)' },
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

const formatPercent = (value: number) => {
  if (!isFinite(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
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

    const percentage = totalMeta > 0 ? totalRealized / totalMeta : 0;

    return { totalRealized, totalMeta, percentage };
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

  const chartConfig = {
    meta: { label: "Meta", color: "hsl(var(--primary))" },
    realizado: { label: "Realizado", color: "hsl(142, 76%, 36%)" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Acompanhamento de Indicadores 2026</h2>
            <p className="text-muted-foreground">Metas vs Realizado - Dados do Pipefy</p>
          </div>
          <Button 
            onClick={() => syncWithPipefy()} 
            disabled={isSyncing}
            variant="outline"
            className="gap-2"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar Pipefy
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Unidade de Negócio</label>
            <Select value={selectedBU} onValueChange={(v) => setSelectedBU(v as FilterBU)}>
              <SelectTrigger className="w-[180px]">
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <div className="flex items-center gap-2">
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">até</span>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {indicatorConfigs.map((indicator) => {
          const Icon = indicator.icon;
          const { totalRealized, totalMeta, percentage } = calculateTotals(indicator);
          const isAboveTarget = percentage >= 1;

          return (
            <Card key={indicator.key} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">{indicator.label}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Meta</span>
                    <span className="text-sm font-medium">{formatNumber(totalMeta)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Realizado</span>
                    <span className="text-sm font-bold">{formatNumber(totalRealized)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Atingimento</span>
                    <Badge 
                      variant={isAboveTarget ? "default" : "secondary"}
                      className={isAboveTarget ? "bg-emerald-500" : ""}
                    >
                      <div className="flex items-center gap-1">
                        {isAboveTarget ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {formatPercent(percentage)}
                      </div>
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {indicatorConfigs.map((indicator) => {
          const chartData = getChartData(indicator);
          const Icon = indicator.icon;

          return (
            <Card key={indicator.key} className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="font-display">{indicator.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="meta" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Meta"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="realizado" 
                        stroke="hsl(142, 76%, 36%)" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Realizado"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
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
