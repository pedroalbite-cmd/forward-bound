import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useModeloAtualMetas } from "@/hooks/useModeloAtualMetas";
import { useExpansaoMetas } from "@/hooks/useExpansaoMetas";
import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";
import { useOxyHackerMetas } from "@/hooks/useOxyHackerMetas";
// useLeadsMetas removed - now using useModeloAtualMetas for leads
import { useModeloAtualAnalytics } from "@/hooks/useModeloAtualAnalytics";
import { useO2TaxAnalytics } from "@/hooks/useO2TaxAnalytics";
import { useExpansaoAnalytics } from "@/hooks/useExpansaoAnalytics";
import { BUType, IndicatorType } from "@/hooks/useFunnelRealized";
import { DetailSheet, DetailItem, columnFormatters } from "./indicators/DetailSheet";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClickableFunnelChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  selectedBUs?: BUType[];
  selectedClosers?: string[];
}

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));
const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);

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
    const baseColumns: { key: keyof DetailItem; label: string; format?: (value: any) => React.ReactNode }[] = [
      { key: 'product', label: 'Produto', format: columnFormatters.product },
      { key: 'name', label: 'Título' },
      { key: 'company', label: 'Empresa/Contato' },
      { key: 'phase', label: 'Fase', format: columnFormatters.phase },
      { key: 'date', label: 'Data', format: columnFormatters.date },
      { key: 'duration', label: 'Tempo na Fase', format: columnFormatters.duration },
    ];

    if (indicator === 'proposta' || indicator === 'venda') {
      return [
        ...baseColumns,
        { key: 'mrr' as keyof DetailItem, label: 'MRR', format: columnFormatters.currency },
        { key: 'setup' as keyof DetailItem, label: 'Setup', format: columnFormatters.currency },
        { key: 'pontual' as keyof DetailItem, label: 'Pontual', format: columnFormatters.currency },
        { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
      ];
    }

    return [
      ...baseColumns,
      { key: 'revenueRange' as keyof DetailItem, label: 'Faixa Faturamento' },
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
            <div 
              className="bg-muted/50 rounded-lg p-3 text-center cursor-pointer hover:bg-muted/70 transition-colors group relative"
              onClick={() => handleMonetaryClick('proposta', propostaValue)}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Proposta Enviada</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(propostaValue)}</p>
            </div>
            <div 
              className="bg-muted/50 rounded-lg p-3 text-center cursor-pointer hover:bg-muted/70 transition-colors group relative"
              onClick={() => handleMonetaryClick('venda', vendaValue)}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Contratos Assinados</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(vendaValue)}</p>
            </div>
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
