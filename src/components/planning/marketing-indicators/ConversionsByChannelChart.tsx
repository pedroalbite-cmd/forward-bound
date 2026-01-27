import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MarketingChannel } from "./types";

interface ConversionsByChannelChartProps {
  channels: MarketingChannel[];
}

export function ConversionsByChannelChart({ channels }: ConversionsByChannelChartProps) {
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

  const hasData = channels.some(c => c.leads > 0 || c.mqls > 0 || c.investment > 0);

  // Calculate totals
  const totals = channels.reduce(
    (acc, channel) => ({
      leads: acc.leads + channel.leads,
      mqls: acc.mqls + channel.mqls,
      rms: acc.rms + channel.rms,
      rrs: acc.rrs + channel.rrs,
      investment: acc.investment + channel.investment,
    }),
    { leads: 0, mqls: 0, rms: 0, rrs: 0, investment: 0 }
  );

  const totalConversionRate = totals.leads > 0 
    ? ((totals.mqls / totals.leads) * 100).toFixed(0) 
    : '0';
  const totalCpl = totals.leads > 0 ? totals.investment / totals.leads : 0;
  const totalCpmql = totals.mqls > 0 ? totals.investment / totals.mqls : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Conversão por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Sem dados de conversão por canal
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">MQLs</TableHead>
                  <TableHead className="text-right">RM</TableHead>
                  <TableHead className="text-right">RR</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">CPMQL</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="font-medium">{channel.name}</TableCell>
                    <TableCell className="text-right">{formatNumber(channel.leads)}</TableCell>
                    <TableCell className="text-right">{formatNumber(channel.mqls)}</TableCell>
                    <TableCell className="text-right">{formatNumber(channel.rms)}</TableCell>
                    <TableCell className="text-right">{formatNumber(channel.rrs)}</TableCell>
                    <TableCell className="text-right">
                      {channel.conversionRate > 0 ? `${channel.conversionRate.toFixed(0)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {channel.cpl > 0 ? formatCurrency(channel.cpl) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {channel.cpmql > 0 ? formatCurrency(channel.cpmql) : '-'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(channel.investment)}</TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.leads)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.mqls)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.rms)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.rrs)}</TableCell>
                  <TableCell className="text-right">{totalConversionRate}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCpl)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCpmql)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.investment)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
