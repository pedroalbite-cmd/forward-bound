import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { UserX, ExternalLink } from "lucide-react";
import { DetailSheet, DetailItem, columnFormatters } from "./DetailSheet";

interface NoShowWidgetProps {
  buKey: string;
}

// Mock data - will be replaced with real data fetching
const mockTrendData = [
  { day: 1, value: 2 },
  { day: 2, value: 1 },
  { day: 3, value: 3 },
  { day: 4, value: 2 },
  { day: 5, value: 1 },
  { day: 6, value: 2 },
  { day: 7, value: 1 },
];

const mockNoShowDetails: DetailItem[] = [
  { id: "1", name: "João Silva", company: "Tech Solutions Ltda", date: "2026-01-15", responsible: "Carlos Mendes", revenueRange: "R$ 50k - 200k" },
  { id: "2", name: "Maria Santos", company: "Inovação Digital SA", date: "2026-01-14", responsible: "Ana Paula", revenueRange: "R$ 200k - 1M" },
  { id: "3", name: "Pedro Costa", company: "Startup XYZ", date: "2026-01-13", responsible: "Carlos Mendes", revenueRange: "Até R$ 50k" },
  { id: "4", name: "Fernanda Lima", company: "Mega Corp", date: "2026-01-12", responsible: "Roberto Silva", revenueRange: "Acima de 1M" },
  { id: "5", name: "Ricardo Alves", company: "Alpha Services", date: "2026-01-10", responsible: "Ana Paula", revenueRange: "R$ 50k - 200k" },
  { id: "6", name: "Juliana Martins", company: "Beta Tech", date: "2026-01-09", responsible: "Carlos Mendes", revenueRange: "R$ 200k - 1M" },
  { id: "7", name: "André Oliveira", company: "Gamma Solutions", date: "2026-01-08", responsible: "Roberto Silva", revenueRange: "Até R$ 50k" },
  { id: "8", name: "Camila Souza", company: "Delta Inc", date: "2026-01-07", responsible: "Ana Paula", revenueRange: "R$ 50k - 200k" },
];

export function NoShowWidget({ buKey }: NoShowWidgetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const noShows = mockNoShowDetails.length;
  const totalMeetings = 67;
  const noShowRate = Math.round((noShows / totalMeetings) * 100);

  return (
    <>
      <Card 
        className="bg-card border-border h-full cursor-pointer hover:border-primary/50 transition-colors group"
        onClick={() => setSheetOpen(true)}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-destructive" />
              No Shows
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{noShows}</span>
                <span className="text-sm text-muted-foreground">ausências</span>
              </div>
              <div className="mt-1">
                <span className="text-lg font-semibold text-destructive">{noShowRate}%</span>
                <span className="text-sm text-muted-foreground ml-1">das RMs</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Clique para ver detalhes
              </p>
            </div>
            <div className="w-20 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrendData}>
                  <defs>
                    <linearGradient id="noShowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    fill="url(#noShowGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <DetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="No Shows - Reuniões não realizadas"
        description={`${noShows} reuniões agendadas que não aconteceram no período`}
        items={mockNoShowDetails}
        columns={[
          { key: "name", label: "Lead" },
          { key: "company", label: "Empresa" },
          { key: "revenueRange", label: "Faixa Faturamento" },
          { key: "date", label: "Data Agendada", format: columnFormatters.date },
          { key: "responsible", label: "Responsável" },
        ]}
      />
    </>
  );
}
