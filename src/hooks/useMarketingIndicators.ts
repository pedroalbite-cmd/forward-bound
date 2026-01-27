import { useMemo } from 'react';
import { MarketingMetrics, MarketingGoals, MarketingChannel, CampaignData } from '@/components/planning/marketing-indicators/types';

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
  
  // Placeholder data - will be replaced with real data integration
  const data = useMemo<MarketingMetrics>(() => {
    // Empty placeholder structure ready for data integration
    const channels: MarketingChannel[] = [
      {
        id: 'meta_ads',
        name: 'Meta Ads',
        investment: 0,
        leads: 0,
        mqls: 0,
        rms: 0,
        rrs: 0,
        cpl: 0,
        cpmql: 0,
        conversionRate: 0,
      },
      {
        id: 'google_ads',
        name: 'Google Ads',
        investment: 0,
        leads: 0,
        mqls: 0,
        rms: 0,
        rrs: 0,
        cpl: 0,
        cpmql: 0,
        conversionRate: 0,
      },
      {
        id: 'eventos',
        name: 'Eventos',
        investment: 0,
        leads: 0,
        mqls: 0,
        rms: 0,
        rrs: 0,
        cpl: 0,
        cpmql: 0,
        conversionRate: 0,
      },
    ];

    const campaigns: CampaignData[] = [];

    return {
      roas: 0,
      roasLtv: 0,
      roiLtv: 0,
      cac: 0,
      ltv: 0,
      totalInvestment: 0,
      totalLeads: 0,
      totalMqls: 0,
      totalRms: 0,
      totalRrs: 0,
      channels: selectedChannels.length > 0 
        ? channels.filter(c => selectedChannels.includes(c.id))
        : channels,
      campaigns,
    };
  }, [startDate, endDate, selectedBUs, selectedChannels]);

  // Placeholder goals - will be integrated with Plan Growth data
  const goals = useMemo<MarketingGoals>(() => ({
    roas: 0,
    roiLtv: 0,
    cac: 0,
    ltv: 0,
    investment: 0,
    leads: 0,
    mqls: 0,
    rms: 0,
    rrs: 0,
  }), []);

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
