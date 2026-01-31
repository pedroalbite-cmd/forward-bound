import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { useModeloAtualMetas } from "@/hooks/useModeloAtualMetas";
import { useExpansaoMetas } from "@/hooks/useExpansaoMetas";
import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";
import { useOxyHackerMetas } from "@/hooks/useOxyHackerMetas";
import { useModeloAtualAnalytics } from "@/hooks/useModeloAtualAnalytics";
import { useO2TaxAnalytics } from "@/hooks/useO2TaxAnalytics";
import { useExpansaoAnalytics } from "@/hooks/useExpansaoAnalytics";
import { BUType, IndicatorType } from "@/hooks/useFunnelRealized";
import { DetailSheet, DetailItem, columnFormatters } from "./indicators/DetailSheet";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaMetas } from "@/contexts/MediaMetasContext";
import { eachMonthOfInterval, format } from "date-fns";

interface ClickableFunnelChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  selectedBUs?: BUType[];
  selectedClosers?: string[];
}

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));
const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);

// Ticket médio por BU para cálculo de meta monetária
const TICKET_MEDIOS: Record<string, number> = {
  modelo_atual: 17000,
  o2_tax: 15000,
  oxy_hacker: 54000,
  franquia: 140000,
};

interface FunnelGaugeCardProps {
  title: string;
  value: number;
  meta: number;
  onClick?: () => void;
}

function FunnelGaugeCard({ title, value, meta, onClick }: FunnelGaugeCardProps) {
  const percentage = meta > 0 ? (value / meta) * 100 : 0;
  const isOnTrack = percentage >= 100;
  
  const chartData = [{ 
    value: Math.min(percentage, 100), 
    fill: isOnTrack ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" 
  }];

  return (
    <div 
      className="bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted/70 transition-colors group relative flex flex-col items-center"
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      
      <div className="relative w-20 h-20">
        <RadialBarChart 
          width={80} 
          height={80} 
          innerRadius="65%" 
          outerRadius="100%" 
          data={chartData} 
          startAngle={90} 
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={8} />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-foreground">{formatCurrency(value)}</span>
        </div>
      </div>
      
      <span className={cn(
        "text-xs font-medium",
        isOnTrack ? "text-chart-2" : "text-destructive"
      )}>
        {Math.round(percentage)}%
      </span>
      <span className="text-[10px] text-muted-foreground">Meta: {formatCurrency(meta)}</span>
    </div>
  );
}

interface FunnelStage {
  number: number;
  name: string;
  indicator: IndicatorType;
  value: number;
  conversionPercent: number;
}

export function ClickableFunnelChart({ startDate, endDate, selectedBU, selectedBUs, selectedClosers }: ClickableFunnelChartProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetDescription, setSheetDescription] = useState('');
  const [sheetItems, setSheetItems] = useState<DetailItem[]>([]);
  const [sheetColumns, setSheetColumns] = useState<{ key: keyof DetailItem; label: string; format?: (value: any) => React.ReactNode }[]>([]);

  const { getQtyForPeriod: getModeloAtualQty, getValueForPeriod: getModeloAtualValue } = useModeloAtualMetas(startDate, endDate);
  const { getQtyForPeriod: getExpansaoQty, getValueForPeriod: getExpansaoValue } = useExpansaoMetas(startDate, endDate);
  const { getQtyForPeriod: getO2TaxQty, getValueForPeriod: getO2TaxValue } = useO2TaxMetas(startDate, endDate);
  const { getQtyForPeriod: getOxyHackerQty, getValueForPeriod: getOxyHackerValue } = useOxyHackerMetas(startDate, endDate);
  
  // Get funnel data for metas
  const { funnelData } = useMediaMetas();
  
  
  // Analytics hooks for drill-down
  const modeloAtualAnalytics = useModeloAtualAnalytics(startDate, endDate);
  const o2TaxAnalytics = useO2TaxAnalytics(startDate, endDate);
  const franquiaAnalytics = useExpansaoAnalytics(startDate, endDate, 'Franquia');
  const oxyHackerAnalytics = useExpansaoAnalytics(startDate, endDate, 'Oxy Hacker');
  
  // Derive which BUs are included from selectedBUs array (or fallback to selectedBU)
  const selectedBUsArray = selectedBUs || (selectedBU === 'all' 
    ? ['modelo_atual', 'o2_tax', 'oxy_hacker', 'franquia'] as BUType[]
    : [selectedBU]);
  
  const includesModeloAtual = selectedBUsArray.includes('modelo_atual');
  const includesO2Tax = selectedBUsArray.includes('o2_tax');
  const includesOxyHacker = selectedBUsArray.includes('oxy_hacker');
  const includesFranquia = selectedBUsArray.includes('franquia');
  
  // Check if single BU selected for drill-down routing
  const hasSingleBU = selectedBUsArray.length === 1;
  const useExpansaoData = hasSingleBU && selectedBUsArray[0] === 'franquia';
  const useO2TaxData = hasSingleBU && selectedBUsArray[0] === 'o2_tax';
  const useOxyHackerData = hasSingleBU && selectedBUsArray[0] === 'oxy_hacker';
  const useConsolidado = selectedBUsArray.length > 1;
  
  // Get leads data from the same database source as charts (Modelo Atual)
  const leadsQty = getModeloAtualQty('leads', startDate, endDate);
  const o2TaxLeadsQty = getO2TaxQty('leads', startDate, endDate);
  const oxyHackerLeadsQty = getOxyHackerQty('leads', startDate, endDate);
  const franquiaLeadsQty = getExpansaoQty('leads', startDate, endDate);
  
  // Helper to get filtered qty for Modelo Atual when closers filter is active
  const getFilteredModeloAtualQty = (indicator: IndicatorType): number => {
    if (selectedClosers?.length && selectedClosers.length > 0) {
      const cards = modeloAtualAnalytics.getCardsForIndicator(indicator);
      const filteredCards = cards.filter(c => {
        const closerValue = (c.closer || '').trim();
        return closerValue && selectedClosers.includes(closerValue);
      });
      return filteredCards.length;
    }
    if (indicator === 'leads') return leadsQty;
    return getModeloAtualQty(indicator, startDate, endDate);
  };

  // Helper to get filtered value for Modelo Atual when closers filter is active
  const getFilteredModeloAtualValue = (indicator: 'proposta' | 'venda'): number => {
    if (selectedClosers?.length && selectedClosers.length > 0) {
      const cards = modeloAtualAnalytics.getCardsForIndicator(indicator);
      const filteredCards = cards.filter(c => {
        const closerValue = (c.closer || '').trim();
        return closerValue && selectedClosers.includes(closerValue);
      });
      return filteredCards.reduce((sum, card) => sum + card.valor, 0);
    }
    return getModeloAtualValue(indicator, startDate, endDate);
  };

  // Get totals based on selected BUs array - sum only included BUs
  const totals = {
    leads: (includesModeloAtual ? getFilteredModeloAtualQty('leads') : 0) + 
           (includesO2Tax ? o2TaxLeadsQty : 0) + 
           (includesOxyHacker ? oxyHackerLeadsQty : 0) + 
           (includesFranquia ? franquiaLeadsQty : 0),
    mql: (includesModeloAtual ? getFilteredModeloAtualQty('mql') : 0) + 
         (includesO2Tax ? getO2TaxQty('mql', startDate, endDate) : 0) + 
         (includesOxyHacker ? getOxyHackerQty('mql', startDate, endDate) : 0) + 
         (includesFranquia ? getExpansaoQty('mql', startDate, endDate) : 0),
    rm: (includesModeloAtual ? getFilteredModeloAtualQty('rm') : 0) + 
        (includesO2Tax ? getO2TaxQty('rm', startDate, endDate) : 0) + 
        (includesOxyHacker ? getOxyHackerQty('rm', startDate, endDate) : 0) + 
        (includesFranquia ? getExpansaoQty('rm', startDate, endDate) : 0),
    rr: (includesModeloAtual ? getFilteredModeloAtualQty('rr') : 0) + 
        (includesO2Tax ? getO2TaxQty('rr', startDate, endDate) : 0) + 
        (includesOxyHacker ? getOxyHackerQty('rr', startDate, endDate) : 0) + 
        (includesFranquia ? getExpansaoQty('rr', startDate, endDate) : 0),
    proposta: (includesModeloAtual ? getFilteredModeloAtualQty('proposta') : 0) + 
              (includesO2Tax ? getO2TaxQty('proposta', startDate, endDate) : 0) + 
              (includesOxyHacker ? getOxyHackerQty('proposta', startDate, endDate) : 0) + 
              (includesFranquia ? getExpansaoQty('proposta', startDate, endDate) : 0),
    venda: (includesModeloAtual ? getFilteredModeloAtualQty('venda') : 0) + 
           (includesO2Tax ? getO2TaxQty('venda', startDate, endDate) : 0) + 
           (includesOxyHacker ? getOxyHackerQty('venda', startDate, endDate) : 0) + 
           (includesFranquia ? getExpansaoQty('venda', startDate, endDate) : 0),
  };

  // Calculate conversions
  const stages: FunnelStage[] = [
    { number: 1, name: 'Leads', indicator: 'leads' as IndicatorType, value: totals.leads, conversionPercent: 100 },
    { number: 2, name: 'MQL', indicator: 'mql', value: totals.mql, conversionPercent: totals.leads > 0 ? (totals.mql / totals.leads) * 100 : 100 },
    { number: 3, name: 'Reuniões Agendadas', indicator: 'rm', value: totals.rm, conversionPercent: totals.mql > 0 ? (totals.rm / totals.mql) * 100 : 0 },
    { number: 4, name: 'Reunião realizada', indicator: 'rr', value: totals.rr, conversionPercent: totals.rm > 0 ? (totals.rr / totals.rm) * 100 : 0 },
    { number: 5, name: 'Proposta Enviada', indicator: 'proposta', value: totals.proposta, conversionPercent: totals.rr > 0 ? (totals.proposta / totals.rr) * 100 : 0 },
    { number: 6, name: 'Contrato Assinado', indicator: 'venda', value: totals.venda, conversionPercent: totals.proposta > 0 ? (totals.venda / totals.proposta) * 100 : 0 },
  ];

  // Calculate monetary values based on selected BUs array
  const propostaValue = 
    (includesModeloAtual ? getFilteredModeloAtualValue('proposta') : 0) +
    (includesO2Tax ? getO2TaxValue('proposta', startDate, endDate) : 0) +
    (includesOxyHacker ? getOxyHackerValue('proposta', startDate, endDate) : 0) +
    (includesFranquia ? getExpansaoValue('proposta', startDate, endDate) : 0);

  const vendaValue = 
    (includesModeloAtual ? getFilteredModeloAtualValue('venda') : 0) +
    (includesO2Tax ? getO2TaxValue('venda', startDate, endDate) : 0) +
    (includesOxyHacker ? getOxyHackerValue('venda', startDate, endDate) : 0) +
    (includesFranquia ? getExpansaoValue('venda', startDate, endDate) : 0);

  // Calculate metas for propostas and vendas based on funnelData and selected BUs
  const calculateMonetaryMeta = (indicator: 'propostas' | 'vendas'): number => {
    if (!funnelData) return 0;
    
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    let totalMeta = 0;
    
    const buDataMap: Record<string, typeof funnelData.modeloAtual> = {
      modelo_atual: funnelData.modeloAtual,
      o2_tax: funnelData.o2Tax,
      oxy_hacker: funnelData.oxyHacker,
      franquia: funnelData.franquia,
    };
    
    for (const buKey of selectedBUsArray) {
      const buData = buDataMap[buKey];
      if (!buData) continue;
      
      const ticket = TICKET_MEDIOS[buKey] || 17000;
      
      for (const month of months) {
        const monthKey = format(month, 'yyyy-MM');
        const monthData = buData.find(d => d.month === monthKey);
        if (monthData) {
          totalMeta += monthData[indicator] * ticket;
        }
      }
    }
    
    return totalMeta;
  };

  const propostaMeta = calculateMonetaryMeta('propostas');
  const vendaMeta = calculateMonetaryMeta('vendas');

  // Width percentages for funnel visualization (6 stages now)
  const widthPercentages = [100, 85, 70, 55, 45, 35];

  // Colors for each stage
  const stageColors = [
    'from-orange-400 to-orange-500',
    'from-emerald-400 to-cyan-500',
    'from-cyan-500 to-blue-500',
    'from-blue-500 to-blue-600',
    'from-blue-600 to-slate-500',
    'from-slate-500 to-slate-600',
  ];

  // Get columns for indicator type
  const getColumnsForIndicator = (indicator: IndicatorType) => {
    // For venda (sales), include SDR and Data Assinatura columns
    if (indicator === 'venda') {
      return [
        { key: 'product' as keyof DetailItem, label: 'Produto', format: columnFormatters.product },
        { key: 'name' as keyof DetailItem, label: 'Título' },
        { key: 'company' as keyof DetailItem, label: 'Empresa/Contato' },
        { key: 'dataAssinatura' as keyof DetailItem, label: 'Data Assinatura', format: columnFormatters.date },
        { key: 'mrr' as keyof DetailItem, label: 'MRR', format: columnFormatters.currency },
        { key: 'setup' as keyof DetailItem, label: 'Setup', format: columnFormatters.currency },
        { key: 'pontual' as keyof DetailItem, label: 'Pontual', format: columnFormatters.currency },
        { key: 'value' as keyof DetailItem, label: 'Total', format: columnFormatters.currency },
        { key: 'sdr' as keyof DetailItem, label: 'SDR' },
        { key: 'responsible' as keyof DetailItem, label: 'Closer' },
      ];
    }
    
    return [
      { key: 'product' as keyof DetailItem, label: 'Produto', format: columnFormatters.product },
      { key: 'name' as keyof DetailItem, label: 'Título' },
      { key: 'company' as keyof DetailItem, label: 'Empresa/Contato' },
      { key: 'date' as keyof DetailItem, label: 'Data', format: columnFormatters.date },
      { key: 'mrr' as keyof DetailItem, label: 'MRR', format: columnFormatters.currency },
      { key: 'setup' as keyof DetailItem, label: 'Setup', format: columnFormatters.currency },
      { key: 'pontual' as keyof DetailItem, label: 'Pontual', format: columnFormatters.currency },
      { key: 'value' as keyof DetailItem, label: 'Total', format: columnFormatters.currency },
      { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
    ];
  };

  // Get detail items for an indicator based on selected BU
  const getItemsForIndicator = (indicator: IndicatorType): DetailItem[] => {
    // For Franquia
    if (useExpansaoData) {
      return franquiaAnalytics.getDetailItemsForIndicator(indicator);
    }

    // For Oxy Hacker
    if (useOxyHackerData) {
      return oxyHackerAnalytics.getDetailItemsForIndicator(indicator);
    }

    // For O2 TAX - use analytics hook directly (now supports all indicators with date filtering)
    if (useO2TaxData) {
      return o2TaxAnalytics.getDetailItemsForIndicator(indicator);
    }

    // For Modelo Atual or Consolidado (use Modelo Atual data)
    if (selectedBU === 'modelo_atual' || useConsolidado) {
      // Get cards and filter by closer field specifically
      let items: DetailItem[];
      if (selectedClosers?.length && selectedClosers.length > 0) {
        const cards = modeloAtualAnalytics.getCardsForIndicator(indicator);
        const filteredCards = cards.filter(c => {
          const closerValue = (c.closer || '').trim();
          return closerValue && selectedClosers.includes(closerValue);
        });
        items = filteredCards.map(modeloAtualAnalytics.toDetailItem);
      } else {
        items = modeloAtualAnalytics.getDetailItemsForIndicator(indicator);
      }
      
      // For consolidado, also add items from all BUs
      if (useConsolidado) {
        // For leads, only Modelo Atual and O2 TAX have data
        if (indicator === 'leads') {
          const o2TaxLeadsItems = o2TaxAnalytics.getDetailItemsForIndicator('leads');
          return [...items, ...o2TaxLeadsItems];
        }
        const o2TaxPhaseMap: Record<string, string> = {
          'mql': 'MQL',
          'rm': 'RM',
          'rr': 'RR',
          'proposta': 'Proposta',
          'venda': 'Ganho',
        };
        
        // O2 TAX items
        let o2TaxItems: DetailItem[] = [];
        if (indicator === 'venda') {
          o2TaxItems = o2TaxAnalytics.getDealsWon.cards.map(o2TaxAnalytics.toDetailItem);
        } else {
          const phaseData = o2TaxAnalytics.getCardsByPhase.find(p => p.phase === o2TaxPhaseMap[indicator]);
          o2TaxItems = phaseData?.cards.map(o2TaxAnalytics.toDetailItem) ?? [];
        }
        
        // Franquia items
        const franquiaItems = franquiaAnalytics.getDetailItemsForIndicator(indicator);
        
        // Oxy Hacker items
        const oxyHackerItems = oxyHackerAnalytics.getDetailItemsForIndicator(indicator);
        
        return [...items, ...o2TaxItems, ...franquiaItems, ...oxyHackerItems];
      }
      
      return items;
    }

    return [];
  };

  // Handle stage click
  const handleStageClick = (stage: FunnelStage) => {
    if (stage.value === 0) {
      // No drill-down for any indicator without data
      return;
    }
    
    const items = getItemsForIndicator(stage.indicator);
    const columns = getColumnsForIndicator(stage.indicator);
    
    setSheetTitle(`${stage.name}`);
    setSheetDescription(`${formatNumber(stage.value)} registros no período selecionado`);
    setSheetItems(items);
    setSheetColumns(columns);
    setSheetOpen(true);
  };

  // Handle monetary value click
  const handleMonetaryClick = (type: 'proposta' | 'venda', value: number) => {
    const indicator = type as IndicatorType;
    const items = getItemsForIndicator(indicator);
    const columns = getColumnsForIndicator(indicator);
    
    const title = type === 'proposta' ? 'Propostas Enviadas' : 'Contratos Assinados';
    
    setSheetTitle(title);
    setSheetDescription(`Valor total: ${formatCurrency(value)}`);
    setSheetItems(items);
    setSheetColumns(columns);
    setSheetOpen(true);
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Funil do Período</CardTitle>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <FunnelGaugeCard
              title="Proposta Enviada"
              value={propostaValue}
              meta={propostaMeta}
              onClick={() => handleMonetaryClick('proposta', propostaValue)}
            />
            <FunnelGaugeCard
              title="Contratos Assinados"
              value={vendaValue}
              meta={vendaMeta}
              onClick={() => handleMonetaryClick('venda', vendaValue)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1">
            {stages.map((stage, index) => (
              <div key={stage.indicator} className="relative flex items-center justify-center">
                <div
                  className={cn(
                    `relative h-14 bg-gradient-to-r ${stageColors[index]} rounded-sm transition-all duration-300 flex items-center justify-center px-3 min-w-[180px] cursor-pointer hover:opacity-90 group`,
                    index === stages.length - 1 && 'ring-2 ring-pink-500 ring-offset-2 ring-offset-background'
                  )}
                  style={{ width: `${widthPercentages[index]}%` }}
                  onClick={() => handleStageClick(stage)}
                >
                  <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-3 w-3 text-white/70" />
                  </div>
                  <div className="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap overflow-hidden">
                    <span className="bg-white/20 rounded-full w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs">
                      {stage.number}
                    </span>
                    <span className="hidden sm:inline truncate">{stage.name}</span>
                    <span className="font-bold flex-shrink-0">{formatNumber(stage.value)}</span>
                    {index > 0 && stage.value > 0 && (
                      <span className="text-xs text-white/70 flex-shrink-0">
                        ({stage.conversionPercent.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>

      <DetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={sheetTitle}
        description={sheetDescription}
        items={sheetItems}
        columns={sheetColumns}
      />
    </>
  );
}
