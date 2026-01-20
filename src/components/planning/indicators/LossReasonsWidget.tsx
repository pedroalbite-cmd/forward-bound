import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface LossReasonsWidgetProps {
  buKey: string;
}

// Mock data - will be replaced with real data fetching
const mockData = [
  { reason: "Preço", count: 8, percentage: 35, color: "hsl(var(--chart-1))" },
  { reason: "Timing", count: 6, percentage: 26, color: "hsl(var(--chart-2))" },
  { reason: "Concorrência", count: 5, percentage: 22, color: "hsl(var(--chart-3))" },
  { reason: "Sem resposta", count: 3, percentage: 13, color: "hsl(var(--chart-4))" },
  { reason: "Outros", count: 1, percentage: 4, color: "hsl(var(--chart-5))" },
];

export function LossReasonsWidget({ buKey }: LossReasonsWidgetProps) {
  const total = mockData.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Motivos de Perda
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {total} negócios analisados
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-start gap-4">
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData}
                  dataKey="count"
                  nameKey="reason"
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
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {mockData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.reason}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
