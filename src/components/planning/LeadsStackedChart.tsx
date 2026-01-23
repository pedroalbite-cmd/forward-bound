import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from "recharts";
import { BUType } from "@/hooks/useFunnelRealized";
import { useModeloAtualMetas, ChartGrouping } from "@/hooks/useModeloAtualMetas";
import { useMediaMetas, FunnelDataItem } from "@/contexts/MediaMetasContext";
import { format, eachDayOfInterval, differenceInDays, addDays, eachMonthOfInterval, getMonth, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadsStackedChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
}

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));

// Month name mapping for funnelData lookup
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function LeadsStackedChart({ startDate, endDate, selectedBU }: LeadsStackedChartProps) {
  // Use database data for Modelo Atual leads
  const { getGroupedData: getModeloAtualGroupedData, getQtyForPeriod: getModeloAtualQty } = useModeloAtualMetas(startDate, endDate);
  
  // Get funnelData from MediaMetasContext for dynamic metas
  const { funnelData } = useMediaMetas();
  
  // Helper function to calculate meta from funnelData for a given period (pro-rated for partial months)
  // Uses 'leads' field from funnelData
  const calcularMetaLeads = (funnelItems: FunnelDataItem[] | undefined): number => {
    if (!funnelItems || funnelItems.length === 0) return 0;
    
    const monthsInPeriod = eachMonthOfInterval({ start: startDate, end: endDate });
    let total = 0;
    
    for (const monthDate of monthsInPeriod) {
      const monthName = monthNames[getMonth(monthDate)];
      const item = funnelItems.find(f => f.month === monthName);
      if (!item) continue;
      
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const overlapStart = startDate > monthStart ? startDate : monthStart;
      const overlapEnd = endDate < monthEnd ? endDate : monthEnd;
      
      if (overlapStart > overlapEnd) continue;
      
      const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
      const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
      const fraction = daysInMonth > 0 ? overlapDays / daysInMonth : 0;
      
      // Use leads field from funnelData
      total += (item.leads || 0) * fraction;
    }
    
    return Math.round(total);
  };
  
  // Check which BU we're showing
  const useConsolidado = selectedBU === 'all';
  const useModeloAtual = selectedBU === 'modelo_atual';
  
  // Determine grouping based on period length
  const daysInPeriod = differenceInDays(endDate, startDate) + 1;
  const grouping: ChartGrouping = daysInPeriod <= 31 ? 'daily' : daysInPeriod <= 90 ? 'weekly' : 'monthly';

  // Get grouped data from database for Modelo Atual
  // External BUs (O2 TAX, Oxy Hacker, Franquia) don't have leads tracking yet
  const getChartData = () => {
    if (useModeloAtual || useConsolidado) {
      // Use database data for Modelo Atual (and Consolidado uses Modelo Atual for now)
      return getModeloAtualGroupedData('leads', startDate, endDate, grouping);
    }
    
    // External BUs don't have leads tracking yet - return empty arrays
    const numPeriods = grouping === 'daily' 
      ? daysInPeriod 
      : grouping === 'weekly' 
      ? Math.ceil(daysInPeriod / 7) 
      : eachMonthOfInterval({ start: startDate, end: endDate }).length;
    
    return {
      qty: Array(numPeriods).fill(0),
      meta: Array(numPeriods).fill(0),
    };
  };
  
  const leadsData = getChartData();
  
  // Get total meta from funnelData (Plan Growth)
  // External BUs don't have separate leads metas, so we only use Modelo Atual for consolidado
  const periodMeta = useConsolidado 
    ? calcularMetaLeads(funnelData?.modeloAtual)
    : useModeloAtual
    ? calcularMetaLeads(funnelData?.modeloAtual)
    : 0; // External BUs don't have leads meta yet
    
  // Get total realized from database
  const totalRealized = (useModeloAtual || useConsolidado)
    ? getModeloAtualQty('leads', startDate, endDate)
    : 0;

  // Build chart data with proper date labels
  const buildChartData = () => {
    if (grouping === 'daily') {
      return eachDayOfInterval({ start: startDate, end: endDate }).map((day, index) => ({
        label: format(day, "d 'de' MMM", { locale: ptBR }),
        leads: leadsData.qty[index] || 0,
        meta: leadsData.meta[index] || 0,
      }));
    } else if (grouping === 'weekly') {
      const totalDays = differenceInDays(endDate, startDate) + 1;
      const numWeeks = Math.ceil(totalDays / 7);
      return Array.from({ length: numWeeks }, (_, i) => {
        const weekStart = addDays(startDate, i * 7);
        return {
          label: format(weekStart, "d 'de' MMM", { locale: ptBR }),
          leads: leadsData.qty[i] || 0,
          meta: leadsData.meta[i] || 0,
        };
      });
    } else {
      // Monthly - use actual months from the interval
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      return months.map((monthDate, index) => ({
        label: format(monthDate, "MMM", { locale: ptBR }),
        leads: leadsData.qty[index] || 0,
        meta: leadsData.meta[index] || 0,
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
    <Card className="bg-card border-2 border-orange-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Qtd Leads</CardTitle>
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
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <span className="text-xs text-muted-foreground">Leads Realizados</span>
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
              <Bar dataKey="leads" fill="#f97316" name="Leads" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="leads" position="top" fill="hsl(var(--muted-foreground))" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
