import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface MeetingsByRevenueWidgetProps {
  buKey: string;
}

// Mock data - will be replaced with real data fetching
const mockData = [
  { range: "Até R$ 50k", count: 12, color: "hsl(var(--chart-1))" },
  { range: "R$ 50k - 200k", count: 18, color: "hsl(var(--chart-2))" },
  { range: "R$ 200k - 1M", count: 8, color: "hsl(var(--chart-3))" },
  { range: "Acima de 1M", count: 5, color: "hsl(var(--chart-4))" },
];

export function MeetingsByRevenueWidget({ buKey }: MeetingsByRevenueWidgetProps) {
  const total = mockData.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Reuniões por Faixa de Faturamento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {total} reuniões agendadas
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
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
                formatter={(value: number) => [value, "Reuniões"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {mockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
