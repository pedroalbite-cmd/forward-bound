import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingChannel, InstagramMetrics } from "./types";
import { Instagram, DollarSign, Users, Target } from "lucide-react";

interface ChannelMetricsCardsProps {
  channels: MarketingChannel[];
  instagram: InstagramMetrics;
  totalInvestment: number;
  totalLeads: number;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function ChannelMetricsCards({ channels, instagram, totalInvestment, totalLeads }: ChannelMetricsCardsProps) {
  const metaAds = channels.find(c => c.id === 'meta_ads');
  const googleAds = channels.find(c => c.id === 'google_ads');
  
  const totalCpl = totalLeads > 0 ? totalInvestment / totalLeads : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Mídia e Leads por Canal</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meta Ads Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              Meta Ads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Mídia</span>
              <span className="font-semibold text-foreground">{formatCurrency(metaAds?.investment || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Leads</span>
              <span className="font-semibold text-foreground">{formatNumber(metaAds?.leads || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">CPL</span>
              <span className="font-semibold text-foreground">{formatCurrency(metaAds?.cpl || 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Google Ads Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              Google Ads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Mídia</span>
              <span className="font-semibold text-foreground">{formatCurrency(googleAds?.investment || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Leads</span>
              <span className="font-semibold text-foreground">{formatNumber(googleAds?.leads || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">CPL</span>
              <span className="font-semibold text-foreground">{formatCurrency(googleAds?.cpl || 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Instagram Card */}
        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              Instagram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">O2</span>
              <span className="font-semibold text-foreground">{formatCurrency(instagram.instagramO2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Pedro</span>
              <span className="font-semibold text-foreground">{formatCurrency(instagram.instagramPedro)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="font-semibold text-foreground">{formatCurrency(instagram.instagramTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Totals Card */}
        <Card className="border-l-4 border-l-primary bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              TOTAIS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Mídia Total</span>
              <span className="font-bold text-primary">{formatCurrency(totalInvestment)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Leads Totais</span>
              <span className="font-bold text-primary">{formatNumber(totalLeads)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">CPL Total</span>
              <span className="font-bold text-primary">{formatCurrency(totalCpl)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
