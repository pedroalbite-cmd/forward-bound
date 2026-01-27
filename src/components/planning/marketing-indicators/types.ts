export interface MarketingChannel {
  id: string;
  name: string;
  investment: number;
  leads: number;
  mqls: number;
  rms: number;      // Reuniões Marcadas
  rrs: number;      // Reuniões Realizadas
  cpl: number;      // Cost per Lead
  cpmql: number;    // Cost per MQL
  conversionRate: number; // MQL/Leads
}

export interface CampaignData {
  id: string;
  name: string;
  channel: string;
  status: 'active' | 'paused' | 'ended';
  investment: number;
  leads: number;
  mqls: number;
  roas: number;
  startDate: string;
  endDate?: string;
}

export interface MarketingMetrics {
  // Performance metrics
  roas: number;
  roasLtv: number;
  roiLtv: number;
  cac: number;
  ltv: number;
  
  // Investment
  totalInvestment: number;
  
  // Acquisition funnel
  totalLeads: number;
  totalMqls: number;
  totalRms: number;
  totalRrs: number;
  
  // By channel
  channels: MarketingChannel[];
  
  // Campaigns
  campaigns: CampaignData[];
}

export interface MarketingGoals {
  roas: number;
  roiLtv: number;
  cac: number;
  ltv: number;
  investment: number;
  leads: number;
  mqls: number;
  rms: number;
  rrs: number;
}

export type ChannelId = 'meta_ads' | 'google_ads' | 'eventos' | 'organico' | 'outros';

export const CHANNEL_LABELS: Record<ChannelId, string> = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  eventos: 'Eventos',
  organico: 'Orgânico',
  outros: 'Outros',
};

export const CHANNEL_COLORS: Record<ChannelId, string> = {
  meta_ads: 'hsl(var(--chart-1))',
  google_ads: 'hsl(var(--chart-2))',
  eventos: 'hsl(var(--chart-3))',
  organico: 'hsl(var(--chart-4))',
  outros: 'hsl(var(--chart-5))',
};
