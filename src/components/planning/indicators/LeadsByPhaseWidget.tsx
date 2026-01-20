import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { ExternalLink } from "lucide-react";
import { DetailSheet, DetailItem, columnFormatters } from "./DetailSheet";

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

const mockLeadsByPhase: DetailItem[] = [
  { id: "1", name: "Tech Solutions", company: "João Silva", phase: "MQL", date: "2026-01-15", revenueRange: "R$ 50k - 200k" },
  { id: "2", name: "Inovação Digital", company: "Maria Santos", phase: "MQL", date: "2026-01-14", revenueRange: "R$ 200k - 1M" },
  { id: "3", name: "Startup XYZ", company: "Pedro Costa", phase: "RM", date: "2026-01-13", revenueRange: "Até R$ 50k" },
  { id: "4", name: "Mega Corp", company: "Fernanda Lima", phase: "RR", date: "2026-01-12", revenueRange: "Acima de 1M" },
  { id: "5", name: "Alpha Services", company: "Ricardo Alves", phase: "Proposta", date: "2026-01-10", revenueRange: "R$ 50k - 200k" },
  { id: "6", name: "Beta Tech", company: "Juliana Martins", phase: "MQL", date: "2026-01-09", revenueRange: "R$ 200k - 1M" },
  { id: "7", name: "Gamma Solutions", company: "André Oliveira", phase: "RM", date: "2026-01-08", revenueRange: "Até R$ 50k" },
  { id: "8", name: "Delta Inc", company: "Camila Souza", phase: "Assinatura", date: "2026-01-07", revenueRange: "R$ 50k - 200k" },
];

export function LeadsByPhaseWidget({ buKey }: LeadsByPhaseWidgetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  
  const total = mockData.reduce((acc, item) => acc + item.count, 0);

  const handleBarClick = (data: any) => {
    setSelectedPhase(data.phase);
    setSheetOpen(true);
  };

  const filteredItems = selectedPhase 
    ? mockLeadsByPhase.filter(item => item.phase === selectedPhase)
    : mockLeadsByPhase;

  return (
    <>
      <Card 
        className="bg-card border-border h-full cursor-pointer hover:border-primary/50 transition-colors group"
        onClick={() => { setSelectedPhase(null); setSheetOpen(true); }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            Leads por Fase Atual
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {total} leads no pipeline • Clique para detalhes
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                onClick={(e) => e?.activePayload && handleBarClick(e.activePayload[0].payload)}
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
                <Bar dataKey="count" radius={[0, 4, 4, 0]} className="cursor-pointer">
                  {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <DetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={selectedPhase ? `Leads em ${selectedPhase}` : "Todos os Leads por Fase"}
        description={`${filteredItems.length} leads ${selectedPhase ? `na fase ${selectedPhase}` : 'no pipeline'}`}
        items={filteredItems}
        columns={[
          { key: "name", label: "Empresa" },
          { key: "company", label: "Contato" },
          { key: "phase", label: "Fase", format: columnFormatters.phase },
          { key: "revenueRange", label: "Faixa Faturamento" },
          { key: "date", label: "Data Entrada", format: columnFormatters.date },
        ]}
      />
    </>
  );
}
