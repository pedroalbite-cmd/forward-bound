import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/multi-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useMarketingIndicators } from "@/hooks/useMarketingIndicators";
import { useModeloAtualMetas } from "@/hooks/useModeloAtualMetas";
import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";
import { PerformanceGauges } from "./marketing-indicators/PerformanceGauges";
import { InvestmentByChannelChart } from "./marketing-indicators/InvestmentByChannelChart";
import { AcquisitionFunnelChart } from "./marketing-indicators/AcquisitionFunnelChart";
import { ConversionsByChannelChart } from "./marketing-indicators/ConversionsByChannelChart";
import { CampaignsTable } from "./marketing-indicators/CampaignsTable";
import { ChannelMetricsCards } from "./marketing-indicators/ChannelMetricsCards";
import { RevenueMetricsCards } from "./marketing-indicators/RevenueMetricsCards";
import { CostPerStageGauges } from "./marketing-indicators/CostPerStageGauges";
import { DrillDownBarChart } from "./indicators/DrillDownBarChart";
import { CHANNEL_LABELS, ChannelId, CostPerStage } from "./marketing-indicators/types";

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

  // Drill-down state for cost gauges
  const [costDrillDown, setCostDrillDown] = useState<{
    isOpen: boolean;
    costKey: keyof CostPerStage | null;
  }>({ isOpen: false, costKey: null });

  // Fetch marketing data from Google Sheets
  const { data, goals, costGoals, costByChannel, isLoading, error, refetch } = useMarketingIndicators({
    startDate: dateRange.from,
    endDate: dateRange.to,
    selectedBUs,
    selectedChannels,
  });

  // Fetch Modelo Atual revenue data from Pipefy
  const { 
    getMrrForPeriod, 
    getSetupForPeriod, 
    getPontualForPeriod,
    getEducacaoForPeriod,
    isLoading: isLoadingModeloAtual 
  } = useModeloAtualMetas(dateRange.from, dateRange.to);

  // Fetch O2 TAX revenue data from Pipefy
  const { 
    getMrrForPeriod: getO2TaxMrr, 
    getSetupForPeriod: getO2TaxSetup, 
    getPontualForPeriod: getO2TaxPontual,
    isLoading: isLoadingO2Tax 
  } = useO2TaxMetas(dateRange.from, dateRange.to);

  // Calculate real revenue combining data from selected BUs
  const realRevenue = useMemo(() => {
    const includesModeloAtual = selectedBUs.includes('Modelo Atual');
    const includesO2Tax = selectedBUs.includes('O2 TAX');
    
    // If no BU with real data is selected, fallback to sheet data
    if (!includesModeloAtual && !includesO2Tax) {
      return data.revenue;
    }
    
    let mrr = 0, setup = 0, pontual = 0, educacao = 0;
    
    // Add Modelo Atual values
    if (includesModeloAtual) {
      mrr += getMrrForPeriod(dateRange.from, dateRange.to);
      setup += getSetupForPeriod(dateRange.from, dateRange.to);
      pontual += getPontualForPeriod(dateRange.from, dateRange.to);
      educacao += getEducacaoForPeriod(dateRange.from, dateRange.to);
    }
    
    // Add O2 TAX values
    if (includesO2Tax) {
      mrr += getO2TaxMrr(dateRange.from, dateRange.to);
      setup += getO2TaxSetup(dateRange.from, dateRange.to);
      pontual += getO2TaxPontual(dateRange.from, dateRange.to);
      // O2 TAX doesn't have Educação
    }
    
    return {
      mrr,
      setup,
      pontual,
      educacao,
      gmv: data.revenue.gmv, // GMV still comes from the sheet (not available in Pipefy)
    };
  }, [dateRange, selectedBUs, getMrrForPeriod, getSetupForPeriod, getPontualForPeriod, getEducacaoForPeriod, getO2TaxMrr, getO2TaxSetup, getO2TaxPontual, data.revenue]);

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

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
          <p className="text-destructive font-medium">Erro ao carregar dados de marketing</p>
          <p className="text-sm text-muted-foreground mt-1">
            Não foi possível conectar à planilha. Verifique a conexão e tente novamente.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Channel Metrics Cards */}
      <ChannelMetricsCards
        channels={data.channels}
        totalInvestment={data.totalInvestment}
        totalLeads={data.totalLeads}
      />

      {/* Revenue Metrics Cards - Integrated with Modelo Atual data */}
      <RevenueMetricsCards
        revenue={realRevenue}
        goals={goals.revenue}
      />

      {/* Cost Per Stage Gauges */}
      <CostPerStageGauges 
        costPerStage={data.costPerStage} 
        goals={costGoals}
        onCostClick={(costKey) => setCostDrillDown({ isOpen: true, costKey })}
      />

      {/* Cost Drill-Down Modal */}
      <Dialog 
        open={costDrillDown.isOpen} 
        onOpenChange={(open) => setCostDrillDown({ isOpen: open, costKey: open ? costDrillDown.costKey : null })}
      >
        <DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {costDrillDown.costKey?.toUpperCase()} - Custo por {
                costDrillDown.costKey === 'cpl' ? 'Lead' :
                costDrillDown.costKey === 'cpmql' ? 'MQL' :
                costDrillDown.costKey === 'cprm' ? 'Reunião Marcada' :
                costDrillDown.costKey === 'cprr' ? 'Reunião Realizada' :
                costDrillDown.costKey === 'cpp' ? 'Proposta' :
                costDrillDown.costKey === 'cpv' ? 'Venda' : ''
              }
            </DialogTitle>
          </DialogHeader>
          
          {costDrillDown.costKey && (
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* KPI Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Custo Geral</p>
                  <p className="text-xl font-bold">
                    R$ {data.costPerStage[costDrillDown.costKey].toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Meta</p>
                  <p className="text-xl font-bold">
                    R$ {costGoals[costDrillDown.costKey].toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Investimento Total</p>
                  <p className="text-xl font-bold">
                    R$ {(data.totalInvestment / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">vs Meta</p>
                  <p className={cn(
                    "text-xl font-bold",
                    data.costPerStage[costDrillDown.costKey] <= costGoals[costDrillDown.costKey] 
                      ? "text-chart-2" 
                      : "text-destructive"
                  )}>
                    {((data.costPerStage[costDrillDown.costKey] / costGoals[costDrillDown.costKey]) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Chart: Cost by Channel */}
              <DrillDownBarChart
                title={`${costDrillDown.costKey.toUpperCase()} por Canal`}
                data={costByChannel.map(c => ({
                  label: c.channelName,
                  value: c[costDrillDown.costKey as keyof typeof c] as number,
                  highlight: (c[costDrillDown.costKey as keyof typeof c] as number) <= costGoals[costDrillDown.costKey] 
                    ? 'success' as const 
                    : 'danger' as const,
                }))}
                formatValue={(v) => `R$ ${v.toLocaleString('pt-BR')}`}
              />

              {/* Table: Channel Details */}
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Canal</th>
                      <th className="text-right p-3 font-medium">Investimento</th>
                      <th className="text-right p-3 font-medium">Volume</th>
                      <th className="text-right p-3 font-medium">{costDrillDown.costKey.toUpperCase()}</th>
                      <th className="text-right p-3 font-medium">% Invest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costByChannel.map((channel) => {
                      const volumeKey = 
                        costDrillDown.costKey === 'cpl' ? 'leads' :
                        costDrillDown.costKey === 'cpmql' ? 'mqls' :
                        costDrillDown.costKey === 'cprm' ? 'rms' :
                        costDrillDown.costKey === 'cprr' ? 'rrs' :
                        costDrillDown.costKey === 'cpp' ? 'propostas' : 'vendas';
                      const costValue = channel[costDrillDown.costKey as keyof typeof channel] as number;
                      const isGood = costValue <= costGoals[costDrillDown.costKey];
                      
                      return (
                        <tr key={channel.channelId} className="border-t">
                          <td className="p-3">{channel.channelName}</td>
                          <td className="text-right p-3">R$ {(channel.investment / 1000).toFixed(0)}k</td>
                          <td className="text-right p-3">{channel[volumeKey as keyof typeof channel]}</td>
                          <td className={cn(
                            "text-right p-3 font-medium",
                            isGood ? "text-chart-2" : "text-destructive"
                          )}>
                            R$ {costValue.toLocaleString('pt-BR')}
                          </td>
                          <td className="text-right p-3">
                            {((channel.investment / data.totalInvestment) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
