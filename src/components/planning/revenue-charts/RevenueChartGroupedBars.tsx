// Option 1: Grouped Bars - Side by Side BU comparison
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from "recharts";
import { DollarSign } from "lucide-react";
import { differenceInDays, eachDayOfInterval, eachMonthOfInterval, addDays, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BUType } from "@/hooks/useFunnelRealized";

interface RevenueChartGroupedBarsProps {
  startDate: Date;
  endDate: Date;
  selectedBUs: BUType[];
  chartData: {
    label: string;
    modelo_atual: number;
    o2_tax: number;
    oxy_hacker: number;
    franquia: number;
    meta: number;
  }[];
  totals: {
    modelo_atual: number;
    o2_tax: number;
    oxy_hacker: number;
    franquia: number;
    total: number;
    meta: number;
  };
}

const BU_COLORS: Record<string, string> = {
  modelo_atual: '#3b82f6',
  o2_tax: '#f59e0b',
  oxy_hacker: '#8b5cf6',
  franquia: '#22c55e',
};

const BU_LABELS: Record<string, string> = {
  modelo_atual: 'Modelo Atual',
  o2_tax: 'O2 TAX',
  oxy_hacker: 'Oxy Hacker',
  franquia: 'Franquia',
};

const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${Math.round(value)}`;
};

export function RevenueChartGroupedBars({ 
  startDate, 
  endDate, 
  selectedBUs,
  chartData,
  totals
}: RevenueChartGroupedBarsProps) {
  const useModeloAtual = selectedBUs.includes('modelo_atual');
  const useO2Tax = selectedBUs.includes('o2_tax');
  const useOxyHacker = selectedBUs.includes('oxy_hacker');
  const useFranquia = selectedBUs.includes('franquia');

  // Calculate average meta for reference line
  const avgMeta = chartData.length > 0 
    ? chartData.reduce((sum, d) => sum + d.meta, 0) / chartData.length 
    : 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Faturamento por Período (Detalhado)
            </CardTitle>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-green-500">{formatCompactCurrency(totals.total)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm border-2 border-green-500 border-dashed" />
            <span className="text-muted-foreground">Meta:</span>
            <span className="font-medium text-green-500">{formatCompactCurrency(totals.meta)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
          {selectedBUs.map(bu => (
            <div key={bu} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: BU_COLORS[bu] }} />
              <span className="text-muted-foreground">{BU_LABELS[bu]}:</span>
              <span className="font-medium">{formatCompactCurrency(totals[bu as keyof typeof totals] as number)}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(value) => formatCompactCurrency(value)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--popover))", 
                  border: "1px solid hsl(var(--border))", 
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))"
                }}
                formatter={(value: number, name: string) => [formatCompactCurrency(value), BU_LABELS[name] || name]}
              />
              <Legend 
                formatter={(value) => BU_LABELS[value] || value}
                wrapperStyle={{ paddingTop: '10px' }}
              />
              
              {/* Bars side by side (not stacked) */}
              {useModeloAtual && (
                <Bar dataKey="modelo_atual" fill={BU_COLORS.modelo_atual} name="modelo_atual" radius={[4, 4, 0, 0]} />
              )}
              {useO2Tax && (
                <Bar dataKey="o2_tax" fill={BU_COLORS.o2_tax} name="o2_tax" radius={[4, 4, 0, 0]} />
              )}
              {useOxyHacker && (
                <Bar dataKey="oxy_hacker" fill={BU_COLORS.oxy_hacker} name="oxy_hacker" radius={[4, 4, 0, 0]} />
              )}
              {useFranquia && (
                <Bar dataKey="franquia" fill={BU_COLORS.franquia} name="franquia" radius={[4, 4, 0, 0]} />
              )}
              
              {/* Reference line for average meta */}
              <ReferenceLine 
                y={avgMeta} 
                stroke="#22c55e" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: 'Meta média', fill: '#22c55e', fontSize: 10, position: 'right' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
