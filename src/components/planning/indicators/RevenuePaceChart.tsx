import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUType } from "@/hooks/useFunnelRealized";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, AreaChart, Area } from "recharts";

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

interface BUData {
  realized: number;
  meta: number;
  pace: number;
}

interface RevenuePaceChartProps {
  realized: number;
  meta: number;
  paceExpected: number;
  isLoading: boolean;
  selectedBUs: BUType[];
  dataByBU: Record<string, BUData>;
  chartData: { label: string; realized: number; meta: number }[];
  faturamentoTotal?: number;
}

const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${Math.round(value)}`;
};

function BUPaceCard({ bu, data, color }: { bu: BUType; data: BUData; color: string }) {
  const percentage = data.meta > 0 ? (data.realized / data.meta) * 100 : 0;
  const paceRatio = data.pace > 0 ? data.realized / data.pace : 0;
  const isAbovePace = paceRatio >= 1;

  return (
    <Card className="bg-card border-border flex-1 min-w-[140px]">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">{BU_LABELS[bu]}</span>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
        <div className="text-lg font-bold text-foreground">
          {formatCompactCurrency(data.realized)}
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={isAbovePace ? "text-green-500" : "text-destructive"}>
              {Math.round(percentage)}% meta
            </span>
            <span className="text-muted-foreground text-[10px]">
              Pace: {Math.round(paceRatio * 100)}%
            </span>
          </div>
          <Progress value={Math.min(percentage, 100)} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function RevenuePaceChart({ realized, meta, paceExpected, isLoading, selectedBUs, dataByBU, chartData, faturamentoTotal }: RevenuePaceChartProps) {
  const paceRatio = paceExpected > 0 ? realized / paceExpected : 0;

  const status: 'success' | 'warning' | 'danger' =
    paceRatio >= 1 ? 'success' : paceRatio >= 0.8 ? 'warning' : 'danger';

  const statusConfig = {
    success: {
      label: 'Acima do pace',
      icon: TrendingUp,
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    warning: {
      label: 'No ritmo',
      icon: Minus,
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    danger: {
      label: 'Abaixo do pace',
      icon: TrendingDown,
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const totalPercentage = meta > 0 ? (realized / meta) * 100 : 0;
  const isTotalAbovePace = paceRatio >= 1;

  // Average meta per period for reference line
  const avgMeta = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + d.meta, 0) / chartData.length
    : 0;

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold text-foreground">
              Incremento de Faturamento
            </CardTitle>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            config.bgColor, config.textColor, config.borderColor
          )}>
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        {/* KPI Cards Row */}
        <div className="flex gap-3 flex-wrap">
          {selectedBUs.map(bu => (
            <BUPaceCard
              key={bu}
              bu={bu}
              data={dataByBU[bu] || { realized: 0, meta: 0, pace: 0 }}
              color={BU_COLORS[bu]}
            />
          ))}

          {/* Total Card */}
          <Card className="bg-primary/5 border-primary/20 flex-1 min-w-[140px]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-primary">TOTAL</span>
              </div>
              <div className="text-xl font-bold text-foreground">
                {formatCompactCurrency(realized)}
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={isTotalAbovePace ? "text-green-500" : "text-destructive"}>
                    {Math.round(totalPercentage)}% meta
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    Pace: {Math.round(paceRatio * 100)}%
                  </span>
                </div>
                <Progress value={Math.min(totalPercentage, 100)} className="h-1.5" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Meta: {formatCompactCurrency(meta)} | Pace: {formatCompactCurrency(paceExpected)}
              </p>
              {faturamentoTotal != null && faturamentoTotal > 0 && (
                <p className="text-[10px] font-medium text-primary mt-1">
                  Fat. Previsto: {formatCompactCurrency(faturamentoTotal)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart: Realized vs Meta per period */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
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
                  name === 'realized' ? 'Realizado' : 'Meta'
                ]}
              />

              <Bar dataKey="realized" fill="hsl(var(--primary))" name="realized" radius={[4, 4, 0, 0]} />
              <Bar dataKey="meta" fill="hsl(var(--muted-foreground)/0.3)" name="meta" radius={[4, 4, 0, 0]} />

              {/* Pace reference line */}
              {avgMeta > 0 && (
                <ReferenceLine
                  y={avgMeta}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: 'Meta média', fill: '#22c55e', fontSize: 10, position: 'right' }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>Realizado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
            <span>Meta</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0 border-t-2 border-dashed border-green-500" />
            <span>Pace</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
