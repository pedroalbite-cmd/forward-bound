import { Card, CardContent } from "@/components/ui/card";
import { ChannelSummary, CHANNEL_LABELS, ChannelId } from "./types";
import { TrendingUp, Users, ShoppingCart, DollarSign, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CHANNEL_ICONS: Record<ChannelId, string> = {
  meta_ads: '📘',
  google_ads: '🔍',
  eventos: '🎪',
  organico: '🌱',
  outros: '📊',
};

interface ChannelAttributionCardsProps {
  summaries: ChannelSummary[];
}

export function ChannelAttributionCards({ summaries }: ChannelAttributionCardsProps) {
  if (!summaries.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Atribuição por Canal (Dados Reais)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaries.map((s) => (
          <Card key={s.channel}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{CHANNEL_ICONS[s.channel]}</span>
                <span className="font-semibold text-sm">{CHANNEL_LABELS[s.channel]}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Leads</span>
                  <span className="font-semibold ml-auto">{s.leads}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Vendas</span>
                  <span className="font-semibold ml-auto">{s.vendas}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Receita</span>
                  <span className="font-semibold ml-auto">R$ {(s.receita / 1000).toFixed(0)}k</span>
                </div>
                {s.investimento > 0 && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">ROI</span>
                    <span className={`font-semibold ml-auto ${s.roi >= 1 ? 'text-chart-2' : 'text-destructive'}`}>
                      {s.roi.toFixed(1)}x
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
