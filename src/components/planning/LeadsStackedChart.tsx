import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from "recharts";
import { BUType } from "@/hooks/useFunnelRealized";
import { useModeloAtualMetas, ChartGrouping } from "@/hooks/useModeloAtualMetas";
import { useModeloAtualAnalytics } from "@/hooks/useModeloAtualAnalytics";
import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";
import { useO2TaxAnalytics } from "@/hooks/useO2TaxAnalytics";
import { useOxyHackerMetas } from "@/hooks/useOxyHackerMetas";
import { useExpansaoMetas } from "@/hooks/useExpansaoMetas";
import { useExpansaoAnalytics } from "@/hooks/useExpansaoAnalytics";
import { useMediaMetas, FunnelDataItem } from "@/contexts/MediaMetasContext";
import { DetailSheet, DetailItem, columnFormatters } from "./indicators/DetailSheet";
import { ExternalLink } from "lucide-react";
import { format, eachDayOfInterval, differenceInDays, addDays, eachMonthOfInterval, getMonth, startOfMonth, endOfMonth, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadsStackedChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  selectedClosers?: string[];
}

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));

// Month name mapping for funnelData lookup
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function LeadsStackedChart({ startDate, endDate, selectedBU, selectedClosers }: LeadsStackedChartProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetItems, setSheetItems] = useState<DetailItem[]>([]);
  const [sheetDescription, setSheetDescription] = useState("");
  
  // Use database data for Modelo Atual leads
  const { getGroupedData: getModeloAtualGroupedData, getQtyForPeriod: getModeloAtualQty } = useModeloAtualMetas(startDate, endDate);
  
  // O2 TAX leads data
  const { getGroupedData: getO2TaxGroupedData, getQtyForPeriod: getO2TaxQty } = useO2TaxMetas(startDate, endDate);
  
  // Oxy Hacker leads data
  const { getGroupedData: getOxyHackerGroupedData, getQtyForPeriod: getOxyHackerQty } = useOxyHackerMetas(startDate, endDate);
  
  // Franquia leads data
  const { getGroupedData: getFranquiaGroupedData, getQtyForPeriod: getFranquiaQty } = useExpansaoMetas(startDate, endDate);
  
  // Analytics hooks for drill-down details
  const modeloAtualAnalytics = useModeloAtualAnalytics(startDate, endDate);
  const o2TaxAnalytics = useO2TaxAnalytics(startDate, endDate);
  const oxyHackerAnalytics = useExpansaoAnalytics(startDate, endDate, 'Oxy Hacker');
  const franquiaAnalytics = useExpansaoAnalytics(startDate, endDate, 'Franquia');
  
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
  const useO2Tax = selectedBU === 'o2_tax';
  const useOxyHacker = selectedBU === 'oxy_hacker';
  const useFranquia = selectedBU === 'franquia';
  
  // Determine grouping based on period length
  const daysInPeriod = differenceInDays(endDate, startDate) + 1;
  const grouping: ChartGrouping = daysInPeriod <= 31 ? 'daily' : daysInPeriod <= 90 ? 'weekly' : 'monthly';

  // Get grouped data from database for each BU
  const getChartData = () => {
    if (useModeloAtual) {
      return getModeloAtualGroupedData('leads', startDate, endDate, grouping);
    }
    
    if (useO2Tax) {
      return getO2TaxGroupedData('leads', startDate, endDate, grouping);
    }
    
    if (useOxyHacker) {
      return getOxyHackerGroupedData('leads', startDate, endDate, grouping);
    }
    
    if (useFranquia) {
      return getFranquiaGroupedData('leads', startDate, endDate, grouping);
    }
    
    if (useConsolidado) {
      // Sum all BUs: Modelo Atual + O2 TAX + Oxy Hacker + Franquia
      const modeloAtual = getModeloAtualGroupedData('leads', startDate, endDate, grouping);
      const o2Tax = getO2TaxGroupedData('leads', startDate, endDate, grouping);
      const oxyHacker = getOxyHackerGroupedData('leads', startDate, endDate, grouping);
      const franquia = getFranquiaGroupedData('leads', startDate, endDate, grouping);
      return {
        qty: modeloAtual.qty.map((v, i) => v + (o2Tax.qty[i] || 0) + (oxyHacker.qty[i] || 0) + (franquia.qty[i] || 0)),
        meta: modeloAtual.meta.map((v, i) => v + (o2Tax.meta[i] || 0) + (oxyHacker.meta[i] || 0) + (franquia.meta[i] || 0)),
      };
    }
    
    // Fallback - return empty arrays
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
  // Annual metas: O2 TAX 600, Oxy Hacker 360, Franquia 432
  const periodMeta = useConsolidado 
    ? calcularMetaLeads(funnelData?.modeloAtual) + Math.round((600 / 365) * daysInPeriod) + Math.round((360 / 365) * daysInPeriod) + Math.round((432 / 365) * daysInPeriod)
    : useModeloAtual
    ? calcularMetaLeads(funnelData?.modeloAtual)
    : useO2Tax
    ? Math.round((600 / 365) * daysInPeriod) // O2 TAX: 600 leads/year
    : useOxyHacker
    ? Math.round((360 / 365) * daysInPeriod) // Oxy Hacker: 360 leads/year
    : useFranquia
    ? Math.round((432 / 365) * daysInPeriod) // Franquia: 432 leads/year
    : 0;
    
  // Get total realized from database - apply closer filter for Modelo Atual if active
  const getTotalRealized = (): number => {
    if (useO2Tax) return getO2TaxQty('leads', startDate, endDate);
    if (useOxyHacker) return getOxyHackerQty('leads', startDate, endDate);
    if (useFranquia) return getFranquiaQty('leads', startDate, endDate);
    
    // For Modelo Atual or Consolidado, apply closer filter if active
    if (selectedClosers?.length && selectedClosers.length > 0) {
      const cards = modeloAtualAnalytics.getCardsForIndicator('leads');
      const filteredCards = cards.filter(c => {
        const closerValue = (c.closer || '').trim();
        return closerValue && selectedClosers.includes(closerValue);
      });
      const modeloAtualFiltered = filteredCards.length;
      
      if (useConsolidado) {
        // Add other BUs (not filtered by closers)
        return modeloAtualFiltered + getO2TaxQty('leads', startDate, endDate) + getOxyHackerQty('leads', startDate, endDate) + getFranquiaQty('leads', startDate, endDate);
      }
      return modeloAtualFiltered;
    }
    
    // No filter - use regular totals
    if (useConsolidado) {
      return getModeloAtualQty('leads', startDate, endDate) + getO2TaxQty('leads', startDate, endDate) + getOxyHackerQty('leads', startDate, endDate) + getFranquiaQty('leads', startDate, endDate);
    }
    if (useModeloAtual) return getModeloAtualQty('leads', startDate, endDate);
    return 0;
  };
  
  const totalRealized = getTotalRealized();

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

  // Handle click on specific bar - filter by day/week/month
  const handleBarClick = (data: any, index: number) => {
    if (!isClickable) return;
    
    // Calculate the exact date/period based on grouping and index
    let clickedDate: Date;
    let periodLabel: string;
    let periodEnd: Date;
    
    if (grouping === 'daily') {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      clickedDate = days[index];
      periodEnd = clickedDate;
      periodLabel = format(clickedDate, "d 'de' MMMM", { locale: ptBR });
    } else if (grouping === 'weekly') {
      clickedDate = addDays(startDate, index * 7);
      periodEnd = addDays(clickedDate, 6);
      if (periodEnd > endDate) periodEnd = endDate;
      periodLabel = `Semana de ${format(clickedDate, "d 'de' MMM", { locale: ptBR })}`;
    } else {
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      clickedDate = months[index];
      periodEnd = endOfMonth(clickedDate);
      periodLabel = format(clickedDate, "MMMM", { locale: ptBR });
    }
    
    // Get all items based on selected BU
    let allItems: DetailItem[] = [];
    
    if (useModeloAtual) {
      allItems = modeloAtualAnalytics.getDetailItemsForIndicator('leads');
    } else if (useO2Tax) {
      allItems = o2TaxAnalytics.getDetailItemsForIndicator('leads');
    } else if (useOxyHacker) {
      allItems = oxyHackerAnalytics.getDetailItemsForIndicator('leads');
    } else if (useFranquia) {
      allItems = franquiaAnalytics.getDetailItemsForIndicator('leads');
    } else if (useConsolidado) {
      // Aggregate from all sources
      allItems = [
        ...modeloAtualAnalytics.getDetailItemsForIndicator('leads'),
        ...o2TaxAnalytics.getDetailItemsForIndicator('leads'),
        ...oxyHackerAnalytics.getDetailItemsForIndicator('leads'),
        ...franquiaAnalytics.getDetailItemsForIndicator('leads'),
      ];
    }
    
    // Filter by the clicked period
    const filteredItems = allItems.filter(item => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      
      if (grouping === 'daily') {
        return isSameDay(itemDate, clickedDate);
      } else if (grouping === 'weekly') {
        return itemDate >= clickedDate && itemDate <= periodEnd;
      } else {
        return isSameMonth(itemDate, clickedDate);
      }
    });
    
    setSheetItems(filteredItems);
    setSheetDescription(`${filteredItems.length} leads em ${periodLabel}`);
    setSheetOpen(true);
  };

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

  const isClickable = useModeloAtual || useO2Tax || useOxyHacker || useFranquia || useConsolidado;

  return (
    <>
      <Card 
        className="bg-card border-2 border-orange-500 relative group"
      >
        {isClickable && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
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
              <Bar 
                dataKey="leads" 
                fill="#f97316" 
                name="Leads" 
                radius={[4, 4, 0, 0]}
                onClick={handleBarClick}
                cursor={isClickable ? "pointer" : "default"}
              >
                <LabelList dataKey="leads" position="top" fill="hsl(var(--muted-foreground))" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
    
    <DetailSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      title="Leads"
      description={sheetDescription || `${formatNumber(totalRealized)} leads no período selecionado`}
      items={sheetItems}
      columns={[
        { key: 'name', label: 'Título' },
        { key: 'company', label: 'Empresa/Contato' },
        { key: 'phase', label: 'Fase', format: columnFormatters.phase },
        { key: 'date', label: 'Data', format: columnFormatters.date },
        { key: 'revenueRange', label: 'Faixa Faturamento' },
      ]}
    />
    </>
  );
}
