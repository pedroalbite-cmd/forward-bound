// Option 3: Stacked Area Chart - Shows cumulative contribution
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Line, ComposedChart } from "recharts";
import { Layers } from "lucide-react";
import { BUType } from "@/hooks/useFunnelRealized";

interface RevenueChartStackedAreaProps {
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

export function RevenueChartStackedArea({ 
  startDate, 
  endDate, 
  selectedBUs,
  chartData,
  totals
}: RevenueChartStackedAreaProps) {
  const useModeloAtual = selectedBUs.includes('modelo_atual');
  const useO2Tax = selectedBUs.includes('o2_tax');
  const useOxyHacker = selectedBUs.includes('oxy_hacker');
  const useFranquia = selectedBUs.includes('franquia');

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Opção 3: Área Empilhada
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Contribuição acumulada
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-green-500">{formatCompactCurrency(totals.total)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0 border-t-2 border-dashed border-green-500" />
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
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradModeloAtual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="gradO2Tax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="gradOxyHacker" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="gradFranquia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
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
                formatter={(value) => value === 'meta' ? 'Meta' : (BU_LABELS[value] || value)}
                wrapperStyle={{ paddingTop: '10px' }}
              />
              
              {/* Stacked areas - order matters for visual stacking */}
              {useFranquia && (
                <Area 
                  type="monotone" 
                  dataKey="franquia" 
                  stackId="1"
                  stroke={BU_COLORS.franquia} 
                  fill="url(#gradFranquia)"
                  name="franquia"
                />
              )}
              {useOxyHacker && (
                <Area 
                  type="monotone" 
                  dataKey="oxy_hacker" 
                  stackId="1"
                  stroke={BU_COLORS.oxy_hacker} 
                  fill="url(#gradOxyHacker)"
                  name="oxy_hacker"
                />
              )}
              {useO2Tax && (
                <Area 
                  type="monotone" 
                  dataKey="o2_tax" 
                  stackId="1"
                  stroke={BU_COLORS.o2_tax} 
                  fill="url(#gradO2Tax)"
                  name="o2_tax"
                />
              )}
              {useModeloAtual && (
                <Area 
                  type="monotone" 
                  dataKey="modelo_atual" 
                  stackId="1"
                  stroke={BU_COLORS.modelo_atual} 
                  fill="url(#gradModeloAtual)"
                  name="modelo_atual"
                />
              )}
              
              {/* Meta line (dashed) */}
              <Line 
                type="monotone" 
                dataKey="meta" 
                stroke="#22c55e" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="meta"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
