import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CampaignData } from "./types";

interface CampaignsTableProps {
  campaigns: CampaignData[];
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const [isOpen, setIsOpen] = useState(true);

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
        return <Badge variant="secondary">Pausado</Badge>;
      case 'ended':
        return <Badge variant="outline">Encerrado</Badge>;
      default:
        return null;
    }
  };

  const hasData = campaigns.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
            >
              <CardTitle className="text-base font-medium">Campanhas e Anúncios</CardTitle>
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
            {!hasData ? (
              <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                Sem dados de campanhas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">MQLs</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.channel}</TableCell>
                        <TableCell className="text-right">{formatNumber(campaign.leads)}</TableCell>
                        <TableCell className="text-right">{formatNumber(campaign.mqls)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(campaign.investment)}</TableCell>
                        <TableCell className="text-right">
                          {campaign.roas > 0 ? `${campaign.roas.toFixed(1)}x` : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
