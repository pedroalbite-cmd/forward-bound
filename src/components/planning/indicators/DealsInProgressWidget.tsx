import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp } from "lucide-react";

interface DealsInProgressWidgetProps {
  buKey: string;
}

// Mock data - will be replaced with real data fetching
const mockData = [
  { phase: "RM", value: 12, color: "hsl(var(--chart-1))" },
  { phase: "RR", value: 8, color: "hsl(var(--chart-2))" },
  { phase: "Proposta", value: 6, color: "hsl(var(--chart-3))" },
  { phase: "Assinatura", value: 3, color: "hsl(var(--chart-4))" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export function DealsInProgressWidget({ buKey }: DealsInProgressWidgetProps) {
  const totalDeals = mockData.reduce((acc, item) => acc + item.value, 0);
  const totalValue = 345000; // Mock value

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Negócios em Andamento
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{totalDeals}</span>
              <span className="text-sm text-muted-foreground">negócios</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-chart-2" />
              <span className="text-lg font-semibold text-foreground">{formatCurrency(totalValue)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Valor potencial no pipeline
            </p>
          </div>
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData}
                  dataKey="value"
                  nameKey="phase"
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {mockData.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.phase}: {item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
