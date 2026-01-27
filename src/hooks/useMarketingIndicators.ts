import { useMemo } from 'react';
import { 
  MarketingMetrics, 
  MarketingGoals, 
  MarketingChannel, 
  CampaignData,
  InstagramMetrics,
  RevenueMetrics,
  CostPerStage,
  RevenueGoals
} from '@/components/planning/marketing-indicators/types';

interface UseMarketingIndicatorsParams {
  startDate: Date;
  endDate: Date;
  selectedBUs: string[];
  selectedChannels: string[];
}

interface UseMarketingIndicatorsResult {
  data: MarketingMetrics;
  goals: MarketingGoals;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook for Marketing Indicators data.
 * Currently returns placeholder/mock data.
 * Will be integrated with real data sources in the future.
 */
export function useMarketingIndicators({
  startDate,
  endDate,
  selectedBUs,
  selectedChannels,
}: UseMarketingIndicatorsParams): UseMarketingIndicatorsResult {
  
  // Mock data with realistic values
  const data = useMemo<MarketingMetrics>(() => {
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
      {
        id: 'eventos',
        name: 'Eventos',
        investment: 28000,
        leads: 95,
        mqls: 81,
        rms: 57,
        rrs: 49,
        cpl: 294.74,
        cpmql: 345.68,
        conversionRate: 85,
        propostas: 38,
        vendas: 3,
        cprm: 491,
        cprr: 571,
        cpp: 737,
        cpv: 9333,
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
      {
        id: '2',
        name: 'Webinar Contábil',
        channel: 'Google Ads',
        status: 'active',
        investment: 12800,
        leads: 92,
        mqls: 74,
        roas: 2.9,
        startDate: '2026-01-10',
      },
      {
        id: '3',
        name: 'Feira Empresarial SP',
        channel: 'Eventos',
        status: 'ended',
        investment: 15000,
        leads: 68,
        mqls: 58,
        roas: 4.1,
        startDate: '2026-03-05',
        endDate: '2026-03-08',
      },
      {
        id: '4',
        name: 'Remarketing Leads',
        channel: 'Meta Ads',
        status: 'active',
        investment: 22000,
        leads: 210,
        mqls: 147,
        roas: 2.5,
        startDate: '2026-01-01',
      },
      {
        id: '5',
        name: 'Brand Awareness',
        channel: 'Google Ads',
        status: 'paused',
        investment: 8500,
        leads: 85,
        mqls: 51,
        roas: 1.8,
        startDate: '2025-12-01',
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
  }, [startDate, endDate, selectedBUs, selectedChannels]);

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

  const refetch = () => {
    // Will trigger data refresh when integrated
    console.log('Marketing indicators refetch triggered', { startDate, endDate, selectedBUs, selectedChannels });
  };

  return {
    data,
    goals,
    isLoading: false,
    refetch,
  };
}
