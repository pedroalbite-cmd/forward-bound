import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Users, TrendingUp, Target } from "lucide-react";
import { formatCurrency, formatCompact, months } from "./salesData";

interface ExpansaoBreakdownProps {
  projectedOxyHacker: Record<string, number>;
  projectedFranquia: Record<string, number>;
  realizedOxyHacker: Record<string, number>;
  realizedFranquia: Record<string, number>;
  isLoading: boolean;
}

export function ExpansaoBreakdown({
  projectedOxyHacker,
  projectedFranquia,
  realizedOxyHacker,
  realizedFranquia,
  isLoading,
}: ExpansaoBreakdownProps) {
  const oxyHackerProjectedTotal = Object.values(projectedOxyHacker).reduce((a, b) => a + b, 0);
  const oxyHackerRealizedTotal = Object.values(realizedOxyHacker).reduce((a, b) => a + b, 0);
  const oxyHackerRate = oxyHackerProjectedTotal > 0 ? (oxyHackerRealizedTotal / oxyHackerProjectedTotal) * 100 : 0;
  const oxyHackerGap = oxyHackerProjectedTotal - oxyHackerRealizedTotal;

  const franquiaProjectedTotal = Object.values(projectedFranquia).reduce((a, b) => a + b, 0);
  const franquiaRealizedTotal = Object.values(realizedFranquia).reduce((a, b) => a + b, 0);
  const franquiaRate = franquiaProjectedTotal > 0 ? (franquiaRealizedTotal / franquiaProjectedTotal) * 100 : 0;
  const franquiaGap = franquiaProjectedTotal - franquiaRealizedTotal;

  const products = [
    {
      key: 'oxy_hacker',
      label: 'Oxy Hacker',
      icon: <Rocket className="h-5 w-5" />,
      color: 'hsl(var(--accent))',
      colorClass: 'text-accent',
      projected: oxyHackerProjectedTotal,
      realized: oxyHackerRealizedTotal,
      rate: oxyHackerRate,
      gap: oxyHackerGap,
      projectedByMonth: projectedOxyHacker,
      realizedByMonth: realizedOxyHacker,
    },
    {
      key: 'franquia',
      label: 'Franquias',
      icon: <Users className="h-5 w-5" />,
      color: 'hsl(var(--secondary))',
      colorClass: 'text-secondary-foreground',
      projected: franquiaProjectedTotal,
      realized: franquiaRealizedTotal,
      rate: franquiaRate,
      gap: franquiaGap,
      projectedByMonth: projectedFranquia,
      realizedByMonth: realizedFranquia,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[1, 2].map((i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Target className="h-4 w-4" />
        <span className="text-sm font-medium">Detalhamento por Produto - Expansão O2</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => {
          const isPositive = product.rate >= 80;
          const isWarning = product.rate >= 50 && product.rate < 80;

          return (
            <Card 
              key={product.key}
              className={`glass-card transition-all hover:scale-[1.02] ${
                isPositive 
                  ? 'border-success/30' 
                  : isWarning 
                    ? 'border-warning/30' 
                    : 'border-destructive/30'
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${product.colorClass}`}>
                    {product.icon}
                    <span className="font-display text-base">{product.label}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${
                      isPositive 
                        ? 'bg-success/10 text-success border-success/30' 
                        : isWarning 
                          ? 'bg-warning/10 text-warning border-warning/30' 
                          : 'bg-destructive/10 text-destructive border-destructive/30'
                    }`}
                  >
                    {product.rate.toFixed(1)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress bar */}
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      isPositive 
                        ? 'bg-success' 
                        : isWarning 
                          ? 'bg-warning' 
                          : 'bg-destructive'
                    }`}
                    style={{ width: `${Math.min(product.rate, 100)}%` }}
                  />
                </div>

                {/* Values */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Previsto</p>
                    <p className="font-display font-bold">{formatCompact(product.projected)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Realizado</p>
                    <p className="font-display font-bold">{formatCompact(product.realized)}</p>
                  </div>
                </div>

                {/* Gap */}
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Gap</span>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      product.gap <= 0 ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      {product.gap <= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                      {formatCompact(Math.abs(product.gap))}
                      {product.gap <= 0 && ' acima'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}