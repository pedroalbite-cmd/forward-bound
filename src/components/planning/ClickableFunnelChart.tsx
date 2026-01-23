import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useModeloAtualMetas } from "@/hooks/useModeloAtualMetas";
import { useExpansaoMetas } from "@/hooks/useExpansaoMetas";
import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";
import { useOxyHackerMetas } from "@/hooks/useOxyHackerMetas";
import { useLeadsMetas } from "@/hooks/useLeadsMetas";
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

export function ClickableFunnelChart({ startDate, endDate, selectedBU }: ClickableFunnelChartProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetDescription, setSheetDescription] = useState('');
  const [sheetItems, setSheetItems] = useState<DetailItem[]>([]);
  const [sheetColumns, setSheetColumns] = useState<{ key: keyof DetailItem; label: string; format?: (value: any) => React.ReactNode }[]>([]);

  const { getQtyForPeriod: getModeloAtualQty, getValueForPeriod: getModeloAtualValue } = useModeloAtualMetas(startDate, endDate);
  const { getQtyForPeriod: getExpansaoQty, getValueForPeriod: getExpansaoValue } = useExpansaoMetas(startDate, endDate);
  const { getQtyForPeriod: getO2TaxQty, getValueForPeriod: getO2TaxValue } = useO2TaxMetas(startDate, endDate);
  const { getQtyForPeriod: getOxyHackerQty, getValueForPeriod: getOxyHackerValue } = useOxyHackerMetas(startDate, endDate);
  const { getLeadsQtyForPeriod } = useLeadsMetas(startDate, endDate);
  
  // Analytics hooks for drill-down
  const modeloAtualAnalytics = useModeloAtualAnalytics(startDate, endDate);
  const o2TaxAnalytics = useO2TaxAnalytics(startDate, endDate);
  const franquiaAnalytics = useExpansaoAnalytics(startDate, endDate, 'Franquia');
  const oxyHackerAnalytics = useExpansaoAnalytics(startDate, endDate, 'Oxy Hacker');
  
  // Check if we should use external database data
  const useExpansaoData = selectedBU === 'franquia';
  const useO2TaxData = selectedBU === 'o2_tax';
  const useOxyHackerData = selectedBU === 'oxy_hacker';
  const useConsolidado = selectedBU === 'all';
  
  // Get leads data (currently only available for Modelo Atual)
  const leadsQty = getLeadsQtyForPeriod(startDate, endDate);
  
  // Get totals based on selected BU - all BUs now use external db
  const totals = useConsolidado ? {
    leads: leadsQty,
    mql: getModeloAtualQty('mql', startDate, endDate) + getO2TaxQty('mql', startDate, endDate) + getOxyHackerQty('mql', startDate, endDate) + getExpansaoQty('mql', startDate, endDate),
    rm: getModeloAtualQty('rm', startDate, endDate) + getO2TaxQty('rm', startDate, endDate) + getOxyHackerQty('rm', startDate, endDate) + getExpansaoQty('rm', startDate, endDate),
    rr: getModeloAtualQty('rr', startDate, endDate) + getO2TaxQty('rr', startDate, endDate) + getOxyHackerQty('rr', startDate, endDate) + getExpansaoQty('rr', startDate, endDate),
    proposta: getModeloAtualQty('proposta', startDate, endDate) + getO2TaxQty('proposta', startDate, endDate) + getOxyHackerQty('proposta', startDate, endDate) + getExpansaoQty('proposta', startDate, endDate),
    venda: getModeloAtualQty('venda', startDate, endDate) + getO2TaxQty('venda', startDate, endDate) + getOxyHackerQty('venda', startDate, endDate) + getExpansaoQty('venda', startDate, endDate),
  } : useExpansaoData ? {
    leads: 0,
    mql: getExpansaoQty('mql', startDate, endDate),
    rm: getExpansaoQty('rm', startDate, endDate),
    rr: getExpansaoQty('rr', startDate, endDate),
    proposta: getExpansaoQty('proposta', startDate, endDate),
    venda: getExpansaoQty('venda', startDate, endDate),
  } : useO2TaxData ? {
    leads: 0,
    mql: getO2TaxQty('mql', startDate, endDate),
    rm: getO2TaxQty('rm', startDate, endDate),
    rr: getO2TaxQty('rr', startDate, endDate),
    proposta: getO2TaxQty('proposta', startDate, endDate),
    venda: getO2TaxQty('venda', startDate, endDate),
  } : useOxyHackerData ? {
    leads: 0,
    mql: getOxyHackerQty('mql', startDate, endDate),
    rm: getOxyHackerQty('rm', startDate, endDate),
    rr: getOxyHackerQty('rr', startDate, endDate),
    proposta: getOxyHackerQty('proposta', startDate, endDate),
    venda: getOxyHackerQty('venda', startDate, endDate),
  } : {
    leads: leadsQty,
    mql: getModeloAtualQty('mql', startDate, endDate),
    rm: getModeloAtualQty('rm', startDate, endDate),
    rr: getModeloAtualQty('rr', startDate, endDate),
    proposta: getModeloAtualQty('proposta', startDate, endDate),
    venda: getModeloAtualQty('venda', startDate, endDate),
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

  // Calculate monetary values
  const propostaValue = useConsolidado
    ? getModeloAtualValue('proposta', startDate, endDate) + getO2TaxValue('proposta', startDate, endDate) + getOxyHackerValue('proposta', startDate, endDate) + getExpansaoValue('proposta', startDate, endDate)
    : useExpansaoData 
      ? getExpansaoValue('proposta', startDate, endDate)
      : useO2TaxData 
        ? getO2TaxValue('proposta', startDate, endDate)
        : useOxyHackerData 
          ? getOxyHackerValue('proposta', startDate, endDate)
          : getModeloAtualValue('proposta', startDate, endDate);

  const vendaValue = useConsolidado
    ? getModeloAtualValue('venda', startDate, endDate) + getO2TaxValue('venda', startDate, endDate) + getOxyHackerValue('venda', startDate, endDate) + getExpansaoValue('venda', startDate, endDate)
    : useExpansaoData 
      ? getExpansaoValue('venda', startDate, endDate)
      : useO2TaxData 
        ? getO2TaxValue('venda', startDate, endDate)
        : useOxyHackerData 
          ? getOxyHackerValue('venda', startDate, endDate)
          : getModeloAtualValue('venda', startDate, endDate);

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
      { key: 'name', label: 'Título' },
      { key: 'company', label: 'Empresa/Contato' },
      { key: 'phase', label: 'Fase', format: columnFormatters.phase },
      { key: 'date', label: 'Data', format: columnFormatters.date },
    ];

    if (indicator === 'proposta' || indicator === 'venda') {
      return [
        ...baseColumns,
        { key: 'value' as keyof DetailItem, label: 'Valor', format: columnFormatters.currency },
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
    if (indicator === 'leads') {
      // Leads don't have individual card data
      return [];
    }

    // For Franquia
    if (useExpansaoData) {
      return franquiaAnalytics.getDetailItemsForIndicator(indicator);
    }

    // For Oxy Hacker
    if (useOxyHackerData) {
      return oxyHackerAnalytics.getDetailItemsForIndicator(indicator);
    }

    // For O2 TAX
    if (useO2TaxData) {
      // Map O2 TAX indicator names
      const o2TaxIndicatorMap: Record<string, string> = {
        'mql': 'MQL',
        'rm': 'Reunião agendada / Qualificado',
        'rr': '1° Reunião Realizada - Apresentação',
        'proposta': 'Proposta enviada / Follow Up',
        'venda': 'Ganho',
      };
      
      const phase = o2TaxIndicatorMap[indicator];
      if (!phase) return [];
      
      // Filter cards by phase
      const wonCards = o2TaxAnalytics.getDealsWon;
      
      if (indicator === 'venda') {
        return wonCards.cards.map(o2TaxAnalytics.toDetailItem);
      }
      
      // For other indicators, get from cardsByPhase
      const phaseData = o2TaxAnalytics.getCardsByPhase.find(p => p.phase === phase || 
        (indicator === 'rm' && p.phase === 'RM') ||
        (indicator === 'rr' && p.phase === 'RR') ||
        (indicator === 'proposta' && p.phase === 'Proposta')
      );
      return phaseData?.cards.map(o2TaxAnalytics.toDetailItem) ?? [];
    }

    // For Modelo Atual or Consolidado (use Modelo Atual data)
    if (selectedBU === 'modelo_atual' || useConsolidado) {
      const items = modeloAtualAnalytics.getDetailItemsForIndicator(indicator);
      
      // For consolidado, also add items from all BUs
      if (useConsolidado) {
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
    if (stage.indicator === 'leads' && stage.value === 0) {
      // No drill-down for leads without data
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
                    {index > 0 && (
                      <span className="text-white/80 text-xs flex-shrink-0">
                        ({stage.conversionPercent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {stages.slice(1).map((stage, index) => (
                <div key={stage.indicator} className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {stages[index].name} → {stage.name}:
                  </span>
                  <span className="font-medium text-foreground">
                    {stage.conversionPercent.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
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
