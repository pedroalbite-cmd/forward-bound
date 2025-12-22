import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Building2, DollarSign, Rocket, Users, TrendingUp, Target, Megaphone, BarChart3, Info } from "lucide-react";

// MRR Base - receita recorrente já existente
const MRR_BASE = 700000;

// Valor a vender inicial em Janeiro (fixo)
const VALOR_VENDER_INICIAL = 400000;

// Churn mensal de 6%
const CHURN_MENSAL = 0.06;

// Retenção de vendas: 25% das vendas do mês anterior permanecem no MRR
const RETENCAO_VENDAS = 0.25;

// Ticket médio ajustado
const TICKET_MEDIO = 17000;

// Indicadores de 2025 (base para projeção)
const indicators2025 = {
  cpmql: 472.72,
  cprr: 1347.48,
  cac: 9537.17,
  cpv: 6517.05,
  lt: 7, // lifetime em meses
  revenueChurn: 418959.46,
  revenueChurnRate: 0.19,
  logoChurn: 42,
  logoChurnRate: 0.37,
  ltvCac: 3.99,
  roi: 2.31,
  novoMrr: 883928.03,
  tcv: 13218976.08,
};

// Quarterly totals from Goals2026Tab
const quarterlyTotals = {
  modeloAtual: { Q1: 3750000, Q2: 4500000, Q3: 6000000, Q4: 8000000 },
  o2Tax: { Q1: 412224, Q2: 587220.48, Q3: 781590.46, Q4: 1040296.90 },
  oxyHacker: { Q1: 5 * 54000, Q2: 15 * 54000, Q3: 30 * 54000, Q4: 50 * 54000 },
  franquia: { Q1: 2 * 140000, Q2: 3 * 140000, Q3: 6 * 140000, Q4: 9 * 140000 },
};

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Funnel metrics per BU - atualizado com indicadores de 2025
const funnelMetrics = {
  modeloAtual: {
    name: "Modelo Atual",
    ticketMedio: TICKET_MEDIO, // R$ 17k
    leadToMql: 0.43,
    mqlToRm: 0.49,
    rmToRr: 0.72,
    rrToProp: 0.88,
    propToVenda: 0.24,
    cpmql: indicators2025.cpmql, // Custo por MQL de 2025
    cprr: indicators2025.cprr, // Custo por RR de 2025
    cac: indicators2025.cac, // CAC de 2025
    color: "hsl(var(--primary))",
    icon: <Building2 className="h-5 w-5 text-primary" />,
  },
  o2Tax: {
    name: "O2 TAX",
    ticketMedio: 50000,
    leadToMql: 0.35,
    mqlToRm: 0.45,
    rmToRr: 0.65,
    rrToProp: 0.80,
    propToVenda: 0.20,
    cpmql: 600, // Estimativa para nicho tributário
    cprr: 1800,
    cac: 12000,
    color: "hsl(var(--warning))",
    icon: <DollarSign className="h-5 w-5 text-warning" />,
  },
  oxyHacker: {
    name: "Oxy Hacker",
    ticketMedio: 54000,
    leadToMql: 0.25,
    mqlToRm: 0.40,
    rmToRr: 0.60,
    rrToProp: 0.75,
    propToVenda: 0.15,
    cpmql: 800, // Estimativa para tech/consultoria
    cprr: 2500,
    cac: 18000,
    color: "hsl(var(--accent))",
    icon: <Rocket className="h-5 w-5 text-accent-foreground" />,
  },
  franquia: {
    name: "Franquia",
    ticketMedio: 140000,
    leadToMql: 0.20,
    mqlToRm: 0.35,
    rmToRr: 0.55,
    rrToProp: 0.70,
    propToVenda: 0.18,
    cpmql: 1200, // Franquias têm CAC mais alto
    cprr: 4000,
    cac: 25000,
    color: "hsl(var(--secondary))",
    icon: <Users className="h-5 w-5 text-secondary-foreground" />,
  },
};

// Calculate smooth monthly distribution
function calculateMonthlyValuesSmooth(
  quarterlyData: { Q1: number; Q2: number; Q3: number; Q4: number },
  initialValue: number
) {
  const monthlyValues: Record<string, number> = {};
  const weights = {
    Jan: 1.00, Fev: 1.02, Mar: 1.08,
    Abr: 1.14, Mai: 1.20, Jun: 1.28,
    Jul: 1.38, Ago: 1.50, Set: 1.65,
    Out: 1.82, Nov: 2.00, Dez: 1.60,
  };
  
  const rawValues: Record<string, number> = {};
  months.forEach(month => {
    rawValues[month] = initialValue * weights[month as keyof typeof weights];
  });
  
  const scaleQuarter = (quarterMonths: string[], quarterTotal: number) => {
    const rawQuarterSum = quarterMonths.reduce((sum, m) => sum + rawValues[m], 0);
    const scale = quarterTotal / rawQuarterSum;
    quarterMonths.forEach(m => {
      monthlyValues[m] = rawValues[m] * scale;
    });
  };
  
  scaleQuarter(["Jan", "Fev", "Mar"], quarterlyData.Q1);
  scaleQuarter(["Abr", "Mai", "Jun"], quarterlyData.Q2);
  scaleQuarter(["Jul", "Ago", "Set"], quarterlyData.Q3);
  scaleQuarter(["Out", "Nov", "Dez"], quarterlyData.Q4);
  
  return monthlyValues;
}

// Unit-based calculation for Oxy Hacker and Franquia
const oxyHackerUnits: Record<string, number> = {
  Jan: 1, Fev: 2, Mar: 2,
  Abr: 5, Mai: 5, Jun: 5,
  Jul: 10, Ago: 10, Set: 10,
  Out: 15, Nov: 18, Dez: 17,
};
const franquiaUnits: Record<string, number> = {
  Jan: 0, Fev: 1, Mar: 1,
  Abr: 1, Mai: 1, Jun: 1,
  Jul: 2, Ago: 2, Set: 2,
  Out: 3, Nov: 3, Dez: 3,
};

function calculateFromUnits(units: Record<string, number>, ticketValue: number): Record<string, number> {
  const result: Record<string, number> = {};
  months.forEach(month => {
    result[month] = units[month] * ticketValue;
  });
  return result;
}

// Calculate revenue per BU per month
const modeloAtualMonthly = calculateMonthlyValuesSmooth(quarterlyTotals.modeloAtual, 1100000);
const o2TaxMonthly = calculateMonthlyValuesSmooth(quarterlyTotals.o2Tax, 120000);
const oxyHackerMonthly = calculateFromUnits(oxyHackerUnits, 54000);
const franquiaMonthly = calculateFromUnits(franquiaUnits, 140000);

// Distribui metas trimestrais em mensais proporcionalmente
function distributeQuarterlyToMonthly(
  quarterlyData: { Q1: number; Q2: number; Q3: number; Q4: number }
): Record<string, number> {
  const monthlyMetas: Record<string, number> = {};
  
  // Pesos relativos dentro de cada trimestre (crescimento proporcional)
  const quarterWeights = {
    Q1: { Jan: 0.30, Fev: 0.33, Mar: 0.37 }, // Crescimento dentro do Q1
    Q2: { Abr: 0.30, Mai: 0.33, Jun: 0.37 },
    Q3: { Jul: 0.30, Ago: 0.33, Set: 0.37 },
    Q4: { Out: 0.33, Nov: 0.37, Dez: 0.30 }, // Dez um pouco menor por sazonalidade
  };
  
  // Distribui Q1
  monthlyMetas["Jan"] = quarterlyData.Q1 * quarterWeights.Q1.Jan;
  monthlyMetas["Fev"] = quarterlyData.Q1 * quarterWeights.Q1.Fev;
  monthlyMetas["Mar"] = quarterlyData.Q1 * quarterWeights.Q1.Mar;
  
  // Distribui Q2
  monthlyMetas["Abr"] = quarterlyData.Q2 * quarterWeights.Q2.Abr;
  monthlyMetas["Mai"] = quarterlyData.Q2 * quarterWeights.Q2.Mai;
  monthlyMetas["Jun"] = quarterlyData.Q2 * quarterWeights.Q2.Jun;
  
  // Distribui Q3
  monthlyMetas["Jul"] = quarterlyData.Q3 * quarterWeights.Q3.Jul;
  monthlyMetas["Ago"] = quarterlyData.Q3 * quarterWeights.Q3.Ago;
  monthlyMetas["Set"] = quarterlyData.Q3 * quarterWeights.Q3.Set;
  
  // Distribui Q4
  monthlyMetas["Out"] = quarterlyData.Q4 * quarterWeights.Q4.Out;
  monthlyMetas["Nov"] = quarterlyData.Q4 * quarterWeights.Q4.Nov;
  monthlyMetas["Dez"] = quarterlyData.Q4 * quarterWeights.Q4.Dez;
  
  return monthlyMetas;
}

// Calcula MRR dinâmico e "A Vender" a partir das METAS FIXAS
// A Vender = Meta do Mês - MRR Base do Mês
function calculateMrrAndRevenueToSell(
  mrrInicial: number, 
  churnRate: number, 
  retencaoRate: number,
  metasMensais: Record<string, number>,
  ticketMedio: number
): { mrrPorMes: Record<string, number>; vendasPorMes: Record<string, number>; revenueToSell: Record<string, number> } {
  const mrrPorMes: Record<string, number> = {};
  const vendasPorMes: Record<string, number> = {};
  const revenueToSell: Record<string, number> = {};
  
  let mrrAtual = mrrInicial;
  let vendasMesAnterior = 0;
  
  months.forEach((month, index) => {
    // 1. Aplica churn sobre o MRR base atual (apenas a partir do 2º mês)
    if (index > 0) {
      mrrAtual = mrrAtual * (1 - churnRate);
    }
    
    // 2. Adiciona 25% das vendas do mês anterior ao MRR
    const retencaoDoMesAnterior = vendasMesAnterior * ticketMedio * retencaoRate;
    mrrAtual = mrrAtual + retencaoDoMesAnterior;
    
    // Guarda o MRR do mês
    mrrPorMes[month] = mrrAtual;
    
    // 3. Calcula "A Vender" = Meta - MRR Base
    const metaDoMes = metasMensais[month];
    const aVender = Math.max(0, metaDoMes - mrrAtual);
    revenueToSell[month] = aVender;
    
    // 4. Calcula vendas do mês atual (para usar no próximo mês)
    const vendasDoMes = aVender / ticketMedio;
    vendasPorMes[month] = vendasDoMes;
    vendasMesAnterior = vendasDoMes;
  });
  
  return { mrrPorMes, vendasPorMes, revenueToSell };
}

// Distribui as metas trimestrais em mensais (fonte da verdade: R$ 22.250.000)
const metasMensaisModeloAtual = distributeQuarterlyToMonthly(quarterlyTotals.modeloAtual);

// Calcula MRR dinâmico e "A Vender" a partir das metas fixas
const mrrDynamic = calculateMrrAndRevenueToSell(
  MRR_BASE, 
  CHURN_MENSAL, 
  RETENCAO_VENDAS,
  metasMensaisModeloAtual,
  TICKET_MEDIO
);

// MRR após churn + retenção para cada mês
const mrrAposChurn = mrrDynamic.mrrPorMes;

// Receita líquida a vender para Modelo Atual (derivada das metas)
const modeloAtualNetToSell = mrrDynamic.revenueToSell;

// Reverse funnel calculation - usando CPV (custo por venda) como base de investimento
interface FunnelData {
  month: string;
  faturamentoMeta: number;
  faturamentoVender: number;
  mrrBase: number;
  vendas: number;
  propostas: number;
  rrs: number;
  rms: number;
  mqls: number;
  leads: number;
  investimento: number;
}

function calculateReverseFunnel(
  netRevenueToSell: Record<string, number>,
  metrics: typeof funnelMetrics.modeloAtual,
  mrrComChurn: Record<string, number> | null = null,
  useCpv: boolean = false,
  metasMensais: Record<string, number> | null = null // Metas fixas opcionais
): FunnelData[] {
  return months.map(month => {
    const faturamentoVender = netRevenueToSell[month];
    const mrrBaseAtual = mrrComChurn ? mrrComChurn[month] : 0;
    // Se temos metas fixas, usa elas; senão calcula MRR + A Vender
    const faturamentoMeta = metasMensais ? metasMensais[month] : (mrrBaseAtual + faturamentoVender);
    
    const vendas = faturamentoVender / metrics.ticketMedio;
    const propostas = vendas / metrics.propToVenda;
    const rrs = propostas / metrics.rrToProp;
    const rms = rrs / metrics.rmToRr;
    const mqls = rms / metrics.mqlToRm;
    const leads = mqls / metrics.leadToMql;
    // Investimento baseado em CPV (custo por venda) para Modelo Atual, ou CAC para outras BUs
    const investimento = useCpv ? vendas * indicators2025.cpv : vendas * metrics.cac;
    
    return {
      month,
      faturamentoMeta,
      faturamentoVender,
      mrrBase: mrrBaseAtual,
      vendas: Math.ceil(vendas),
      propostas: Math.ceil(propostas),
      rrs: Math.ceil(rrs),
      rms: Math.ceil(rms),
      mqls: Math.ceil(mqls),
      leads: Math.ceil(leads),
      investimento: Math.round(investimento),
    };
  });
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCompact = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return formatCurrency(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

const chartConfig = {
  modeloAtual: { label: "Modelo Atual", color: "hsl(var(--primary))" },
  o2Tax: { label: "O2 TAX", color: "hsl(var(--warning))" },
  oxyHacker: { label: "Oxy Hacker", color: "hsl(var(--accent))" },
  franquia: { label: "Franquia", color: "hsl(var(--secondary))" },
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
];

interface BUInvestmentTableProps {
  title: string;
  icon: React.ReactNode;
  funnelData: FunnelData[];
  color: string;
  metrics: typeof funnelMetrics.modeloAtual;
  showMrrBase?: boolean;
  mrrBase?: number;
}

function BUInvestmentTable({ title, icon, funnelData, color, metrics, showMrrBase = false, mrrBase = 0 }: BUInvestmentTableProps) {
  const totalInvestimento = funnelData.reduce((sum, d) => sum + d.investimento, 0);
  const totalFaturamentoMeta = funnelData.reduce((sum, d) => sum + d.faturamentoMeta, 0);
  const totalFaturamentoVender = funnelData.reduce((sum, d) => sum + d.faturamentoVender, 0);
  const roi = totalFaturamentoVender / totalInvestimento;
  const totalLeads = funnelData.reduce((sum, d) => sum + d.leads, 0);
  const totalVendas = funnelData.reduce((sum, d) => sum + d.vendas, 0);
  const totalMqls = funnelData.reduce((sum, d) => sum + d.mqls, 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="font-display">{title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              Ticket: {formatCurrency(metrics.ticketMedio)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              CPMQL: {formatCurrency(metrics.cpmql)}
            </Badge>
            {showMrrBase ? (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                CPV: {formatCurrency(indicators2025.cpv)}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                CAC: {formatCurrency(metrics.cac)}
              </Badge>
            )}
            {showMrrBase && (
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                Churn: {(CHURN_MENSAL * 100).toFixed(0)}%/mês
              </Badge>
            )}
            {showMrrBase && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                Retenção: {(RETENCAO_VENDAS * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>
        {showMrrBase && (
          <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>MRR Base Inicial: {formatCurrency(mrrBase)} — Churn {(CHURN_MENSAL * 100).toFixed(0)}%/mês + Retenção {(RETENCAO_VENDAS * 100).toFixed(0)}% das vendas</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-destructive">Churn: -{(CHURN_MENSAL * 100).toFixed(0)}%/mês sobre MRR</span>
              <span>•</span>
              <span className="text-blue-600">Retenção: +{(RETENCAO_VENDAS * 100).toFixed(0)}% das vendas anteriores</span>
              <span>•</span>
              <span>MRR Final (Dez): {formatCurrency(mrrAposChurn["Dez"])}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Investimento Total</p>
            <p className="text-xl font-display font-bold text-primary">{formatCompact(totalInvestimento)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">ROI Projetado</p>
            <p className="text-xl font-display font-bold text-emerald-600">{roi.toFixed(1)}x</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">MQLs Necessários</p>
            <p className="text-xl font-display font-bold">{formatNumber(totalMqls)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Leads Necessários</p>
            <p className="text-xl font-display font-bold">{formatNumber(totalLeads)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Vendas Previstas</p>
            <p className="text-xl font-display font-bold">{formatNumber(totalVendas)}</p>
          </div>
        </div>

        {/* Monthly Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Mês</TableHead>
                <TableHead className="text-right">Meta</TableHead>
                {showMrrBase && <TableHead className="text-right">MRR Base</TableHead>}
                {showMrrBase && <TableHead className="text-right">A Vender</TableHead>}
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Propostas</TableHead>
                <TableHead className="text-right">RRs</TableHead>
                <TableHead className="text-right">RMs</TableHead>
                <TableHead className="text-right">MQLs</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnelData.map((data, index) => {
                const isQuarterEnd = [2, 5, 8, 11].includes(index);
                return (
                  <TableRow key={data.month} className={isQuarterEnd ? "border-b-2 border-border" : ""}>
                    <TableCell>
                      <Badge variant="outline" className="w-12 justify-center">{data.month}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCompact(data.faturamentoMeta)}</TableCell>
                    {showMrrBase && (
                      <TableCell className="text-right text-muted-foreground">{formatCompact(data.mrrBase)}</TableCell>
                    )}
                    {showMrrBase && (
                      <TableCell className="text-right text-amber-600 font-medium">{formatCompact(data.faturamentoVender)}</TableCell>
                    )}
                    <TableCell className="text-right">{data.vendas}</TableCell>
                    <TableCell className="text-right">{data.propostas}</TableCell>
                    <TableCell className="text-right">{data.rrs}</TableCell>
                    <TableCell className="text-right">{data.rms}</TableCell>
                    <TableCell className="text-right">{data.mqls}</TableCell>
                    <TableCell className="text-right">{formatNumber(data.leads)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatCurrency(data.investimento)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{formatCompact(totalFaturamentoMeta)}</TableCell>
                {showMrrBase && <TableCell className="text-right text-muted-foreground">—</TableCell>}
                {showMrrBase && <TableCell className="text-right text-amber-600">{formatCompact(totalFaturamentoVender)}</TableCell>}
                <TableCell className="text-right">{totalVendas}</TableCell>
                <TableCell className="text-right">{funnelData.reduce((s, d) => s + d.propostas, 0)}</TableCell>
                <TableCell className="text-right">{funnelData.reduce((s, d) => s + d.rrs, 0)}</TableCell>
                <TableCell className="text-right">{funnelData.reduce((s, d) => s + d.rms, 0)}</TableCell>
                <TableCell className="text-right">{totalMqls}</TableCell>
                <TableCell className="text-right">{formatNumber(totalLeads)}</TableCell>
                <TableCell className="text-right text-lg text-primary">{formatCurrency(totalInvestimento)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function MediaInvestmentTab() {
  // Calculate funnel data for each BU
  // Modelo Atual usa MRR base com churn, CPV para investimento, e METAS FIXAS (R$ 22.250.000)
  const modeloAtualFunnel = calculateReverseFunnel(modeloAtualNetToSell, funnelMetrics.modeloAtual, mrrAposChurn, true, metasMensaisModeloAtual);
  // Outras BUs não têm MRR base, usam CAC - passam o próprio faturamento como "a vender"
  const o2TaxFunnel = calculateReverseFunnel(o2TaxMonthly, funnelMetrics.o2Tax, null, false, null);
  const oxyHackerFunnel = calculateReverseFunnel(oxyHackerMonthly, funnelMetrics.oxyHacker, null, false, null);
  const franquiaFunnel = calculateReverseFunnel(franquiaMonthly, funnelMetrics.franquia, null, false, null);

  // Calculate totals
  const totalInvestimento = 
    modeloAtualFunnel.reduce((s, d) => s + d.investimento, 0) +
    o2TaxFunnel.reduce((s, d) => s + d.investimento, 0) +
    oxyHackerFunnel.reduce((s, d) => s + d.investimento, 0) +
    franquiaFunnel.reduce((s, d) => s + d.investimento, 0);

  const totalFaturamento = 
    modeloAtualFunnel.reduce((s, d) => s + d.faturamentoMeta, 0) +
    o2TaxFunnel.reduce((s, d) => s + d.faturamentoMeta, 0) +
    oxyHackerFunnel.reduce((s, d) => s + d.faturamentoMeta, 0) +
    franquiaFunnel.reduce((s, d) => s + d.faturamentoMeta, 0);

  const overallROI = totalFaturamento / totalInvestimento;

  // Chart data for stacked area
  const investmentChartData = months.map((month, index) => ({
    month,
    modeloAtual: modeloAtualFunnel[index].investimento,
    o2Tax: o2TaxFunnel[index].investimento,
    oxyHacker: oxyHackerFunnel[index].investimento,
    franquia: franquiaFunnel[index].investimento,
    total: modeloAtualFunnel[index].investimento + o2TaxFunnel[index].investimento + 
           oxyHackerFunnel[index].investimento + franquiaFunnel[index].investimento,
  }));

  // Pie chart data
  const pieData = [
    { name: "Modelo Atual", value: modeloAtualFunnel.reduce((s, d) => s + d.investimento, 0) },
    { name: "O2 TAX", value: o2TaxFunnel.reduce((s, d) => s + d.investimento, 0) },
    { name: "Oxy Hacker", value: oxyHackerFunnel.reduce((s, d) => s + d.investimento, 0) },
    { name: "Franquia", value: franquiaFunnel.reduce((s, d) => s + d.investimento, 0) },
  ];

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="hsl(var(--foreground))" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {name} ({(percent * 100).toFixed(1)}%)
      </text>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
        <div className="relative z-10">
          <Badge className="mb-4 bg-primary-foreground/20 text-primary-foreground border-0">
            <Megaphone className="h-3 w-3 mr-1" />
            Investimento em Mídia 2026
          </Badge>
          <h2 className="font-display text-4xl font-bold mb-4">Planejamento de Mídia</h2>
          <p className="text-primary-foreground/80 max-w-2xl">
            Cálculo de investimento baseado em funil reverso. <strong>MRR Base: {formatCurrency(MRR_BASE)}</strong> — investimento apenas para vender a diferença da meta mensal.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              Investimento Total: {formatCurrency(totalInvestimento)}
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              ROI Médio: {overallROI.toFixed(1)}x
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              MRR Base: {formatCurrency(MRR_BASE)}
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              Churn: {(CHURN_MENSAL * 100).toFixed(0)}%/mês
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              Ticket: {formatCurrency(TICKET_MEDIO)}
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              CPV: {formatCurrency(indicators2025.cpv)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Indicadores 2025 - Referência */}
      <Card className="glass-card border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Info className="h-5 w-5 text-amber-500" />
            Indicadores de Referência 2025 (Modelo Atual)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">CPMQL</p>
              <p className="text-lg font-bold">{formatCurrency(indicators2025.cpmql)}</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">CPRR</p>
              <p className="text-lg font-bold">{formatCurrency(indicators2025.cprr)}</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">CAC</p>
              <p className="text-lg font-bold">{formatCurrency(indicators2025.cac)}</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">CPV</p>
              <p className="text-lg font-bold">{formatCurrency(indicators2025.cpv)}</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">LT (meses)</p>
              <p className="text-lg font-bold">{indicators2025.lt}</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">LTV/CAC</p>
              <p className="text-lg font-bold">{indicators2025.ltvCac.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">ROI</p>
              <p className="text-lg font-bold">{indicators2025.roi.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Revenue Churn</p>
              <p className="text-lg font-bold text-destructive">{(indicators2025.revenueChurnRate * 100).toFixed(0)}%</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Logo Churn</p>
              <p className="text-lg font-bold text-destructive">{(indicators2025.logoChurnRate * 100).toFixed(0)}%</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Novo MRR 2025</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(indicators2025.novoMrr)}</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">TCV 2025</p>
              <p className="text-lg font-bold">{formatCompact(indicators2025.tcv)}</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground">MRR Base 2026</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(MRR_BASE)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consolidated View */}
      <div>
        <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Visão Consolidada
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Investment Distribution Pie */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display">Distribuição de Investimento por BU</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={renderCustomizedLabel}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Stacked Area Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display">Investimento Mensal por BU</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={investmentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorModeloAtual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorO2Tax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorOxyHacker" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorFranquia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      tickFormatter={(value) => formatCompact(value)} 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={80}
                    />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                    <Legend />
                    <Area type="monotone" dataKey="modeloAtual" stackId="1" stroke="hsl(var(--primary))" fill="url(#colorModeloAtual)" name="Modelo Atual" />
                    <Area type="monotone" dataKey="o2Tax" stackId="1" stroke="hsl(var(--warning))" fill="url(#colorO2Tax)" name="O2 TAX" />
                    <Area type="monotone" dataKey="oxyHacker" stackId="1" stroke="hsl(var(--accent))" fill="url(#colorOxyHacker)" name="Oxy Hacker" />
                    <Area type="monotone" dataKey="franquia" stackId="1" stroke="hsl(var(--secondary))" fill="url(#colorFranquia)" name="Franquia" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Funnel Metrics Comparison */}
      <div>
        <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Métricas do Funil por BU
        </h3>

        <Card className="glass-card mb-8">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BU</TableHead>
                    <TableHead className="text-center">Ticket Médio</TableHead>
                    <TableHead className="text-center">CPMQL</TableHead>
                    <TableHead className="text-center">CPRR</TableHead>
                    <TableHead className="text-center">CAC</TableHead>
                    <TableHead className="text-center">Lead→MQL</TableHead>
                    <TableHead className="text-center">MQL→RM</TableHead>
                    <TableHead className="text-center">RM→RR</TableHead>
                    <TableHead className="text-center">RR→Prop</TableHead>
                    <TableHead className="text-center">Prop→Venda</TableHead>
                    <TableHead className="text-center">MQL→Venda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(funnelMetrics).map(([key, metrics]) => {
                    const mqlToVenda = metrics.mqlToRm * metrics.rmToRr * metrics.rrToProp * metrics.propToVenda;
                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {metrics.icon}
                            {metrics.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{formatCurrency(metrics.ticketMedio)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(metrics.cpmql)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(metrics.cprr)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(metrics.cac)}</TableCell>
                        <TableCell className="text-center">{(metrics.leadToMql * 100).toFixed(0)}%</TableCell>
                        <TableCell className="text-center">{(metrics.mqlToRm * 100).toFixed(0)}%</TableCell>
                        <TableCell className="text-center">{(metrics.rmToRr * 100).toFixed(0)}%</TableCell>
                        <TableCell className="text-center">{(metrics.rrToProp * 100).toFixed(0)}%</TableCell>
                        <TableCell className="text-center">{(metrics.propToVenda * 100).toFixed(0)}%</TableCell>
                        <TableCell className="text-center font-semibold text-primary">{(mqlToVenda * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BU Detail Tables */}
      <div>
        <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Detalhamento por BU
        </h3>

        <div className="space-y-8">
          <BUInvestmentTable
            title="Modelo Atual"
            icon={funnelMetrics.modeloAtual.icon}
            funnelData={modeloAtualFunnel}
            color={funnelMetrics.modeloAtual.color}
            metrics={funnelMetrics.modeloAtual}
            showMrrBase={true}
            mrrBase={MRR_BASE}
          />

          <BUInvestmentTable
            title="O2 TAX"
            icon={funnelMetrics.o2Tax.icon}
            funnelData={o2TaxFunnel}
            color={funnelMetrics.o2Tax.color}
            metrics={funnelMetrics.o2Tax}
          />

          <BUInvestmentTable
            title="Oxy Hacker"
            icon={funnelMetrics.oxyHacker.icon}
            funnelData={oxyHackerFunnel}
            color={funnelMetrics.oxyHacker.color}
            metrics={funnelMetrics.oxyHacker}
          />

          <BUInvestmentTable
            title="Franquia"
            icon={funnelMetrics.franquia.icon}
            funnelData={franquiaFunnel}
            color={funnelMetrics.franquia.color}
            metrics={funnelMetrics.franquia}
          />
        </div>
      </div>
    </div>
  );
}
