import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ExternalLink, Loader2 } from "lucide-react";
import { DetailSheet, DetailItem, columnFormatters } from "./DetailSheet";
import { useO2TaxAnalytics } from "@/hooks/useO2TaxAnalytics";

interface LossReasonsWidgetProps {
  buKey: string;
  startDate: Date;
  endDate: Date;
}

// Mock data for non-O2 TAX BUs
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
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export function LossReasonsWidget({ buKey, startDate, endDate }: LossReasonsWidgetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  
  const isO2Tax = buKey === 'o2_tax';
  const { getLossReasons, toDetailItem, isLoading } = useO2TaxAnalytics(startDate, endDate);
  
  const chartData = isO2Tax ? getLossReasons : mockData;
  const total = chartData.reduce((acc, item) => acc + item.count, 0);

  const handleReasonClick = (reason: string) => {
    setSelectedReason(reason);
    setSheetOpen(true);
  };

  const getFilteredItems = (): DetailItem[] => {
    if (isO2Tax) {
      const filtered = selectedReason 
        ? getLossReasons.find(r => r.reason === selectedReason)?.cards || []
        : getLossReasons.flatMap(r => r.cards);
      return filtered.map(toDetailItem);
    }
    return selectedReason 
      ? mockLostByReason.filter(item => item.reason === selectedReason)
      : mockLostByReason;
  };

  const filteredItems = getFilteredItems();

  if (isO2Tax && isLoading) {
    return (
      <Card className="bg-card border-border h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

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
                    data={chartData}
                    dataKey="count"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {chartData.map((entry, index) => (
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
              {chartData.map((item, index) => (
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
