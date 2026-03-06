import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, eachMonthOfInterval, getMonth } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DateRangePickerGA } from "./DateRangePickerGA";
import { useMarketingIndicators } from "@/hooks/useMarketingIndicators";
import { useMetaCampaigns } from "@/hooks/useMetaCampaigns";
import { useGoogleCampaigns } from "@/hooks/useGoogleCampaigns";
import { useModeloAtualMetas } from "@/hooks/useModeloAtualMetas";
import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";
import { useModeloAtualAnalytics } from "@/hooks/useModeloAtualAnalytics";
import { useExpansaoAnalytics } from "@/hooks/useExpansaoAnalytics";
import { useMarketingAttribution } from "@/hooks/useMarketingAttribution";
import { useExpansaoMetas } from "@/hooks/useExpansaoMetas";
import { useOxyHackerMetas } from "@/hooks/useOxyHackerMetas";
import { useMonetaryMetas, MONTHS } from "@/hooks/useMonetaryMetas";
import { useMediaMetas } from "@/contexts/MediaMetasContext";
import { PerformanceGauges } from "./marketing-indicators/PerformanceGauges";
import { InvestmentByChannelChart } from "./marketing-indicators/InvestmentByChannelChart";
import { AcquisitionFunnelChart } from "./marketing-indicators/AcquisitionFunnelChart";
import { ConversionsByChannelChart } from "./marketing-indicators/ConversionsByChannelChart";
import { CampaignsTable } from "./marketing-indicators/CampaignsTable";
import { ChannelMetricsCards } from "./marketing-indicators/ChannelMetricsCards";
import { RevenueMetricsCards } from "./marketing-indicators/RevenueMetricsCards";
import { CostPerStageGauges } from "./marketing-indicators/CostPerStageGauges";
import { ChannelAttributionCards } from "./marketing-indicators/ChannelAttributionCards";
import { DrillDownBarChart } from "./indicators/DrillDownBarChart";
import { CHANNEL_LABELS, ChannelId, CostPerStage, AttributionCard } from "./marketing-indicators/types";


const CHANNEL_OPTIONS = Object.entries(CHANNEL_LABELS)
  .filter(([key]) => ['meta_ads', 'google_ads', 'eventos'].includes(key))
  .map(([value, label]) => ({ value, label }));

export function MarketingIndicatorsTab() {
  // Date state - default to current month
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  // Filter state - always consolidated (all BUs)
  const selectedBUs = ['Modelo Atual', 'O2 TAX', 'Oxy Hacker', 'Franquia'];
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

  // Fetch monetary metas from DB (Admin panel)
  const { metas: monetaryMetas } = useMonetaryMetas(2026);
  const { funnelData } = useMediaMetas();

  // Map date range to month strings and calculate consolidated goals
  const selectedMonthStrings = useMemo(() => {
    const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
    return months.map(d => MONTHS[getMonth(d)]);
  }, [dateRange]);

  const consolidatedRevenueGoals = useMemo(() => {
    let mrr = 0, setup = 0, pontual = 0;
    for (const meta of monetaryMetas) {
      if (selectedMonthStrings.includes(meta.month)) {
        mrr += Number(meta.mrr) || 0;
        setup += Number(meta.setup) || 0;
        pontual += Number(meta.pontual) || 0;
      }
    }
    const gmv = mrr + setup + pontual;
    return { mrr, setup, pontual, educacao: 0, gmv };
  }, [monetaryMetas, selectedMonthStrings]);

  const consolidatedFunnelGoals = useMemo(() => {
    if (!funnelData) return { leads: 0, mqls: 0, rms: 0, rrs: 0, propostas: 0, vendas: 0, investment: 0 };
    const allBUs = [funnelData.modeloAtual, funnelData.o2Tax, funnelData.oxyHacker, funnelData.franquia];
    let leads = 0, mqls = 0, rms = 0, rrs = 0, propostas = 0, vendas = 0, investment = 0;
    for (const buData of allBUs) {
      for (const item of buData) {
        if (selectedMonthStrings.includes(item.month)) {
          leads += item.leads || 0;
          mqls += item.mqls || 0;
          rms += item.rms || 0;
          rrs += item.rrs || 0;
          propostas += item.propostas || 0;
          vendas += item.vendas || 0;
          investment += item.investimento || 0;
        }
      }
    }
    return { leads, mqls, rms, rrs, propostas, vendas, investment };
  }, [funnelData, selectedMonthStrings]);

  // Build final goals merging DB data over hardcoded defaults
  const finalRevenueGoals = useMemo(() => {
    const hasDbData = consolidatedRevenueGoals.gmv > 0;
    return hasDbData ? consolidatedRevenueGoals : goals.revenue;
  }, [consolidatedRevenueGoals, goals.revenue]);

  const finalCostGoals = useMemo(() => {
    const f = consolidatedFunnelGoals;
    const inv = f.investment;
    if (inv <= 0) return costGoals;
    return {
      cpl: f.leads > 0 ? inv / f.leads : costGoals.cpl,
      cpmql: f.mqls > 0 ? inv / f.mqls : costGoals.cpmql,
      cprm: f.rms > 0 ? inv / f.rms : costGoals.cprm,
      cprr: f.rrs > 0 ? inv / f.rrs : costGoals.cprr,
      cpp: f.propostas > 0 ? inv / f.propostas : costGoals.cpp,
      cpv: f.vendas > 0 ? inv / f.vendas : costGoals.cpv,
    };
  }, [consolidatedFunnelGoals, costGoals]);

  const finalInvestmentGoal = useMemo(() => {
    return consolidatedFunnelGoals.investment > 0 ? consolidatedFunnelGoals.investment : goals.investment;
  }, [consolidatedFunnelGoals, goals.investment]);

  // Fetch Meta Ads campaigns data
  const { 
    data: metaCampaigns, 
    isLoading: isLoadingMeta, 
    error: metaError,
    refetch: refetchMeta 
  } = useMetaCampaigns(dateRange.from, dateRange.to);

  // Fetch Google Ads campaigns data
  const {
    data: googleCampaigns,
    isLoading: isLoadingGoogle,
    error: googleError,
    refetch: refetchGoogle
  } = useGoogleCampaigns(dateRange.from, dateRange.to);

  // Combine campaigns from both sources
  const allCampaigns = useMemo(() => {
    const meta = metaCampaigns || [];
    const google = googleCampaigns || [];
    return [...meta, ...google];
  }, [metaCampaigns, googleCampaigns]);

  const isLoadingAds = isLoadingMeta || isLoadingGoogle;
  const adsError = metaError || googleError;

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

  // Fetch Expansão (Franquia) revenue data from Pipefy
  const { getValueForPeriod: getFranquiaValue } = useExpansaoMetas(dateRange.from, dateRange.to);

  // Fetch Oxy Hacker revenue data from Pipefy
  const { getValueForPeriod: getOxyHackerValue } = useOxyHackerMetas(dateRange.from, dateRange.to);

  // Calculate real revenue combining data from selected BUs
  const realRevenue = useMemo(() => {
    const includesModeloAtual = selectedBUs.includes('Modelo Atual');
    const includesO2Tax = selectedBUs.includes('O2 TAX');
    const includesOxyHacker = selectedBUs.includes('Oxy Hacker');
    const includesFranquia = selectedBUs.includes('Franquia');
    
    if (!includesModeloAtual && !includesO2Tax && !includesOxyHacker && !includesFranquia) {
      return data.revenue;
    }
    
    let mrr = 0, setup = 0, pontual = 0, educacao = 0;
    
    if (includesModeloAtual) {
      mrr += getMrrForPeriod(dateRange.from, dateRange.to);
      setup += getSetupForPeriod(dateRange.from, dateRange.to);
      pontual += getPontualForPeriod(dateRange.from, dateRange.to);
      educacao += getEducacaoForPeriod(dateRange.from, dateRange.to);
    }
    
    if (includesO2Tax) {
      mrr += getO2TaxMrr(dateRange.from, dateRange.to);
      setup += getO2TaxSetup(dateRange.from, dateRange.to);
      pontual += getO2TaxPontual(dateRange.from, dateRange.to);
    }
    
    if (includesFranquia) {
      pontual += getFranquiaValue('venda', dateRange.from, dateRange.to);
    }
    
    if (includesOxyHacker) {
      pontual += getOxyHackerValue('venda', dateRange.from, dateRange.to);
    }
    
    return { mrr, setup, pontual, educacao, gmv: mrr + setup + pontual + educacao };
  }, [dateRange, selectedBUs, getMrrForPeriod, getSetupForPeriod, getPontualForPeriod, getEducacaoForPeriod, getO2TaxMrr, getO2TaxSetup, getO2TaxPontual, getFranquiaValue, getOxyHackerValue, data.revenue]);

  // Fetch real card data from Pipefy for attribution
  const { allCards: modeloAtualAllCards, isLoading: isLoadingMACards } = useModeloAtualAnalytics(dateRange.from, dateRange.to);
  const { cards: o2TaxCards } = useExpansaoAnalytics(dateRange.from, dateRange.to, 'Franquia');
  const { cards: oxyHackerCards } = useExpansaoAnalytics(dateRange.from, dateRange.to, 'Oxy Hacker');

  // Build attribution cards from all BUs
  const allAttributionCards = useMemo((): AttributionCard[] => {
    const result: AttributionCard[] = [];
    
    for (const c of modeloAtualAllCards) {
      result.push({
        id: c.id, titulo: c.titulo, campanha: c.campanha, conjuntoGrupo: c.conjuntoGrupo,
        fonte: c.fonte, fbclid: c.fbclid, gclid: c.gclid, tipoOrigem: c.tipoOrigem,
        origemLead: c.origemLead, fase: c.fase, dataEntrada: c.dataEntrada, valor: c.valor,
        valorMRR: c.valorMRR, valorSetup: c.valorSetup, valorPontual: c.valorPontual,
        valorEducacao: c.valorEducacao, bu: 'Modelo Atual',
      });
    }
    
    for (const c of o2TaxCards) {
      result.push({
        id: c.id, titulo: c.titulo, campanha: c.campanha, conjuntoGrupo: c.conjuntoGrupo,
        fonte: c.fonte, fbclid: c.fbclid, gclid: c.gclid, tipoOrigem: c.tipoOrigem,
        origemLead: c.origemLead, fase: c.fase, dataEntrada: c.dataEntrada, valor: c.valor,
        valorMRR: c.valorMRR, valorSetup: c.valorSetup, valorPontual: c.valorPontual,
        bu: 'Franquia',
      });
    }
    
    for (const c of oxyHackerCards) {
      result.push({
        id: c.id, titulo: c.titulo, campanha: c.campanha, conjuntoGrupo: c.conjuntoGrupo,
        fonte: c.fonte, fbclid: c.fbclid, gclid: c.gclid, tipoOrigem: c.tipoOrigem,
        origemLead: c.origemLead, fase: c.fase, dataEntrada: c.dataEntrada, valor: c.valor,
        valorMRR: c.valorMRR, valorSetup: c.valorSetup, valorPontual: c.valorPontual,
        bu: 'Oxy Hacker',
      });
    }
    
    return result;
  }, [modeloAtualAllCards, o2TaxCards, oxyHackerCards]);

  const { campaignFunnels, channelSummaries } = useMarketingAttribution(allAttributionCards, allCampaigns);

  // Aggregate Google Ads API totals for enrichment
  const googleAdsApiTotals = useMemo(() => {
    const campaigns = googleCampaigns || [];
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.investment || 0), 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    return {
      investment: totalSpend,
      leads: totalLeads,
      clicks: totalClicks,
      impressions: totalImpressions,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
    };
  }, [googleCampaigns]);

  // Aggregate Meta Ads API totals for enrichment
  const metaAdsApiTotals = useMemo(() => {
    const campaigns = metaCampaigns || [];
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.investment || 0), 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    return {
      investment: totalSpend,
      leads: totalLeads,
      clicks: totalClicks,
      impressions: totalImpressions,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
    };
  }, [metaCampaigns]);

  // Enrich channels with Google Ads API data (fallback) and Eventos from Pipefy
  const enrichedChannels = useMemo(() => {
    const channels = data.channels.map(ch => {
      // If Google Ads channel from sheet has zero investment, use API data
      if (ch.id === 'google_ads' && googleAdsApiTotals.investment > 0) {
        return {
          ...ch,
          investment: googleAdsApiTotals.investment,
          leads: googleAdsApiTotals.leads || ch.leads,
          clicks: googleAdsApiTotals.clicks,
          impressions: googleAdsApiTotals.impressions,
          cpl: googleAdsApiTotals.cpl,
        };
      }
      // If Meta Ads channel from sheet has lower investment than API, use API data
      if (ch.id === 'meta_ads' && metaAdsApiTotals.investment > 0) {
        return {
          ...ch,
          investment: metaAdsApiTotals.investment,
          leads: metaAdsApiTotals.leads || ch.leads,
          clicks: metaAdsApiTotals.clicks,
          impressions: metaAdsApiTotals.impressions,
          cpl: metaAdsApiTotals.cpl,
        };
      }
      return ch;
    });

    // Add Eventos channel from Pipefy attribution
    const eventosSummary = channelSummaries.find(s => s.channel === 'eventos');
    if (eventosSummary && (eventosSummary.leads > 0 || eventosSummary.mqls > 0 || eventosSummary.vendas > 0 || eventosSummary.receita > 0)) {
      channels.push({
        id: 'eventos',
        name: 'Eventos',
        investment: 0,
        leads: eventosSummary.leads,
        mqls: eventosSummary.mqls,
        rms: 0,
        rrs: 0,
        cpl: 0,
        cpmql: 0,
        conversionRate: eventosSummary.leads > 0
          ? Math.round((eventosSummary.mqls / eventosSummary.leads) * 100)
          : 0,
        propostas: 0,
        vendas: 0,
        cprm: 0,
        cprr: 0,
        cpp: 0,
        cpv: 0,
      });
    }
    return channels;
  }, [data.channels, channelSummaries, googleAdsApiTotals, metaAdsApiTotals]);

  // Recalculate totals including enriched Google Ads data
  const enrichedTotals = useMemo(() => {
    const googleChannel = enrichedChannels.find(c => c.id === 'google_ads');
    const sheetGoogleChannel = data.channels.find(c => c.id === 'google_ads');
    const metaChannel = enrichedChannels.find(c => c.id === 'meta_ads');
    const sheetMetaChannel = data.channels.find(c => c.id === 'meta_ads');
    
    // Calculate deltas for both Google and Meta
    const googleDeltaInvestment = (googleChannel?.investment || 0) - (sheetGoogleChannel?.investment || 0);
    const googleDeltaLeads = (googleChannel?.leads || 0) - (sheetGoogleChannel?.leads || 0);
    const metaDeltaInvestment = (metaChannel?.investment || 0) - (sheetMetaChannel?.investment || 0);
    const metaDeltaLeads = (metaChannel?.leads || 0) - (sheetMetaChannel?.leads || 0);
    
    const totalInvestment = data.totalInvestment + googleDeltaInvestment + metaDeltaInvestment;
    const totalLeads = data.totalLeads + googleDeltaLeads + metaDeltaLeads;
    
    // Recalculate cost per stage with updated investment
    const costPerStage: CostPerStage = {
      cpl: totalLeads > 0 ? totalInvestment / totalLeads : data.costPerStage.cpl,
      cpmql: data.totalMqls > 0 ? totalInvestment / data.totalMqls : data.costPerStage.cpmql,
      cprm: data.totalRms > 0 ? totalInvestment / data.totalRms : data.costPerStage.cprm,
      cprr: data.totalRrs > 0 ? totalInvestment / data.totalRrs : data.costPerStage.cprr,
      cpp: data.totalPropostas > 0 ? totalInvestment / data.totalPropostas : data.costPerStage.cpp,
      cpv: data.totalVendas > 0 ? totalInvestment / data.totalVendas : data.costPerStage.cpv,
    };
    
    return { totalInvestment, totalLeads, costPerStage };
  }, [enrichedChannels, data]);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ from: start, to: end });
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Indicadores de Marketing</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePickerGA
            startDate={dateRange.from}
            endDate={dateRange.to}
            onDateChange={handleDateRangeChange}
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { refetch(); refetchMeta(); refetchGoogle(); }} 
            disabled={isLoading || isLoadingAds}
          >
            <RefreshCw className={cn("h-4 w-4", (isLoading || isLoadingAds) && "animate-spin")} />
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

      {/* Channel Metrics Cards (from spreadsheet) */}
      <ChannelMetricsCards
        channels={enrichedChannels}
        totalInvestment={enrichedTotals.totalInvestment}
        totalLeads={enrichedTotals.totalLeads}
      />

      {/* Attribution Cards (real data from Pipefy) */}
      <ChannelAttributionCards summaries={channelSummaries} />


      {/* Revenue Metrics Cards - Integrated with Modelo Atual data */}
      <RevenueMetricsCards
        revenue={realRevenue}
        goals={goals.revenue}
      />

      {/* Cost Per Stage Gauges */}
      <CostPerStageGauges 
        costPerStage={enrichedTotals.costPerStage} 
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
                    R$ {enrichedTotals.costPerStage[costDrillDown.costKey].toLocaleString('pt-BR')}
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
                    R$ {(enrichedTotals.totalInvestment / 1000).toFixed(0)}k
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
                    {((enrichedTotals.costPerStage[costDrillDown.costKey] / costGoals[costDrillDown.costKey]) * 100).toFixed(0)}%
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
                            {((channel.investment / enrichedTotals.totalInvestment) * 100).toFixed(1)}%
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
        investment={enrichedTotals.totalInvestment}
        investmentGoal={goals.investment}
      />

      {/* Investment & Funnel Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvestmentByChannelChart channels={enrichedChannels} />
        <AcquisitionFunnelChart
          leads={enrichedTotals.totalLeads}
          mqls={data.totalMqls}
          rms={data.totalRms}
          rrs={data.totalRrs}
        />
      </div>

      {/* Conversions by Channel Table */}
      <ConversionsByChannelChart channels={enrichedChannels} />

      {/* Campaigns Table - Meta + Google Ads Integration */}
      <CampaignsTable 
        campaigns={allCampaigns} 
        campaignFunnels={campaignFunnels}
        isLoading={isLoadingAds}
        error={adsError || undefined}
        startDate={dateRange.from}
        endDate={dateRange.to}
      />
    </div>
  );
}
