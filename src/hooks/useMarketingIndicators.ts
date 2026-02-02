import { useMemo } from 'react';
import { 
  MarketingMetrics, 
  MarketingGoals, 
  MarketingChannel, 
  CampaignData,
  InstagramMetrics,
  RevenueMetrics,
  CostPerStage,
  CostPerStageGoals,
  CostPerChannelStage,
  RevenueGoals
} from '@/components/planning/marketing-indicators/types';
import { useMarketingSheetData } from './useMarketingSheetData';

interface UseMarketingIndicatorsParams {
  startDate: Date;
  endDate: Date;
  selectedBUs: string[];
  selectedChannels: string[];
}

interface UseMarketingIndicatorsResult {
  data: MarketingMetrics;
  goals: MarketingGoals;
  costGoals: CostPerStageGoals;
  costByChannel: CostPerChannelStage[];
  isLoading: boolean;
  refetch: () => void;
}

// Mock data fallback when sheet data is unavailable
function getMockData(selectedChannels: string[]): MarketingMetrics {
  const channels: MarketingChannel[] = [
    {
      id: 'meta_ads',
      name: 'Meta Ads',
      investment: 85000,
      leads: 520,
      mqls: 364,
      rms: 218,
      rrs: 175,
      cpl: 163.46,
      cpmql: 233.52,
      conversionRate: 70,
      propostas: 140,
      vendas: 9,
      cprm: 390,
      cprr: 486,
      cpp: 607,
      cpv: 9444,
    },
    {
      id: 'google_ads',
      name: 'Google Ads',
      investment: 62000,
      leads: 380,
      mqls: 266,
      rms: 160,
      rrs: 128,
      cpl: 163.16,
      cpmql: 233.08,
      conversionRate: 70,
      propostas: 102,
      vendas: 7,
      cprm: 388,
      cprr: 484,
      cpp: 608,
      cpv: 8857,
    },
  ];

  const campaigns: CampaignData[] = [
    {
      id: '1',
      name: 'Black Friday 2026',
      channel: 'Meta Ads',
      status: 'active',
      investment: 18500,
      leads: 145,
      mqls: 102,
      roas: 3.2,
      startDate: '2026-11-15',
    },
  ];

  const instagram: InstagramMetrics = {
    instagramO2: 8000,
    instagramPedro: 5000,
    instagramTotal: 13000,
  };

  const revenue: RevenueMetrics = {
    mrr: 125000,
    setup: 45000,
    pontual: 22000,
    educacao: 18000,
    gmv: 210000,
  };

  const totalInvestment = 175000;
  const totalLeads = 995;
  const totalMqls = 711;
  const totalRms = 435;
  const totalRrs = 352;
  const totalPropostas = 280;
  const totalVendas = 19;

  const costPerStage: CostPerStage = {
    cpl: Math.round(totalInvestment / totalLeads),
    cpmql: Math.round(totalInvestment / totalMqls),
    cprm: Math.round(totalInvestment / totalRms),
    cprr: Math.round(totalInvestment / totalRrs),
    cpp: Math.round(totalInvestment / totalPropostas),
    cpv: Math.round(totalInvestment / totalVendas),
  };

  const filteredChannels = selectedChannels.length > 0 
    ? channels.filter(c => selectedChannels.includes(c.id))
    : channels;

  return {
    roas: 2.8,
    roasLtv: 3.6,
    roiLtv: 4.5,
    cac: 9200,
    ltv: 38500,
    totalInvestment,
    totalLeads,
    totalMqls,
    totalRms,
    totalRrs,
    totalPropostas,
    totalVendas,
    channels: filteredChannels,
    campaigns,
    instagram,
    revenue,
    costPerStage,
  };
}

/**
 * Hook for Marketing Indicators data.
 * Fetches real data from Google Sheets via Edge Function.
 * Falls back to mock data if loading or error.
 */
export function useMarketingIndicators({
  startDate,
  endDate,
  selectedBUs,
  selectedChannels,
}: UseMarketingIndicatorsParams): UseMarketingIndicatorsResult {
  
  // Fetch real data from Google Sheets
  const { 
    data: sheetData, 
    isLoading: sheetLoading, 
    error: sheetError,
    refetch: sheetRefetch 
  } = useMarketingSheetData({ startDate, endDate });
  
  // Transform sheet data into MarketingMetrics
  const data = useMemo<MarketingMetrics>(() => {
    // Fallback to mock data if no sheet data available
    if (!sheetData || sheetError) {
      console.log('Using mock data - sheet data unavailable:', { sheetError });
      return getMockData(selectedChannels);
    }
    
    console.log('Using real sheet data:', sheetData);
    
    // Calculate channel-level metrics
    // Note: The sheet provides totals, but we need to calculate per-channel metrics
    // For now, we'll use the individual channel data from the sheet
    const totalInvestment = sheetData.midiaTotal || (sheetData.midiaMeta + sheetData.midiaGoogle);
    const totalLeads = sheetData.leadsTotais || (sheetData.leadsMeta + sheetData.leadsGoogle);
    
    // Calculate channel proportions for metrics not available per-channel
    const metaRatio = totalInvestment > 0 ? sheetData.midiaMeta / totalInvestment : 0.5;
    const googleRatio = 1 - metaRatio;
    
    const channels: MarketingChannel[] = [
      {
        id: 'meta_ads',
        name: 'Meta Ads',
        investment: sheetData.midiaMeta,
        leads: sheetData.leadsMeta,
        mqls: Math.round(sheetData.mqlPorFaturamento * metaRatio),
        rms: Math.round(sheetData.reuniaoMarcada * metaRatio),
        rrs: Math.round(sheetData.reuniaoRealizada * metaRatio),
        cpl: sheetData.cplMeta || (sheetData.leadsMeta > 0 ? sheetData.midiaMeta / sheetData.leadsMeta : 0),
        cpmql: sheetData.cpmqlPorFaturamento || 0,
        conversionRate: sheetData.leadsMeta > 0 
          ? Math.round((sheetData.mqlPorFaturamento * metaRatio / sheetData.leadsMeta) * 100) 
          : 0,
        propostas: Math.round(sheetData.propostaEnviada * metaRatio),
        vendas: Math.round(sheetData.vendas * metaRatio),
        cprm: sheetData.cprm || 0,
        cprr: sheetData.cprr || 0,
        cpp: sheetData.cpp || 0,
        cpv: sheetData.cpv || 0,
      },
      {
        id: 'google_ads',
        name: 'Google Ads',
        investment: sheetData.midiaGoogle,
        leads: sheetData.leadsGoogle,
        mqls: Math.round(sheetData.mqlPorFaturamento * googleRatio),
        rms: Math.round(sheetData.reuniaoMarcada * googleRatio),
        rrs: Math.round(sheetData.reuniaoRealizada * googleRatio),
        cpl: sheetData.cplGoogle || (sheetData.leadsGoogle > 0 ? sheetData.midiaGoogle / sheetData.leadsGoogle : 0),
        cpmql: sheetData.cpmqlPorFaturamento || 0,
        conversionRate: sheetData.leadsGoogle > 0 
          ? Math.round((sheetData.mqlPorFaturamento * googleRatio / sheetData.leadsGoogle) * 100) 
          : 0,
        propostas: Math.round(sheetData.propostaEnviada * googleRatio),
        vendas: Math.round(sheetData.vendas * googleRatio),
        cprm: sheetData.cprm || 0,
        cprr: sheetData.cprr || 0,
        cpp: sheetData.cpp || 0,
        cpv: sheetData.cpv || 0,
      },
    ];

    // Empty campaigns for now (could be extended to read from another tab)
    const campaigns: CampaignData[] = [];

    // Instagram data (not available in this sheet, use placeholder)
    const instagram: InstagramMetrics = {
      instagramO2: 0,
      instagramPedro: 0,
      instagramTotal: 0,
    };

    const revenue: RevenueMetrics = {
      mrr: sheetData.mrr,
      setup: sheetData.setup,
      pontual: sheetData.pontual,
      educacao: sheetData.educacao,
      gmv: sheetData.gmv,
    };

    const costPerStage: CostPerStage = {
      cpl: sheetData.cplTotal || (totalLeads > 0 ? totalInvestment / totalLeads : 0),
      cpmql: sheetData.cpmqlPorFaturamento || (sheetData.mqlPorFaturamento > 0 ? totalInvestment / sheetData.mqlPorFaturamento : 0),
      cprm: sheetData.cprm || (sheetData.reuniaoMarcada > 0 ? totalInvestment / sheetData.reuniaoMarcada : 0),
      cprr: sheetData.cprr || (sheetData.reuniaoRealizada > 0 ? totalInvestment / sheetData.reuniaoRealizada : 0),
      cpp: sheetData.cpp || (sheetData.propostaEnviada > 0 ? totalInvestment / sheetData.propostaEnviada : 0),
      cpv: sheetData.cpv || (sheetData.vendas > 0 ? totalInvestment / sheetData.vendas : 0),
    };

    const filteredChannels = selectedChannels.length > 0 
      ? channels.filter(c => selectedChannels.includes(c.id))
      : channels;

    return {
      roas: sheetData.roas || 0,
      roasLtv: sheetData.roasLtv || 0,
      roiLtv: sheetData.roiLtv || 0,
      cac: sheetData.cac || 0,
      ltv: sheetData.ltv || 0,
      totalInvestment,
      totalLeads,
      totalMqls: sheetData.mqlPorFaturamento || 0,
      totalRms: sheetData.reuniaoMarcada || 0,
      totalRrs: sheetData.reuniaoRealizada || 0,
      totalPropostas: sheetData.propostaEnviada || 0,
      totalVendas: sheetData.vendas || 0,
      channels: filteredChannels,
      campaigns,
      instagram,
      revenue,
      costPerStage,
    };
  }, [sheetData, sheetError, selectedChannels]);

  // Goals for comparison
  const goals = useMemo<MarketingGoals>(() => {
    const revenueGoals: RevenueGoals = {
      mrr: 150000,
      setup: 50000,
      pontual: 30000,
      educacao: 25000,
      gmv: 250000,
    };

    return {
      roas: 3.5,
      roiLtv: 5.0,
      cac: 8000,
      ltv: 40000,
      investment: 200000,
      leads: 1200,
      mqls: 840,
      rms: 500,
      rrs: 400,
      revenue: revenueGoals,
    };
  }, []);

  // Cost per stage goals (benchmarks)
  const costGoals = useMemo<CostPerStageGoals>(() => ({
    cpl: 200,
    cpmql: 280,
    cprm: 450,
    cprr: 550,
    cpp: 650,
    cpv: 9500,
  }), []);

  // Cost breakdown by channel
  const costByChannel = useMemo<CostPerChannelStage[]>(() => {
    return data.channels.map(channel => ({
      channelId: channel.id,
      channelName: channel.name,
      investment: channel.investment,
      leads: channel.leads,
      mqls: channel.mqls,
      rms: channel.rms,
      rrs: channel.rrs,
      propostas: channel.propostas || 0,
      vendas: channel.vendas || 0,
      cpl: channel.cpl,
      cpmql: channel.cpmql,
      cprm: channel.cprm || 0,
      cprr: channel.cprr || 0,
      cpp: channel.cpp || 0,
      cpv: channel.cpv || 0,
    }));
  }, [data.channels]);

  const refetch = () => {
    console.log('Marketing indicators refetch triggered');
    sheetRefetch();
  };

  return {
    data,
    goals,
    costGoals,
    costByChannel,
    isLoading: sheetLoading,
    refetch,
  };
}
