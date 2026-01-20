import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { DetailSheet, DetailItem, columnFormatters } from "./DetailSheet";
import { useO2TaxAnalytics } from "@/hooks/useO2TaxAnalytics";

interface LostDealsWidgetProps {
  buKey: string;
  startDate: Date;
  endDate: Date;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

// Mock data for non-O2 TAX BUs
const mockLostDeals: DetailItem[] = [
  { id: "1", name: "João Silva", company: "Tech Solutions Ltda", value: 25000, reason: "Preço", date: "2026-01-15", phase: "Proposta" },
  { id: "2", name: "Maria Santos", company: "Inovação Digital SA", value: 45000, reason: "Timing", date: "2026-01-14", phase: "Proposta" },
  { id: "3", name: "Pedro Costa", company: "Startup XYZ", value: 12000, reason: "Concorrência", date: "2026-01-13", phase: "RR" },
];

export function LostDealsWidget({ buKey, startDate, endDate }: LostDealsWidgetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const isO2Tax = buKey === 'o2_tax';
  const { getLostDeals, toDetailItem, isLoading } = useO2TaxAnalytics(startDate, endDate);
  
  const lostDeals = isO2Tax ? getLostDeals.count : mockLostDeals.length;
  const lostValue = isO2Tax 
    ? getLostDeals.totalValue 
    : mockLostDeals.reduce((acc, deal) => acc + (deal.value || 0), 0);
  const trend = isO2Tax ? getLostDeals.trend : -8;

  const getDetailItems = (): DetailItem[] => {
    if (isO2Tax) {
      return getLostDeals.cards.map(toDetailItem);
    }
    return mockLostDeals;
  };

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
        onClick={() => setSheetOpen(true)}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Negócios Perdidos
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{lostDeals}</span>
            <span className="text-sm text-muted-foreground">perdidos</span>
          </div>
          <div className="mt-1">
            <span className="text-lg font-semibold text-destructive">{formatCurrency(lostValue)}</span>
          </div>
          {trend !== 0 && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="h-4 w-4 text-chart-2" />
              <span className="text-sm font-medium text-chart-2">{trend}%</span>
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Clique para ver detalhes
          </p>
        </CardContent>
      </Card>

      <DetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Negócios Perdidos"
        description={`${lostDeals} negócios perdidos totalizando ${formatCurrency(lostValue)}`}
        items={getDetailItems()}
        columns={[
          { key: "name", label: "Lead" },
          { key: "company", label: "Empresa" },
          { key: "phase", label: "Fase", format: columnFormatters.phase },
          { key: "reason", label: "Motivo", format: columnFormatters.reason },
          { key: "value", label: "Valor", format: columnFormatters.currency },
          { key: "date", label: "Data", format: columnFormatters.date },
        ]}
      />
    </>
  );
}
