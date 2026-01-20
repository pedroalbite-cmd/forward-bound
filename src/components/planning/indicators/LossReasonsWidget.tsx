import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ExternalLink } from "lucide-react";
import { DetailSheet, DetailItem, columnFormatters } from "./DetailSheet";

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

const mockLostByReason: DetailItem[] = [
  { id: "1", name: "Tech Solutions", company: "João Silva", reason: "Preço", value: 25000, date: "2026-01-15" },
  { id: "2", name: "Inovação Digital", company: "Maria Santos", reason: "Preço", value: 45000, date: "2026-01-14" },
  { id: "3", name: "Startup XYZ", company: "Pedro Costa", reason: "Timing", value: 12000, date: "2026-01-13" },
  { id: "4", name: "Mega Corp", company: "Fernanda Lima", reason: "Concorrência", value: 85000, date: "2026-01-12" },
  { id: "5", name: "Alpha Services", company: "Ricardo Alves", reason: "Preço", value: 18000, date: "2026-01-10" },
  { id: "6", name: "Beta Tech", company: "Juliana Martins", reason: "Timing", value: 32000, date: "2026-01-09" },
  { id: "7", name: "Gamma Solutions", company: "André Oliveira", reason: "Sem resposta", value: 28000, date: "2026-01-08" },
  { id: "8", name: "Delta Inc", company: "Camila Souza", reason: "Concorrência", value: 15000, date: "2026-01-07" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export function LossReasonsWidget({ buKey }: LossReasonsWidgetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  
  const total = mockData.reduce((acc, item) => acc + item.count, 0);

  const handleReasonClick = (reason: string) => {
    setSelectedReason(reason);
    setSheetOpen(true);
  };

  const filteredItems = selectedReason 
    ? mockLostByReason.filter(item => item.reason === selectedReason)
    : mockLostByReason;

  return (
    <>
      <Card 
        className="bg-card border-border h-full cursor-pointer hover:border-primary/50 transition-colors group"
        onClick={() => { setSelectedReason(null); setSheetOpen(true); }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            Motivos de Perda
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {total} negócios analisados • Clique para detalhes
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
                <div 
                  key={index} 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleReasonClick(item.reason); }}
                >
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

      <DetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={selectedReason ? `Perdidos por: ${selectedReason}` : "Todos os Motivos de Perda"}
        description={`${filteredItems.length} negócios ${selectedReason ? `perdidos por ${selectedReason}` : 'perdidos'}`}
        items={filteredItems}
        columns={[
          { key: "name", label: "Empresa" },
          { key: "company", label: "Contato" },
          { key: "reason", label: "Motivo", format: columnFormatters.reason },
          { key: "value", label: "Valor Perdido", format: columnFormatters.currency },
          { key: "date", label: "Data Perda", format: columnFormatters.date },
        ]}
      />
    </>
  );
}
