import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, XCircle } from "lucide-react";

interface LostDealsWidgetProps {
  buKey: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export function LostDealsWidget({ buKey }: LostDealsWidgetProps) {
  // Mock data - will be replaced with real data fetching
  const lostDeals = 23;
  const lostValue = 345000;
  const trend = -8; // percentage vs previous period

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive" />
          Negócios Perdidos
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
        <div className="flex items-center gap-1 mt-2">
          <TrendingDown className="h-4 w-4 text-chart-2" />
          <span className="text-sm font-medium text-chart-2">{trend}%</span>
          <span className="text-xs text-muted-foreground">vs período anterior</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Valor potencial perdido no período
        </p>
      </CardContent>
    </Card>
  );
}
