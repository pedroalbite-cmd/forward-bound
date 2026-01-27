import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import { useMarketingIndicators } from "@/hooks/useMarketingIndicators";
import { PerformanceGauges } from "./marketing-indicators/PerformanceGauges";
import { InvestmentByChannelChart } from "./marketing-indicators/InvestmentByChannelChart";
import { AcquisitionFunnelChart } from "./marketing-indicators/AcquisitionFunnelChart";
import { ConversionsByChannelChart } from "./marketing-indicators/ConversionsByChannelChart";
import { CampaignsTable } from "./marketing-indicators/CampaignsTable";
import { ChannelMetricsCards } from "./marketing-indicators/ChannelMetricsCards";
import { RevenueMetricsCards } from "./marketing-indicators/RevenueMetricsCards";
import { CostPerStageChart } from "./marketing-indicators/CostPerStageChart";
import { CHANNEL_LABELS, ChannelId } from "./marketing-indicators/types";

const BU_OPTIONS = [
  { value: 'Modelo Atual', label: 'Modelo Atual' },
  { value: 'O2 TAX', label: 'O2 TAX' },
  { value: 'Oxy Hacker', label: 'Oxy Hacker' },
  { value: 'Franquia', label: 'Franquia' },
];

const CHANNEL_OPTIONS = Object.entries(CHANNEL_LABELS)
  .filter(([key]) => ['meta_ads', 'google_ads', 'eventos'].includes(key))
  .map(([value, label]) => ({ value, label }));

export function MarketingIndicatorsTab() {
  // Date state - default to current month
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  // Filter state
  const [selectedBUs, setSelectedBUs] = useState<string[]>(['Modelo Atual']);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  // Fetch data
  const { data, goals, isLoading, refetch } = useMarketingIndicators({
    startDate: dateRange.from,
    endDate: dateRange.to,
    selectedBUs,
    selectedChannels,
  });

  // Format date range for display
  const dateRangeDisplay = useMemo(() => {
    return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
  }, [dateRange]);

  // Quick date presets
  const setQuickDate = (months: number) => {
    const today = new Date();
    if (months === 0) {
      setDateRange({
        from: startOfMonth(today),
        to: endOfMonth(today),
      });
    } else {
      const start = startOfMonth(subMonths(today, months));
      setDateRange({
        from: start,
        to: endOfMonth(today),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Indicadores de Marketing</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick date buttons */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setQuickDate(0)}>
              Mês Atual
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDate(2)}>
              3M
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDate(5)}>
              6M
            </Button>
          </div>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal min-w-[220px]",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRangeDisplay}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {/* BU Filter */}
          <MultiSelect
            options={BU_OPTIONS}
            selected={selectedBUs}
            onSelectionChange={setSelectedBUs}
            placeholder="Selecionar BU"
            className="min-w-[160px]"
          />

          {/* Channel Filter */}
          <MultiSelect
            options={CHANNEL_OPTIONS}
            selected={selectedChannels}
            onSelectionChange={setSelectedChannels}
            placeholder="Todos os Canais"
            className="min-w-[160px]"
          />

          {/* Refresh button */}
          <Button variant="ghost" size="icon" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Channel Metrics Cards - NEW */}
      <ChannelMetricsCards
        channels={data.channels}
        instagram={data.instagram}
        totalInvestment={data.totalInvestment}
        totalLeads={data.totalLeads}
      />

      {/* Revenue Metrics Cards - NEW */}
      <RevenueMetricsCards
        revenue={data.revenue}
        goals={goals.revenue}
      />

      {/* Cost Per Stage Chart - NEW */}
      <CostPerStageChart costPerStage={data.costPerStage} />

      {/* Performance Gauges */}
      <PerformanceGauges
        roas={data.roas}
        roasGoal={goals.roas}
        roiLtv={data.roiLtv}
        roiLtvGoal={goals.roiLtv}
        cac={data.cac}
        cacGoal={goals.cac}
        ltv={data.ltv}
        ltvGoal={goals.ltv}
        investment={data.totalInvestment}
        investmentGoal={goals.investment}
      />

      {/* Investment & Funnel Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvestmentByChannelChart channels={data.channels} />
        <AcquisitionFunnelChart
          leads={data.totalLeads}
          mqls={data.totalMqls}
          rms={data.totalRms}
          rrs={data.totalRrs}
        />
      </div>

      {/* Conversions by Channel Table */}
      <ConversionsByChannelChart channels={data.channels} />

      {/* Campaigns Table (Collapsible) */}
      <CampaignsTable campaigns={data.campaigns} />
    </div>
  );
}
