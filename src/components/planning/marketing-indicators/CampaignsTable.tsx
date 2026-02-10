import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, ChevronRight, Loader2, AlertCircle, ExternalLink, Image } from "lucide-react";
import { CampaignData, AdSetData, AdData, CampaignFunnel } from "./types";
import { useCampaignAdSets } from "@/hooks/useCampaignAdSets";
import { useAdSetAds } from "@/hooks/useAdSetAds";
import { cn } from "@/lib/utils";

interface CampaignsTableProps {
  campaigns: CampaignData[];
  campaignFunnels?: CampaignFunnel[];
  isLoading?: boolean;
  error?: Error | null;
  startDate: Date;
  endDate: Date;
}

interface PreviewModalData {
  name: string;
  thumbnailUrl: string;
  previewUrl?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  cpl?: number;
  ctr?: number;
}

// ─── Formatters ────────────────────────────────────────────────

const formatCurrency = (value: number) => {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return `R$ ${value.toFixed(0)}`;
};

const formatNumber = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(0);
};

const formatPercent = (value: number) => {
  if (!value || value === 0) return '-';
  return `${value.toFixed(2)}%`;
};

const getStatusBadge = (status: 'active' | 'paused' | 'ended') => {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-emerald-500">Ativo</Badge>;
    case 'paused':
      return <Badge variant="secondary" className="bg-amber-500 text-white">Pausado</Badge>;
    case 'ended':
      return <Badge variant="outline">Encerrado</Badge>;
    default:
      return null;
  }
};

// ─── Thumbnail component ──────────────────────────────────────

function Thumbnail({ 
  url, name, size = 'md', onClick 
}: { 
  url?: string; name: string; size?: 'sm' | 'md'; onClick?: () => void 
}) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClass} object-cover rounded cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      />
    );
  }
  return (
    <div className={`${sizeClass} bg-muted rounded flex items-center justify-center`}>
      <Image className={`${iconSize} text-muted-foreground`} />
    </div>
  );
}

// ─── Ad Row (level 3) ─────────────────────────────────────────

function AdRow({ ad, onPreview }: { ad: AdData; onPreview: (data: PreviewModalData) => void }) {
  return (
    <TableRow className="bg-muted/15">
      <TableCell className="p-2"></TableCell>
      <TableCell className="w-14 p-2">
        <Thumbnail
          url={ad.thumbnailUrl}
          name={ad.name}
          size="sm"
          onClick={() => ad.thumbnailUrl && onPreview({
            name: ad.name, thumbnailUrl: ad.thumbnailUrl, previewUrl: ad.previewUrl,
            spend: ad.spend, impressions: ad.impressions, clicks: ad.clicks, leads: ad.leads, cpl: ad.cpl, ctr: ad.ctr,
          })}
        />
      </TableCell>
      <TableCell className="pl-10 font-normal text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>│  ├─ {ad.name}</span>
          {ad.previewUrl && (
            <a href={ad.previewUrl} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} className="text-primary hover:text-primary/80" title="Abrir no Ads Manager">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right text-xs">{formatNumber(ad.leads)}</TableCell>
      <TableCell className="text-right text-xs">{formatCurrency(ad.spend)}</TableCell>
      <TableCell className="text-right text-xs">{ad.cpl > 0 ? formatCurrency(ad.cpl) : '-'}</TableCell>
      <TableCell className="text-right text-xs">{ad.cpa > 0 ? formatCurrency(ad.cpa) : '-'}</TableCell>
      <TableCell>{getStatusBadge(ad.status)}</TableCell>
    </TableRow>
  );
}

// ─── AdSet Row (level 2) ──────────────────────────────────────

function AdSetRow({ 
  adSet, startDate, endDate, onPreview 
}: { 
  adSet: AdSetData; startDate: Date; endDate: Date; onPreview: (data: PreviewModalData) => void 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: ads, isLoading, error } = useAdSetAds(
    isExpanded ? adSet.id : null, startDate, endDate, isExpanded
  );

  return (
    <>
      <TableRow className="bg-muted/30 cursor-pointer hover:bg-muted/40" onClick={() => setIsExpanded(!isExpanded)}>
        <TableCell className="p-2">
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin ml-2" />
          ) : (
            <ChevronRight className={`h-3 w-3 ml-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          )}
        </TableCell>
        <TableCell className="w-14 p-2"></TableCell>
        <TableCell className="pl-6 font-normal text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>├─ {adSet.name}</span>
            {adSet.previewUrl && (
              <a href={adSet.previewUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()} className="text-primary hover:text-primary/80" title="Abrir no Ads Manager">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right text-sm">{formatNumber(adSet.leads)}</TableCell>
        <TableCell className="text-right text-sm">{formatCurrency(adSet.spend)}</TableCell>
        <TableCell className="text-right text-sm">{adSet.cpl > 0 ? formatCurrency(adSet.cpl) : '-'}</TableCell>
        <TableCell className="text-right text-sm">{(adSet.cpa || 0) > 0 ? formatCurrency(adSet.cpa!) : '-'}</TableCell>
        <TableCell>{getStatusBadge(adSet.status)}</TableCell>
      </TableRow>

      {isExpanded && isLoading && (
        <TableRow className="bg-muted/15">
          <TableCell colSpan={13} className="text-center py-3 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            Carregando anúncios...
          </TableCell>
        </TableRow>
      )}

      {isExpanded && error && (
        <TableRow className="bg-muted/15">
          <TableCell colSpan={13} className="text-center py-3 text-sm text-destructive">
            {(error as Error).message === 'RATE_LIMIT'
              ? '⏳ Limite de requisições atingido. Aguarde e tente novamente.'
              : `Erro ao carregar anúncios: ${(error as Error).message}`}
          </TableCell>
        </TableRow>
      )}

      {isExpanded && !isLoading && ads && ads.length === 0 && !error && (
        <TableRow className="bg-muted/15">
          <TableCell colSpan={13} className="text-center py-3 text-muted-foreground text-xs">
            Nenhum anúncio encontrado
          </TableCell>
        </TableRow>
      )}

      {isExpanded && ads?.filter(a => a.status !== 'paused').map((ad) => (
        <AdRow key={ad.id} ad={ad} onPreview={onPreview} />
      ))}
    </>
  );
}

// ─── Campaign Row (level 1) ───────────────────────────────────

function CampaignRow({
  campaign, isExpanded, onToggle, startDate, endDate, onPreview, funnel,
}: {
  campaign: CampaignData; isExpanded: boolean; onToggle: () => void;
  startDate: Date; endDate: Date; onPreview: (data: PreviewModalData) => void;
  funnel?: CampaignFunnel;
}) {
  const { data: adSets, isLoading: adSetsLoading, error: adSetsError } = useCampaignAdSets(
    isExpanded ? campaign.id : null, startDate, endDate, isExpanded
  );

  const hasAdSets = adSets && adSets.length > 0;

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell className="p-2">
          {adSetsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          )}
        </TableCell>
        <TableCell className="w-14 p-2"></TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <span>{campaign.name}</span>
            {campaign.previewUrl && (
              <a href={campaign.previewUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()} className="text-primary hover:text-primary/80" title="Abrir no Meta Ads Manager">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">{formatNumber(campaign.leads)}</TableCell>
        <TableCell className="text-right">{formatCurrency(campaign.investment)}</TableCell>
        <TableCell className="text-right">
          {campaign.cpl && campaign.cpl > 0 ? formatCurrency(campaign.cpl) : '-'}
        </TableCell>
        <TableCell className="text-right">
          {(campaign.cpa || 0) > 0 ? formatCurrency(campaign.cpa!) : '-'}
        </TableCell>
        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
        {/* CRM funnel columns */}
        <TableCell className="text-right font-medium">{funnel ? funnel.leads : '-'}</TableCell>
        <TableCell className="text-right font-medium">{funnel ? funnel.mqls : '-'}</TableCell>
        <TableCell className="text-right font-medium">{funnel ? funnel.vendas : '-'}</TableCell>
        <TableCell className="text-right font-medium">{funnel ? formatCurrency(funnel.receita) : '-'}</TableCell>
        <TableCell className={cn("text-right font-medium", funnel && funnel.roi > 0 && (funnel.roi >= 1 ? "text-chart-2" : "text-destructive"))}>
          {funnel && funnel.investimento > 0 ? `${funnel.roi.toFixed(1)}x` : '-'}
        </TableCell>
      </TableRow>

      {isExpanded && adSetsLoading && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={13} className="text-center py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            Carregando conjuntos de anúncios...
          </TableCell>
        </TableRow>
      )}

      {isExpanded && !adSetsLoading && !hasAdSets && !adSetsError && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={13} className="text-center py-4 text-muted-foreground text-sm">
            Nenhum conjunto de anúncio encontrado
          </TableCell>
        </TableRow>
      )}

      {isExpanded && adSetsError && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={13} className="text-center py-4 text-sm text-destructive">
            {adSetsError.message === 'RATE_LIMIT'
              ? '⏳ Limite de requisições atingido. Aguarde alguns segundos e tente novamente.'
              : `Erro ao carregar conjuntos: ${adSetsError.message}`}
          </TableCell>
        </TableRow>
      )}

      {isExpanded && hasAdSets && adSets!.filter(a => a.status !== 'paused').map((adSet) => (
        <AdSetRow key={adSet.id} adSet={adSet} startDate={startDate} endDate={endDate} onPreview={onPreview} />
      ))}
    </>
  );
}

// ─── Preview Modal ────────────────────────────────────────────

function CreativePreviewModal({ 
  data, open, onClose 
}: { 
  data: PreviewModalData | null; open: boolean; onClose: () => void 
}) {
  if (!data) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium truncate">{data.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <img src={data.thumbnailUrl} alt={data.name} className="w-full rounded-lg object-contain max-h-[400px]" />
          <div className="grid grid-cols-3 gap-3 text-sm">
            {data.spend !== undefined && (
              <div><span className="text-muted-foreground">Gasto:</span> <span className="font-medium">{formatCurrency(data.spend)}</span></div>
            )}
            {data.impressions !== undefined && (
              <div><span className="text-muted-foreground">Impressões:</span> <span className="font-medium">{formatNumber(data.impressions)}</span></div>
            )}
            {data.clicks !== undefined && (
              <div><span className="text-muted-foreground">Cliques:</span> <span className="font-medium">{formatNumber(data.clicks)}</span></div>
            )}
            {data.leads !== undefined && (
              <div><span className="text-muted-foreground">Leads:</span> <span className="font-medium">{formatNumber(data.leads)}</span></div>
            )}
            {data.cpl !== undefined && data.cpl > 0 && (
              <div><span className="text-muted-foreground">CPL:</span> <span className="font-medium">{formatCurrency(data.cpl)}</span></div>
            )}
            {data.ctr !== undefined && data.ctr > 0 && (
              <div><span className="text-muted-foreground">CTR:</span> <span className="font-medium">{formatPercent(data.ctr)}</span></div>
            )}
          </div>
          {data.previewUrl && (
            <a href={data.previewUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80">
              <ExternalLink className="h-3 w-3" /> Abrir no Ads Manager
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function CampaignsTable({ campaigns, campaignFunnels, isLoading, error, startDate, endDate }: CampaignsTableProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [previewData, setPreviewData] = useState<PreviewModalData | null>(null);

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) newSet.delete(campaignId);
      else newSet.add(campaignId);
      return newSet;
    });
  };

  // Build lookup: campaign ID -> funnel, plus normalized name fallback
  const funnelMap = useMemo(() => {
    const map = new Map<string, CampaignFunnel>();
    if (campaignFunnels) {
      for (const f of campaignFunnels) {
        if (f.campaignId) map.set(f.campaignId, f);
        // Also index by normalized name for old campaigns without ID match
        const normName = f.campaignName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[_-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!map.has(normName)) map.set(normName, f);
      }
    }
    return map;
  }, [campaignFunnels]);

  const hasData = campaigns.length > 0;

  return (
    <>
      <CreativePreviewModal data={previewData} open={!!previewData} onClose={() => setPreviewData(null)} />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-medium">Campanhas e Anúncios</CardTitle>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {hasData && <Badge variant="outline" className="text-xs">{campaigns.length} campanhas</Badge>}
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {isLoading ? (
                <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Carregando campanhas do Meta...
                </div>
              ) : error ? (
                <div className="h-[120px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <span className="text-sm">Erro ao carregar campanhas</span>
                  <span className="text-xs text-destructive">{error.message}</span>
                </div>
              ) : !hasData ? (
                <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                  Nenhuma campanha ativa encontrada
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="w-14">Preview</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">Gasto</TableHead>
                        <TableHead className="text-right">CPL</TableHead>
                        <TableHead className="text-right">CPA</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right border-l">Leads (CRM)</TableHead>
                        <TableHead className="text-right">MQLs</TableHead>
                        <TableHead className="text-right">Vendas</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.filter(c => c.status !== 'paused').map((campaign) => (
                        <CampaignRow
                          key={campaign.id}
                          campaign={campaign}
                          isExpanded={expandedCampaigns.has(campaign.id)}
                          onToggle={() => toggleCampaign(campaign.id)}
                          startDate={startDate}
                          endDate={endDate}
                          onPreview={setPreviewData}
                          funnel={funnelMap.get(campaign.id) || funnelMap.get(campaign.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim())}
                        />
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                    <span className="text-muted-foreground">Total: {campaigns.filter(c => c.status !== 'paused').length} campanhas</span>
                    <div className="flex gap-6">
                      <span>
                        <span className="text-muted-foreground">Leads: </span>
                        <span className="font-medium">{formatNumber(campaigns.filter(c => c.status !== 'paused').reduce((sum, c) => sum + c.leads, 0))}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Gasto: </span>
                        <span className="font-medium">{formatCurrency(campaigns.filter(c => c.status !== 'paused').reduce((sum, c) => sum + c.investment, 0))}</span>
                      </span>
                      {campaignFunnels && campaignFunnels.length > 0 && (
                        <>
                          <span>
                            <span className="text-muted-foreground">Vendas (CRM): </span>
                            <span className="font-medium">{campaignFunnels.reduce((s, f) => s + f.vendas, 0)}</span>
                          </span>
                          <span>
                            <span className="text-muted-foreground">Receita: </span>
                            <span className="font-medium">{formatCurrency(campaignFunnels.reduce((s, f) => s + f.receita, 0))}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
}
