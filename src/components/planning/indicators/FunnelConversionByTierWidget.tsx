import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Cell } from "recharts";
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from "lucide-react";
import { DetailItem, DetailSheet, columnFormatters } from "./DetailSheet";
import { IndicatorType } from "@/hooks/useFunnelRealized";

// Tier normalization map - standardizes various naming conventions
const TIER_NORMALIZATION: Record<string, string> = {
  // Até R$ 50k variants
  'Até R$ 50.000': 'Até R$ 50k',
  'Até R$ 50 mil': 'Até R$ 50k',
  'Até R$ 50k': 'Até R$ 50k',
  'até r$ 50.000': 'Até R$ 50k',
  'até r$ 50 mil': 'Até R$ 50k',
  'até 50k': 'Até R$ 50k',
  'Até 50k': 'Até R$ 50k',
  'Até R$50k': 'Até R$ 50k',
  'Até R$50.000': 'Até R$ 50k',
  'Ainda não faturamos': 'Até R$ 50k',
  'Abaixo de R$ 50.000': 'Até R$ 50k',
  'Abaixo de R$ 50 mil': 'Até R$ 50k',
  
  // R$ 50k - 200k variants
  'Entre R$ 50.000 e R$ 200.000': 'R$ 50k - 200k',
  'Entre R$ 50 mil e R$ 200 mil': 'R$ 50k - 200k',
  'R$ 50k - 200k': 'R$ 50k - 200k',
  'R$ 50k - R$ 200k': 'R$ 50k - 200k',
  'entre r$ 50.000 e r$ 200.000': 'R$ 50k - 200k',
  'Entre R$50k e R$200k': 'R$ 50k - 200k',
  'De R$ 50k a R$ 200k': 'R$ 50k - 200k',
  'R$50k-200k': 'R$ 50k - 200k',
  
  // R$ 200k - 1M variants
  'Entre R$ 200.000 e R$ 1.000.000': 'R$ 200k - 1M',
  'Entre R$ 200 mil e R$ 1 milhão': 'R$ 200k - 1M',
  'R$ 200k - 1M': 'R$ 200k - 1M',
  'R$ 200k - R$ 1M': 'R$ 200k - 1M',
  'entre r$ 200.000 e r$ 1.000.000': 'R$ 200k - 1M',
  'Entre R$200k e R$1M': 'R$ 200k - 1M',
  'De R$ 200k a R$ 1M': 'R$ 200k - 1M',
  'R$200k-1M': 'R$ 200k - 1M',
  'Entre R$ 200 mil e R$ 350 mil': 'R$ 200k - 1M',
  'Entre R$ 350 mil e R$ 500 mil': 'R$ 200k - 1M',
  'Entre R$ 500 mil e R$ 1 milhão': 'R$ 200k - 1M',
  'Entre R$ 200 mil e R$ 500 mil': 'R$ 200k - 1M',
  
  // Acima de 1M variants
  'Acima de R$ 1.000.000': 'Acima de 1M',
  'Acima de R$ 1 milhão': 'Acima de 1M',
  'Acima de 1M': 'Acima de 1M',
  'acima de r$ 1.000.000': 'Acima de 1M',
  'Entre R$ 1 milhão e R$ 5 milhões': 'Acima de 1M',
  'Entre R$ 1M e R$ 5M': 'Acima de 1M',
  'Mais de R$ 1M': 'Acima de 1M',
  'R$ 1M+': 'Acima de 1M',
  'Acima de R$1M': 'Acima de 1M',
  'Entre R$ 5 milhões e R$ 10 milhões': 'Acima de 1M',
  'Acima de R$ 5 milhões': 'Acima de 1M',
  'Acima de R$ 10 milhões': 'Acima de 1M',
};

// Ordered tiers for display
const TIER_ORDER = ['Até R$ 50k', 'R$ 50k - 200k', 'R$ 200k - 1M', 'Acima de 1M'];

// Tier colors for charts
const TIER_COLORS: Record<string, string> = {
  'Até R$ 50k': 'hsl(var(--chart-4))',
  'R$ 50k - 200k': 'hsl(var(--chart-3))',
  'R$ 200k - 1M': 'hsl(var(--chart-2))',
  'Acima de 1M': 'hsl(var(--chart-1))',
};

// Conversion stage labels
const STAGE_LABELS = [
  { key: 'leadToMql', label: 'Lead→MQL', from: 'leads', to: 'mql' },
  { key: 'mqlToRm', label: 'MQL→RM', from: 'mql', to: 'rm' },
  { key: 'rmToRr', label: 'RM→RR', from: 'rm', to: 'rr' },
  { key: 'rrToProposta', label: 'RR→Prop', from: 'rr', to: 'proposta' },
  { key: 'propostaToVenda', label: 'Prop→Venda', from: 'proposta', to: 'venda' },
] as const;

interface TierConversionData {
  tier: string;
  leadToMql: number;
  mqlToRm: number;
  rmToRr: number;
  rrToProposta: number;
  propostaToVenda: number;
  leads: number;
  mqls: number;
  rms: number;
  rrs: number;
  propostas: number;
  vendas: number;
}

interface FunnelConversionByTierWidgetProps {
  getItemsForIndicator: (indicator: IndicatorType) => DetailItem[];
}

// Normalize tier string to standard format
const normalizeTier = (revenueRange?: string): string => {
  if (!revenueRange) return 'Não informado';
  
  // Try direct match first
  const normalized = TIER_NORMALIZATION[revenueRange];
  if (normalized) return normalized;
  
  // Try lowercase match
  const lowerRange = revenueRange.toLowerCase().trim();
  const lowerNormalized = TIER_NORMALIZATION[lowerRange];
  if (lowerNormalized) return lowerNormalized;
  
  // Fallback: try to guess based on keywords
  if (lowerRange.includes('não fatur') || lowerRange.includes('ainda não')) {
    return 'Até R$ 50k';
  }
  if (lowerRange.includes('abaixo') || (lowerRange.includes('50') && !lowerRange.includes('200') && !lowerRange.includes('500'))) {
    return 'Até R$ 50k';
  }
  if (lowerRange.includes('50 mil') && lowerRange.includes('200')) {
    return 'R$ 50k - 200k';
  }
  if (lowerRange.includes('500 mil') || lowerRange.includes('350 mil') || 
      (lowerRange.includes('200') && (lowerRange.includes('350') || lowerRange.includes('500') || lowerRange.includes('milhão')))) {
    return 'R$ 200k - 1M';
  }
  if (lowerRange.includes('acima') || lowerRange.includes('5 milh') || 
      lowerRange.includes('10 milh') || lowerRange.includes('mais')) {
    return 'Acima de 1M';
  }
  
  return 'Não informado';
};

// Group items by normalized tier
const groupByTier = (items: DetailItem[]): Map<string, DetailItem[]> => {
  const groups = new Map<string, DetailItem[]>();
  
  items.forEach(item => {
    const tier = normalizeTier(item.revenueRange);
    if (!groups.has(tier)) groups.set(tier, []);
    groups.get(tier)!.push(item);
  });
  
  return groups;
};

// Calculate conversion percentage
const calcConversion = (from: number, to: number): number => {
  if (from === 0) return 0;
  return Math.round((to / from) * 100);
};

// Get color class based on conversion rate
const getConversionColorClass = (rate: number): string => {
  if (rate >= 70) return 'text-chart-2 font-medium';
  if (rate >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-destructive font-medium';
};

// Get background color class for cell highlighting
const getConversionBgClass = (rate: number): string => {
  if (rate >= 70) return 'bg-green-50 dark:bg-green-950/30';
  if (rate >= 40) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-red-50 dark:bg-red-950/30';
};

export function FunnelConversionByTierWidget({ getItemsForIndicator }: FunnelConversionByTierWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownItems, setDrillDownItems] = useState<DetailItem[]>([]);
  
  // Fetch items for each stage
  const leads = useMemo(() => getItemsForIndicator('leads'), [getItemsForIndicator]);
  const mqls = useMemo(() => getItemsForIndicator('mql'), [getItemsForIndicator]);
  const rms = useMemo(() => getItemsForIndicator('rm'), [getItemsForIndicator]);
  const rrs = useMemo(() => getItemsForIndicator('rr'), [getItemsForIndicator]);
  const propostas = useMemo(() => getItemsForIndicator('proposta'), [getItemsForIndicator]);
  const vendas = useMemo(() => getItemsForIndicator('venda'), [getItemsForIndicator]);
  
  // Calculate conversion data by tier
  const conversionData = useMemo((): TierConversionData[] => {
    const leadsByTier = groupByTier(leads);
    const mqlsByTier = groupByTier(mqls);
    const rmsByTier = groupByTier(rms);
    const rrsByTier = groupByTier(rrs);
    const propostasByTier = groupByTier(propostas);
    const vendasByTier = groupByTier(vendas);
    
    return TIER_ORDER.map(tier => {
      const leadsCount = leadsByTier.get(tier)?.length || 0;
      const mqlsCount = mqlsByTier.get(tier)?.length || 0;
      const rmsCount = rmsByTier.get(tier)?.length || 0;
      const rrsCount = rrsByTier.get(tier)?.length || 0;
      const propostasCount = propostasByTier.get(tier)?.length || 0;
      const vendasCount = vendasByTier.get(tier)?.length || 0;
      
      return {
        tier,
        leads: leadsCount,
        mqls: mqlsCount,
        rms: rmsCount,
        rrs: rrsCount,
        propostas: propostasCount,
        vendas: vendasCount,
        leadToMql: calcConversion(leadsCount, mqlsCount),
        mqlToRm: calcConversion(mqlsCount, rmsCount),
        rmToRr: calcConversion(rmsCount, rrsCount),
        rrToProposta: calcConversion(rrsCount, propostasCount),
        propostaToVenda: calcConversion(propostasCount, vendasCount),
      };
    });
  }, [leads, mqls, rms, rrs, propostas, vendas]);
  
  // Data for grouped bar chart
  const chartData = useMemo(() => {
    return STAGE_LABELS.map(stage => {
      const data: Record<string, any> = { stage: stage.label };
      TIER_ORDER.forEach(tier => {
        const tierData = conversionData.find(d => d.tier === tier);
        data[tier] = tierData ? tierData[stage.key as keyof TierConversionData] : 0;
      });
      return data;
    });
  }, [conversionData]);
  
  // Handle cell click for drill-down
  const handleCellClick = (tier: string, stage: typeof STAGE_LABELS[number]) => {
    const leadsByTier = groupByTier(leads);
    const mqlsByTier = groupByTier(mqls);
    const rmsByTier = groupByTier(rms);
    const rrsByTier = groupByTier(rrs);
    const propostasByTier = groupByTier(propostas);
    const vendasByTier = groupByTier(vendas);
    
    const tierMaps: Record<string, Map<string, DetailItem[]>> = {
      leads: leadsByTier,
      mql: mqlsByTier,
      rm: rmsByTier,
      rr: rrsByTier,
      proposta: propostasByTier,
      venda: vendasByTier,
    };
    
    // Get items from the "to" stage for the selected tier
    const items = tierMaps[stage.to]?.get(tier) || [];
    
    setDrillDownTitle(`${stage.label} - ${tier}`);
    setDrillDownItems(items);
    setDrillDownOpen(true);
  };
  
  // Check if we have any data
  const hasData = conversionData.some(d => d.leads > 0 || d.mqls > 0);
  
  // Calculate totals for summary
  const totals = useMemo(() => ({
    leads: conversionData.reduce((sum, d) => sum + d.leads, 0),
    mqls: conversionData.reduce((sum, d) => sum + d.mqls, 0),
    vendas: conversionData.reduce((sum, d) => sum + d.vendas, 0),
  }), [conversionData]);
  
  // Find best performing tier (highest MQL→Venda conversion)
  const bestTier = useMemo(() => {
    let best = { tier: '', rate: 0 };
    conversionData.forEach(d => {
      if (d.mqls > 0) {
        const overallConversion = (d.vendas / d.mqls) * 100;
        if (overallConversion > best.rate) {
          best = { tier: d.tier, rate: overallConversion };
        }
      }
    });
    return best;
  }, [conversionData]);
  
  // Find biggest bottleneck
  const bottleneck = useMemo(() => {
    let worst = { tier: '', stage: '', rate: 100 };
    conversionData.forEach(d => {
      STAGE_LABELS.forEach(stage => {
        const fromKey = stage.from as keyof TierConversionData;
        const toKey = stage.to as keyof TierConversionData;
        const fromVal = d[fromKey] as number;
        const toVal = d[toKey] as number;
        if (fromVal > 3) { // Only consider if we have enough data
          const rate = calcConversion(fromVal, toVal);
          if (rate < worst.rate) {
            worst = { tier: d.tier, stage: stage.label, rate };
          }
        }
      });
    });
    return worst;
  }, [conversionData]);
  
  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <Card className="bg-card border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Conversão de Funil por Tier de Faturamento
                  </CardTitle>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {bestTier.tier && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-chart-2" />
                      Melhor: <span className="text-foreground font-medium">{bestTier.tier}</span>
                      <span className="text-chart-2">({bestTier.rate.toFixed(0)}%)</span>
                    </span>
                  )}
                  {bottleneck.tier && bottleneck.rate < 50 && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      Gargalo: <span className="text-foreground font-medium">{bottleneck.stage}</span>
                      <span className="text-amber-500">({bottleneck.rate}%)</span>
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {!hasData ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                <>
                  {/* Conversion Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Tier de Faturamento</TableHead>
                          {STAGE_LABELS.map(stage => (
                            <TableHead key={stage.key} className="text-center min-w-[90px]">
                              {stage.label}
                            </TableHead>
                          ))}
                          <TableHead className="text-center min-w-[80px]">Volume</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversionData.map(row => (
                          <TableRow key={row.tier}>
                            <TableCell className="font-medium">{row.tier}</TableCell>
                            {STAGE_LABELS.map(stage => {
                              const rate = row[stage.key as keyof TierConversionData] as number;
                              const fromKey = stage.from as keyof TierConversionData;
                              const toKey = stage.to as keyof TierConversionData;
                              const fromVal = row[fromKey] as number;
                              const toVal = row[toKey] as number;
                              
                              return (
                                <TableCell 
                                  key={stage.key} 
                                  className={`text-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${getConversionBgClass(rate)}`}
                                  onClick={() => handleCellClick(row.tier, stage)}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className={getConversionColorClass(rate)}>
                                        {rate}%
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{toVal} de {fromVal} converteram</p>
                                      <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center text-muted-foreground">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>{row.leads} leads</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p>Leads: {row.leads}</p>
                                    <p>MQLs: {row.mqls}</p>
                                    <p>RMs: {row.rms}</p>
                                    <p>RRs: {row.rrs}</p>
                                    <p>Propostas: {row.propostas}</p>
                                    <p>Vendas: {row.vendas}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 justify-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500" />
                      <span className="text-muted-foreground">≥ 70% (Excelente)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-amber-500" />
                      <span className="text-muted-foreground">40-69% (Atenção)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-500" />
                      <span className="text-muted-foreground">&lt; 40% (Gargalo)</span>
                    </div>
                  </div>
                  
                  {/* Grouped Bar Chart */}
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          dataKey="stage" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--popover))", 
                            border: "1px solid hsl(var(--border))", 
                            borderRadius: "8px", 
                            color: "hsl(var(--popover-foreground))" 
                          }}
                          formatter={(value: number, name: string) => [`${value}%`, name]}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '10px' }}
                          formatter={(value) => <span className="text-sm">{value}</span>}
                        />
                        {TIER_ORDER.map((tier, index) => (
                          <Bar 
                            key={tier} 
                            dataKey={tier} 
                            fill={TIER_COLORS[tier]} 
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* Drill-down Detail Sheet */}
      <DetailSheet
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        title={drillDownTitle}
        description={`${drillDownItems.length} registros encontrados`}
        items={drillDownItems}
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'company', label: 'Empresa' },
          { key: 'revenueRange', label: 'Faturamento', format: columnFormatters.revenueRange },
          { key: 'phase', label: 'Fase', format: columnFormatters.phase },
          { key: 'date', label: 'Data', format: columnFormatters.date },
          { key: 'closer', label: 'Closer' },
          { key: 'responsible', label: 'SDR' },
        ]}
      />
    </TooltipProvider>
  );
}
