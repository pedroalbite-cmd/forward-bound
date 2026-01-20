import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, ExternalLink } from "lucide-react";
import { DetailSheet, DetailItem, columnFormatters } from "./DetailSheet";

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

const mockDealsInProgress: DetailItem[] = [
  { id: "1", name: "Tech Solutions Ltda", company: "João Silva", phase: "Proposta", value: 25000, date: "2026-01-15", responsible: "Carlos" },
  { id: "2", name: "Inovação Digital SA", company: "Maria Santos", phase: "RR", value: 18000, date: "2026-01-14", responsible: "Ana Paula" },
  { id: "3", name: "Startup XYZ", company: "Pedro Costa", phase: "RM", value: 12000, date: "2026-01-13", responsible: "Carlos" },
  { id: "4", name: "Mega Corp", company: "Fernanda Lima", phase: "Assinatura", value: 85000, date: "2026-01-12", responsible: "Roberto" },
  { id: "5", name: "Alpha Services", company: "Ricardo Alves", phase: "RM", value: 15000, date: "2026-01-10", responsible: "Ana Paula" },
  { id: "6", name: "Beta Tech", company: "Juliana Martins", phase: "RR", value: 22000, date: "2026-01-09", responsible: "Carlos" },
  { id: "7", name: "Gamma Solutions", company: "André Oliveira", phase: "Proposta", value: 28000, date: "2026-01-08", responsible: "Roberto" },
  { id: "8", name: "Delta Inc", company: "Camila Souza", phase: "RM", value: 14000, date: "2026-01-07", responsible: "Ana Paula" },
  { id: "9", name: "Epsilon SA", company: "Bruno Ferreira", phase: "RR", value: 32000, date: "2026-01-06", responsible: "Carlos" },
  { id: "10", name: "Zeta Corp", company: "Larissa Gomes", phase: "Assinatura", value: 45000, date: "2026-01-05", responsible: "Roberto" },
  { id: "11", name: "Omega Ltd", company: "Rafael Santos", phase: "RM", value: 16000, date: "2026-01-04", responsible: "Ana Paula" },
  { id: "12", name: "Sigma Tech", company: "Patricia Lima", phase: "Proposta", value: 19000, date: "2026-01-03", responsible: "Carlos" },
  { id: "13", name: "Lambda SA", company: "Diego Costa", phase: "RM", value: 11000, date: "2026-01-02", responsible: "Roberto" },
  { id: "14", name: "Kappa Inc", company: "Amanda Silva", phase: "RR", value: 27000, date: "2026-01-01", responsible: "Ana Paula" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export function DealsInProgressWidget({ buKey }: DealsInProgressWidgetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const totalDeals = mockDealsInProgress.length;
  const totalValue = mockDealsInProgress.reduce((acc, deal) => acc + (deal.value || 0), 0);

  return (
    <>
      <Card 
        className="bg-card border-border h-full cursor-pointer hover:border-primary/50 transition-colors group"
        onClick={() => setSheetOpen(true)}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            Negócios em Andamento
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
                Clique para ver detalhes
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

      <DetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Negócios em Andamento"
        description={`${totalDeals} negócios ativos totalizando ${formatCurrency(totalValue)} em potencial`}
        items={mockDealsInProgress}
        columns={[
          { key: "name", label: "Empresa" },
          { key: "company", label: "Contato" },
          { key: "phase", label: "Fase", format: columnFormatters.phase },
          { key: "value", label: "Valor", format: columnFormatters.currency },
          { key: "date", label: "Última Atualização", format: columnFormatters.date },
          { key: "responsible", label: "Responsável" },
        ]}
      />
    </>
  );
}
