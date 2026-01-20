import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DealsWonWidgetProps {
  buKey: string;
}

// Mock data - will be replaced with real data fetching
const mockTrendData = [
  { day: 1, value: 1 },
  { day: 2, value: 2 },
  { day: 3, value: 2 },
  { day: 4, value: 3 },
  { day: 5, value: 4 },
  { day: 6, value: 5 },
  { day: 7, value: 6 },
  { day: 8, value: 7 },
  { day: 9, value: 8 },
  { day: 10, value: 9 },
  { day: 11, value: 10 },
  { day: 12, value: 12 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export function DealsWonWidget({ buKey }: DealsWonWidgetProps) {
  const dealsWon = 12;
  const totalValue = 180000;
  const trend = 15; // percentage vs previous period
  const isPositiveTrend = trend >= 0;

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Negócios Ganhos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{dealsWon}</span>
              <span className="text-sm text-muted-foreground">fechados</span>
            </div>
            <div className="mt-1">
              <span className="text-lg font-semibold text-chart-2">{formatCurrency(totalValue)}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {isPositiveTrend ? (
                <TrendingUp className="h-4 w-4 text-chart-2" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={`text-sm font-medium ${isPositiveTrend ? "text-chart-2" : "text-destructive"}`}>
                {isPositiveTrend ? "+" : ""}{trend}%
              </span>
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          </div>
          <div className="w-24 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="dealsWonGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  fill="url(#dealsWonGradient)" 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))"
                  }}
                  formatter={(value: number) => [value, "Vendas"]}
                  labelFormatter={() => ""}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
