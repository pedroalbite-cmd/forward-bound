import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from "recharts";
import { BUType } from "@/hooks/useFunnelRealized";
import { useSheetMetas, ChartGrouping } from "@/hooks/useSheetMetas";
import { useExpansaoMetas } from "@/hooks/useExpansaoMetas";
import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";
import { useOxyHackerMetas } from "@/hooks/useOxyHackerMetas";
import { format, eachDayOfInterval, differenceInDays, addDays, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadsMqlsStackedChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  metaMqls?: number;
}

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));

export function LeadsMqlsStackedChart({ startDate, endDate, selectedBU }: LeadsMqlsStackedChartProps) {
  const { getMqlsGroupedData, getMqlsMetaForPeriod, getMqlsQtyForPeriod } = useSheetMetas(startDate, endDate);
  const { getGroupedData: getExpansaoGroupedData, getMetaForPeriod: getExpansaoMeta, getQtyForPeriod: getExpansaoQty } = useExpansaoMetas(startDate, endDate);
  const { getGroupedData: getO2TaxGroupedData, getMetaForPeriod: getO2TaxMeta, getQtyForPeriod: getO2TaxQty } = useO2TaxMetas(startDate, endDate);
  const { getGroupedData: getOxyHackerGroupedData, getMetaForPeriod: getOxyHackerMeta, getQtyForPeriod: getOxyHackerQty } = useOxyHackerMetas(startDate, endDate);
  
  // Check if we should use external database data
  const useExpansaoData = selectedBU === 'franquia';
  const useO2TaxData = selectedBU === 'o2_tax';
  const useOxyHackerData = selectedBU === 'oxy_hacker';
  
  // Determine grouping based on period length
  const daysInPeriod = differenceInDays(endDate, startDate) + 1;
  const grouping: ChartGrouping = daysInPeriod <= 31 ? 'daily' : daysInPeriod <= 90 ? 'weekly' : 'monthly';

  // Get grouped data based on selected BU
  const sheetData = useExpansaoData 
    ? getExpansaoGroupedData('mql', startDate, endDate, grouping)
    : useO2TaxData
    ? getO2TaxGroupedData('mql', startDate, endDate, grouping)
    : useOxyHackerData
    ? getOxyHackerGroupedData('mql', startDate, endDate, grouping)
    : getMqlsGroupedData(startDate, endDate, grouping);
  
  // Get total meta and realized for the period
  const periodMeta = useExpansaoData 
    ? getExpansaoMeta('mql', startDate, endDate)
    : useO2TaxData
    ? getO2TaxMeta('mql', startDate, endDate)
    : useOxyHackerData
    ? getOxyHackerMeta('mql', startDate, endDate)
    : getMqlsMetaForPeriod(startDate, endDate);
  const totalRealized = useExpansaoData 
    ? getExpansaoQty('mql', startDate, endDate)
    : useO2TaxData
    ? getO2TaxQty('mql', startDate, endDate)
    : useOxyHackerData
    ? getOxyHackerQty('mql', startDate, endDate)
    : getMqlsQtyForPeriod(startDate, endDate);

  // Build chart data with proper date labels
  const buildChartData = () => {
    if (grouping === 'daily') {
      return eachDayOfInterval({ start: startDate, end: endDate }).map((day, index) => ({
        label: format(day, "d 'de' MMM", { locale: ptBR }),
        mqls: sheetData.qty[index] || 0,
        meta: sheetData.meta[index] || 0,
      }));
    } else if (grouping === 'weekly') {
      const totalDays = differenceInDays(endDate, startDate) + 1;
      const numWeeks = Math.ceil(totalDays / 7);
      return Array.from({ length: numWeeks }, (_, i) => {
        const weekStart = addDays(startDate, i * 7);
        return {
          label: format(weekStart, "d 'de' MMM", { locale: ptBR }),
          mqls: sheetData.qty[i] || 0,
          meta: sheetData.meta[i] || 0,
        };
      });
    } else {
      // Monthly - use actual months from the interval
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      return months.map((monthDate, index) => ({
        label: format(monthDate, "MMM", { locale: ptBR }),
        mqls: sheetData.qty[index] || 0,
        meta: sheetData.meta[index] || 0,
      }));
    }
  };

  const chartData = buildChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card border-2 border-chart-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Qtd MQLs</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Realizado: <span className="font-medium text-foreground">{formatNumber(totalRealized)}</span>
            </span>
            <span className="text-muted-foreground">
              Meta: <span className="font-medium text-foreground">{formatNumber(periodMeta)}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-chart-2" />
            <span className="text-xs text-muted-foreground">MQLs Realizados</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                interval={grouping === 'daily' && chartData.length > 10 ? Math.floor(chartData.length / 7) : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mqls" fill="hsl(var(--chart-2))" name="MQLs" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="mqls" position="top" fill="hsl(var(--muted-foreground))" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}