import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSheetMetas } from "@/hooks/useSheetMetas";
import { useClosersMetas, CloserIndicator } from "@/hooks/useClosersMetas";
import { useExpansaoMetas, ExpansaoIndicator } from "@/hooks/useExpansaoMetas";
import { useO2TaxMetas, O2TaxIndicator } from "@/hooks/useO2TaxMetas";
import { useOxyHackerMetas, OxyHackerIndicator } from "@/hooks/useOxyHackerMetas";
import { BUType, IndicatorType } from "@/hooks/useFunnelRealized";

interface PeriodFunnelChartProps {
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

export function PeriodFunnelChart({ startDate, endDate, selectedBU }: PeriodFunnelChartProps) {
  const { getMqlsQtyForPeriod } = useSheetMetas(startDate, endDate);
  const { getQtyForPeriod: getClosersQty } = useClosersMetas(startDate, endDate);
  const { getQtyForPeriod: getExpansaoQty, getValueForPeriod: getExpansaoValue } = useExpansaoMetas(startDate, endDate);
  const { getQtyForPeriod: getO2TaxQty, getValueForPeriod: getO2TaxValue } = useO2TaxMetas(startDate, endDate);
  const { getQtyForPeriod: getOxyHackerQty, getValueForPeriod: getOxyHackerValue } = useOxyHackerMetas(startDate, endDate);
  
  // Check if we should use external database data
  const useExpansaoData = selectedBU === 'franquia';
  const useO2TaxData = selectedBU === 'o2_tax';
  const useOxyHackerData = selectedBU === 'oxy_hacker';
  
  // Ticket for Modelo Atual/Consolidado (used only for these BUs)
  const effectiveTicket = 17000;
  
  // Get totals based on selected BU
  const totals = useExpansaoData ? {
    mql: getExpansaoQty('mql', startDate, endDate),
    rm: getExpansaoQty('rm', startDate, endDate),
    rr: getExpansaoQty('rr', startDate, endDate),
    proposta: getExpansaoQty('proposta', startDate, endDate),
    venda: getExpansaoQty('venda', startDate, endDate),
  } : useO2TaxData ? {
    mql: getO2TaxQty('mql', startDate, endDate),
    rm: getO2TaxQty('rm', startDate, endDate),
    rr: getO2TaxQty('rr', startDate, endDate),
    proposta: getO2TaxQty('proposta', startDate, endDate),
    venda: getO2TaxQty('venda', startDate, endDate),
  } : useOxyHackerData ? {
    mql: getOxyHackerQty('mql', startDate, endDate),
    rm: getOxyHackerQty('rm', startDate, endDate),
    rr: getOxyHackerQty('rr', startDate, endDate),
    proposta: getOxyHackerQty('proposta', startDate, endDate),
    venda: getOxyHackerQty('venda', startDate, endDate),
  } : {
    mql: getMqlsQtyForPeriod(startDate, endDate),
    rm: getClosersQty('rm', startDate, endDate),
    rr: getClosersQty('rr', startDate, endDate),
    proposta: getClosersQty('proposta', startDate, endDate),
    venda: getClosersQty('venda', startDate, endDate),
  };

  // Calculate conversions
  const stages: FunnelStage[] = [
    { number: 1, name: 'MQL', indicator: 'mql', value: totals.mql, conversionPercent: 100 },
    { number: 2, name: 'Reuniões Agendadas', indicator: 'rm', value: totals.rm, conversionPercent: totals.mql > 0 ? (totals.rm / totals.mql) * 100 : 0 },
    { number: 3, name: 'Reunião realizada', indicator: 'rr', value: totals.rr, conversionPercent: totals.rm > 0 ? (totals.rr / totals.rm) * 100 : 0 },
    { number: 4, name: 'Proposta Enviada', indicator: 'proposta', value: totals.proposta, conversionPercent: totals.rr > 0 ? (totals.proposta / totals.rr) * 100 : 0 },
    { number: 5, name: 'Contrato Assinado', indicator: 'venda', value: totals.venda, conversionPercent: totals.proposta > 0 ? (totals.venda / totals.proposta) * 100 : 0 },
  ];

  // Calculate monetary values using real values for O2 TAX, Franquia, Oxy Hacker
  // Formula: Valor Pontual + Valor Setup + Valor MRR (1x) for each card
  const propostaValue = useExpansaoData 
    ? getExpansaoValue('proposta', startDate, endDate)
    : useO2TaxData 
      ? getO2TaxValue('proposta', startDate, endDate)
      : useOxyHackerData 
        ? getOxyHackerValue('proposta', startDate, endDate)
        : totals.proposta * effectiveTicket; // Modelo Atual/Consolidado uses fixed ticket

  const vendaValue = useExpansaoData 
    ? getExpansaoValue('venda', startDate, endDate)
    : useO2TaxData 
      ? getO2TaxValue('venda', startDate, endDate)
      : useOxyHackerData 
        ? getOxyHackerValue('venda', startDate, endDate)
        : totals.venda * effectiveTicket;

  // Width percentages for funnel visualization
  const widthPercentages = [100, 80, 60, 45, 35];

  // Colors for each stage
  const stageColors = [
    'from-emerald-400 to-cyan-500',
    'from-cyan-500 to-blue-500',
    'from-blue-500 to-blue-600',
    'from-blue-600 to-slate-500',
    'from-slate-500 to-slate-600',
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">Funil do Período</CardTitle>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Proposta Enviada</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(propostaValue)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Contratos Assinados</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(vendaValue)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col gap-1">
          {stages.map((stage, index) => (
            <div key={stage.indicator} className="relative flex items-center justify-center">
              {/* Funnel stage container */}
              <div
                className={`relative h-14 bg-gradient-to-r ${stageColors[index]} rounded-sm transition-all duration-300 flex items-center justify-center px-3 min-w-[180px] ${
                  index === stages.length - 1 ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-background' : ''
                }`}
                style={{ width: `${widthPercentages[index]}%` }}
              >
                {/* Stage content */}
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
  );
}