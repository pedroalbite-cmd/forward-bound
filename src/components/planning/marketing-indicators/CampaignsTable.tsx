import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { CampaignData, AdSetData } from "./types";

interface CampaignsTableProps {
  campaigns: CampaignData[];
  isLoading?: boolean;
  error?: Error | null;
}

export function CampaignsTable({ campaigns, isLoading, error }: CampaignsTableProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  const getStatusBadge = (status: CampaignData['status']) => {
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

  const hasData = campaigns.length > 0;
  const hasAdSets = campaigns.some(c => c.adSets && c.adSets.length > 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium">Campanhas e Anúncios</CardTitle>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {hasData && (
                  <Badge variant="outline" className="text-xs">
                    {campaigns.length} campanhas
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
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
                      {hasAdSets && <TableHead className="w-8"></TableHead>}
                      <TableHead>Campanha</TableHead>
                      <TableHead>Objetivo</TableHead>
                      <TableHead className="text-right">Impressões</TableHead>
                      <TableHead className="text-right">Cliques</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                      <TableHead className="text-right">CPL</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => {
                      const isExpanded = expandedCampaigns.has(campaign.id);
                      const hasChildAdSets = campaign.adSets && campaign.adSets.length > 0;

                      return (
                        <>
                          <TableRow 
                            key={campaign.id}
                            className={hasChildAdSets ? "cursor-pointer hover:bg-muted/50" : ""}
                            onClick={() => hasChildAdSets && toggleCampaign(campaign.id)}
                          >
                            {hasAdSets && (
                              <TableCell className="p-2">
                                {hasChildAdSets && (
                                  <ChevronRight 
                                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                  />
                                )}
                              </TableCell>
                            )}
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {campaign.objective?.replace(/_/g, ' ').toLowerCase() || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(campaign.impressions || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(campaign.clicks || 0)}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(campaign.leads)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(campaign.investment)}</TableCell>
                            <TableCell className="text-right">
                              {campaign.cpl && campaign.cpl > 0 ? formatCurrency(campaign.cpl) : '-'}
                            </TableCell>
                            <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                          </TableRow>
                          
                          {/* Ad Sets rows */}
                          {isExpanded && hasChildAdSets && campaign.adSets!.map((adSet) => (
                            <TableRow 
                              key={adSet.id}
                              className="bg-muted/30"
                            >
                              {hasAdSets && <TableCell className="p-2"></TableCell>}
                              <TableCell className="pl-8 font-normal text-sm text-muted-foreground">
                                ├─ {adSet.name}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">Conjunto</TableCell>
                              <TableCell className="text-right text-sm">
                                {formatNumber(adSet.impressions)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatNumber(adSet.clicks)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatNumber(adSet.leads)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(adSet.spend)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {adSet.cpl > 0 ? formatCurrency(adSet.cpl) : '-'}
                              </TableCell>
                              <TableCell>{getStatusBadge(adSet.status)}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {/* Summary row */}
                <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total: {campaigns.length} campanhas
                  </span>
                  <div className="flex gap-6">
                    <span>
                      <span className="text-muted-foreground">Leads: </span>
                      <span className="font-medium">
                        {formatNumber(campaigns.reduce((sum, c) => sum + c.leads, 0))}
                      </span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Gasto: </span>
                      <span className="font-medium">
                        {formatCurrency(campaigns.reduce((sum, c) => sum + c.investment, 0))}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
