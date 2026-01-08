import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, LabelList } from "recharts";
import { useFunnelRealized, BUType } from "@/hooks/useFunnelRealized";
import { format, eachDayOfInterval, differenceInDays, addDays, parseISO, isWithinInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadsMqlsStackedChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  metaMqls?: number;
}

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));

export function LeadsMqlsStackedChart({ startDate, endDate, selectedBU, metaMqls = 2400 }: LeadsMqlsStackedChartProps) {
  const { getGroupedData, getChartGrouping } = useFunnelRealized(startDate, endDate);
  
  const grouping = getChartGrouping();
  const leadsData = getGroupedData('leads', selectedBU);
  const mqlsData = getGroupedData('mql', selectedBU);

  // Calculate period meta
  const daysInPeriod = differenceInDays(endDate, startDate) + 1;
  const periodMeta = Math.round(metaMqls * (daysInPeriod / 365));

  // Build chart data with proper date labels
  const buildChartData = () => {
    if (grouping === 'daily') {
      return eachDayOfInterval({ start: startDate, end: endDate }).map((day, index) => ({
        label: format(day, "d 'de' MMM", { locale: ptBR }),
        mqls: mqlsData[index] || 0,
        leads: leadsData[index] || 0,
      }));
    } else if (grouping === 'weekly') {
      const totalDays = differenceInDays(endDate, startDate) + 1;
      const numWeeks = Math.ceil(totalDays / 7);
      return Array.from({ length: numWeeks }, (_, i) => {
        const weekStart = addDays(startDate, i * 7);
        return {
          label: format(weekStart, "d 'de' MMM", { locale: ptBR }),
          mqls: mqlsData[i] || 0,
          leads: leadsData[i] || 0,
        };
      });
    } else {
    // Monthly - use actual months from the interval
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    return months.map((monthDate, index) => ({
      label: format(monthDate, "MMM", { locale: ptBR }),
      mqls: mqlsData[index] || 0,
      leads: leadsData[index] || 0,
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
          <CardTitle className="text-base font-semibold text-foreground">Qtd MQLs e Novos Leads</CardTitle>
          <span className="text-sm text-muted-foreground">
            Meta: <span className="font-medium text-foreground">{formatNumber(periodMeta)}</span>
          </span>
        </div>
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-chart-2" />
            <span className="text-xs text-muted-foreground">MQLs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-destructive" />
            <span className="text-xs text-muted-foreground">Novos Leads</span>
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
              <Bar dataKey="mqls" stackId="a" fill="hsl(var(--chart-2))" name="MQLs" radius={[0, 0, 0, 0]}>
                <LabelList dataKey="mqls" position="inside" fill="white" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
              </Bar>
              <Bar dataKey="leads" stackId="a" fill="hsl(var(--destructive))" name="Novos Leads" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="leads" position="inside" fill="white" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
