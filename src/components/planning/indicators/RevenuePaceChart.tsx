import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";

interface RevenuePaceChartProps {
  realized: number;
  meta: number;
  mrrBase: number;
  paceExpected: number;
  isLoading: boolean;
  chartData: { label: string; realized: number; meta: number }[];
}

const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${Math.round(value)}`;
};

export function RevenuePaceChart({ realized, meta, mrrBase, paceExpected, isLoading, chartData }: RevenuePaceChartProps) {
  // Total values (MRR Base + Increment)
  const totalRealized = mrrBase + realized;
  const totalMeta = mrrBase + meta;
  const totalPace = mrrBase + paceExpected;

  const paceRatio = totalPace > 0 ? totalRealized / totalPace : 0;

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

  const totalPercentage = totalMeta > 0 ? (totalRealized / totalMeta) * 100 : 0;

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
          <Skeleton className="h-28 w-full" />
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
              Faturamento
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
        {/* Single KPI Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Realizado</p>
                <p className="text-xl font-bold text-foreground">{formatCompactCurrency(totalRealized)}</p>
                <p className="text-[10px] text-muted-foreground">
                  MRR Base: {formatCompactCurrency(mrrBase)} + Incremento: {formatCompactCurrency(realized)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Meta</p>
                <p className="text-xl font-bold text-foreground">{formatCompactCurrency(totalMeta)}</p>
                <p className="text-[10px] text-muted-foreground">
                  MRR Base: {formatCompactCurrency(mrrBase)} + Meta Inc.: {formatCompactCurrency(meta)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pace Esperado</p>
                <p className="text-xl font-bold text-foreground">{formatCompactCurrency(totalPace)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Atingimento</p>
                <p className={cn(
                  "text-xl font-bold",
                  paceRatio >= 1 ? "text-emerald-600 dark:text-emerald-400" : paceRatio >= 0.8 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                )}>
                  {Math.round(totalPercentage)}%
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={Math.min(totalPercentage, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart: Realized vs Meta per period (including MRR Base pro-rata) */}
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

              {avgMeta > 0 && (
                <ReferenceLine
                  y={avgMeta}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: 'Pace', fill: '#22c55e', fontSize: 10, position: 'right' }}
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
