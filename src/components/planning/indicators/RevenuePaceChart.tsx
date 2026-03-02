import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenuePaceChartProps {
  realized: number;
  meta: number;
  paceExpected: number;
  isLoading: boolean;
}

const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${Math.round(value)}`;
};

export function RevenuePaceChart({ realized, meta, paceExpected, isLoading }: RevenuePaceChartProps) {
  const realizedPct = meta > 0 ? Math.min((realized / meta) * 100, 100) : 0;
  const pacePct = meta > 0 ? Math.min((paceExpected / meta) * 100, 100) : 0;
  const paceRatio = paceExpected > 0 ? realized / paceExpected : 0;

  // Status logic
  const status: 'success' | 'warning' | 'danger' =
    paceRatio >= 1 ? 'success' : paceRatio >= 0.8 ? 'warning' : 'danger';

  const statusConfig = {
    success: {
      label: 'Acima do pace',
      icon: TrendingUp,
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    warning: {
      label: 'No ritmo',
      icon: Minus,
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    danger: {
      label: 'Abaixo do pace',
      icon: TrendingDown,
      barColor: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-16 flex-1" />
            <Skeleton className="h-16 flex-1" />
            <Skeleton className="h-16 flex-1" />
          </div>
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            Incremento de Faturamento
          </CardTitle>
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            config.bgColor, config.textColor, config.borderColor
          )}>
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border border-border">
            <span className="text-lg font-bold text-foreground">{formatCompactCurrency(realized)}</span>
            <span className="text-xs text-muted-foreground">Realizado</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border border-border">
            <span className="text-lg font-bold text-foreground">{formatCompactCurrency(meta)}</span>
            <span className="text-xs text-muted-foreground">Meta Período</span>
          </div>
          <div className={cn(
            "flex flex-col items-center p-3 rounded-lg border",
            config.bgColor, config.borderColor
          )}>
            <span className={cn("text-lg font-bold", config.textColor)}>
              {formatCompactCurrency(paceExpected)}
            </span>
            <span className="text-xs text-muted-foreground">Pace Esperado</span>
          </div>
        </div>

        {/* Progress bar with pace marker */}
        <div className="relative">
          {/* Bar background */}
          <div className="h-5 w-full rounded-full bg-muted overflow-hidden">
            {/* Realized fill */}
            <div
              className={cn("h-full rounded-full transition-all duration-500", config.barColor)}
              style={{ width: `${realizedPct}%` }}
            />
          </div>

          {/* Pace marker */}
          {pacePct > 0 && (
            <div
              className="absolute top-0 h-5 flex flex-col items-center"
              style={{ left: `${pacePct}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-5 bg-foreground/70" />
            </div>
          )}

          {/* Labels below bar */}
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{Math.round(realizedPct)}% da meta</span>
            <span>Pace: {Math.round(pacePct)}%</span>
          </div>
        </div>

        {/* Pace detail text */}
        <p className="text-xs text-muted-foreground text-center">
          Pace: {formatCompactCurrency(realized)} de {formatCompactCurrency(paceExpected)} esperados até hoje ({paceExpected > 0 ? Math.round(paceRatio * 100) : 0}%)
        </p>
      </CardContent>
    </Card>
  );
}
