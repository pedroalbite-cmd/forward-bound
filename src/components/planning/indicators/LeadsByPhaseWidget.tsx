import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface LeadsByPhaseWidgetProps {
  buKey: string;
}

// Mock data - will be replaced with real data fetching
const mockData = [
  { phase: "MQL", count: 45, color: "hsl(var(--chart-1))" },
  { phase: "RM", count: 28, color: "hsl(var(--chart-2))" },
  { phase: "RR", count: 18, color: "hsl(var(--chart-3))" },
  { phase: "Proposta", count: 12, color: "hsl(var(--chart-4))" },
  { phase: "Assinatura", count: 5, color: "hsl(var(--chart-5))" },
];

export function LeadsByPhaseWidget({ buKey }: LeadsByPhaseWidgetProps) {
  const total = mockData.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Leads por Fase Atual
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {total} leads no pipeline
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis 
                type="category" 
                dataKey="phase" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                width={70}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--popover))", 
                  border: "1px solid hsl(var(--border))", 
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))"
                }}
                formatter={(value: number) => [value, "Leads"]}
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
