import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { ExternalLink } from "lucide-react";
import { DetailSheet, DetailItem, columnFormatters } from "./DetailSheet";

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

const mockMqlsByRevenue: DetailItem[] = [
  { id: "1", name: "Tech Solutions", company: "João Silva", revenueRange: "R$ 50k - 200k", date: "2026-01-15", responsible: "Marketing" },
  { id: "2", name: "Inovação Digital", company: "Maria Santos", revenueRange: "R$ 200k - 1M", date: "2026-01-14", responsible: "Marketing" },
  { id: "3", name: "Startup XYZ", company: "Pedro Costa", revenueRange: "Até R$ 50k", date: "2026-01-13", responsible: "SDR" },
  { id: "4", name: "Mega Corp", company: "Fernanda Lima", revenueRange: "Acima de 1M", date: "2026-01-12", responsible: "Marketing" },
  { id: "5", name: "Alpha Services", company: "Ricardo Alves", revenueRange: "R$ 50k - 200k", date: "2026-01-10", responsible: "SDR" },
  { id: "6", name: "Beta Tech", company: "Juliana Martins", revenueRange: "R$ 200k - 1M", date: "2026-01-09", responsible: "Marketing" },
  { id: "7", name: "Gamma Solutions", company: "André Oliveira", revenueRange: "Até R$ 50k", date: "2026-01-08", responsible: "SDR" },
  { id: "8", name: "Delta Inc", company: "Camila Souza", revenueRange: "R$ 50k - 200k", date: "2026-01-07", responsible: "Marketing" },
  { id: "9", name: "Epsilon SA", company: "Bruno Ferreira", revenueRange: "Até R$ 50k", date: "2026-01-06", responsible: "SDR" },
  { id: "10", name: "Zeta Corp", company: "Larissa Gomes", revenueRange: "R$ 50k - 200k", date: "2026-01-05", responsible: "Marketing" },
];

export function MqlsByRevenueWidget({ buKey }: MqlsByRevenueWidgetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  
  const total = mockData.reduce((acc, item) => acc + item.count, 0);

  const handleBarClick = (data: any) => {
    setSelectedRange(data.range);
    setSheetOpen(true);
  };

  const filteredItems = selectedRange 
    ? mockMqlsByRevenue.filter(item => item.revenueRange === selectedRange)
    : mockMqlsByRevenue;

  return (
    <>
      <Card 
        className="bg-card border-border h-full cursor-pointer hover:border-primary/50 transition-colors group"
        onClick={() => { setSelectedRange(null); setSheetOpen(true); }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            MQLs por Faixa de Faturamento
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {total} MQLs qualificados • Clique para detalhes
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockData}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                onClick={(e) => e?.activePayload && handleBarClick(e.activePayload[0].payload)}
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
                <Bar dataKey="count" radius={[0, 4, 4, 0]} className="cursor-pointer">
                  {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {mockData.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-70 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleBarClick(item); }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={selectedRange ? `MQLs - ${selectedRange}` : "Todos os MQLs por Faturamento"}
        description={`${filteredItems.length} MQLs ${selectedRange ? `na faixa ${selectedRange}` : 'qualificados'}`}
        items={filteredItems}
        columns={[
          { key: "name", label: "Empresa" },
          { key: "company", label: "Contato" },
          { key: "revenueRange", label: "Faixa Faturamento" },
          { key: "date", label: "Data Qualificação", format: columnFormatters.date },
          { key: "responsible", label: "Origem" },
        ]}
      />
    </>
  );
}
