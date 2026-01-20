import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface MqlsByRevenueWidgetProps {
  buKey: string;
}

// Mock data - will be replaced with real data fetching
const mockData = [
  { range: "Até R$ 50k", count: 35, percentage: 40, color: "hsl(var(--chart-1))" },
  { range: "R$ 50k - 200k", count: 28, percentage: 32, color: "hsl(var(--chart-2))" },
  { range: "R$ 200k - 1M", count: 18, percentage: 21, color: "hsl(var(--chart-3))" },
  { range: "Acima de 1M", count: 6, percentage: 7, color: "hsl(var(--chart-4))" },
];

export function MqlsByRevenueWidget({ buKey }: MqlsByRevenueWidgetProps) {
  const total = mockData.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          MQLs por Faixa de Faturamento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {total} MQLs qualificados
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis 
                type="category" 
                dataKey="range" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                width={90}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--popover))", 
                  border: "1px solid hsl(var(--border))", 
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))"
                }}
                formatter={(value: number, name: string, props: any) => {
                  const item = mockData.find(d => d.count === value);
                  return [`${value} (${item?.percentage}%)`, "MQLs"];
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {mockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {mockData.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
