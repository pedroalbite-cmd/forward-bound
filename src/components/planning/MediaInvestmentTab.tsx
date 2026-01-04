import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, Line } from "recharts";
import { Building2, DollarSign, Rocket, Users, TrendingUp, Target, Megaphone, BarChart3, Info, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaMetas } from "@/contexts/MediaMetasContext";

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

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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
  
  monthlyMetas["Jan"] = quarterlyData.Q1 * quarterWeights.Q1.Jan;
  monthlyMetas["Fev"] = quarterlyData.Q1 * quarterWeights.Q1.Fev;
  monthlyMetas["Mar"] = quarterlyData.Q1 * quarterWeights.Q1.Mar;
  
  monthlyMetas["Abr"] = quarterlyData.Q2 * quarterWeights.Q2.Abr;
  monthlyMetas["Mai"] = quarterlyData.Q2 * quarterWeights.Q2.Mai;
  monthlyMetas["Jun"] = quarterlyData.Q2 * quarterWeights.Q2.Jun;
  
  monthlyMetas["Jul"] = quarterlyData.Q3 * quarterWeights.Q3.Jul;
  monthlyMetas["Ago"] = quarterlyData.Q3 * quarterWeights.Q3.Ago;
  monthlyMetas["Set"] = quarterlyData.Q3 * quarterWeights.Q3.Set;
  
  monthlyMetas["Out"] = quarterlyData.Q4 * quarterWeights.Q4.Out;
  monthlyMetas["Nov"] = quarterlyData.Q4 * quarterWeights.Q4.Nov;
  monthlyMetas["Dez"] = quarterlyData.Q4 * quarterWeights.Q4.Dez;
  
  return monthlyMetas;
}

// Calcula MRR dinâmico e "A Vender" a partir das METAS FIXAS
// valorVenderInicial: valor fixo para janeiro, o MRR base é calculado para bater
function calculateMrrAndRevenueToSell(
  mrrInicial: number, 
  churnRate: number, 
  retencaoRate: number,
  metasMensais: Record<string, number>,
  ticketMedio: number,
  valorVenderInicial: number = 0 // Se > 0, fixa janeiro neste valor
): { mrrPorMes: Record<string, number>; vendasPorMes: Record<string, number>; revenueToSell: Record<string, number> } {
  const mrrPorMes: Record<string, number> = {};
  const vendasPorMes: Record<string, number> = {};
  const revenueToSell: Record<string, number> = {};
  
  // Se valorVenderInicial > 0, calcular o MRR base de janeiro a partir dele
  let mrrAtual = valorVenderInicial > 0 
    ? metasMensais["Jan"] - valorVenderInicial 
    : mrrInicial;
  
  let vendasMesAnterior = 0;
  
  months.forEach((month, index) => {
    if (index > 0) {
      // Aplica churn sobre o MRR base
      mrrAtual = mrrAtual * (1 - churnRate);
    }
    
    // Adiciona retenção das vendas do mês anterior
    const retencaoDoMesAnterior = vendasMesAnterior * ticketMedio * retencaoRate;
    mrrAtual = mrrAtual + retencaoDoMesAnterior;
    
    mrrPorMes[month] = mrrAtual;
    
    const metaDoMes = metasMensais[month];
    const aVender = Math.max(0, metaDoMes - mrrAtual);
    revenueToSell[month] = aVender;
    
    const vendasDoMes = aVender / ticketMedio;
    vendasPorMes[month] = vendasDoMes;
    vendasMesAnterior = vendasDoMes;
  });
  
  return { mrrPorMes, vendasPorMes, revenueToSell };
}

// Reverse funnel calculation
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

interface FunnelMetrics {
  name: string;
  ticketMedio: number;
  leadToMql: number;
  mqlToRm: number;
  rmToRr: number;
  rrToProp: number;
  propToVenda: number;
  cpmql: number;
  cprr: number;
  cac: number;
  cpv?: number;
  color: string;
  icon: React.ReactNode;
}

function calculateReverseFunnel(
  netRevenueToSell: Record<string, number>,
  metrics: FunnelMetrics,
  mrrComChurn: Record<string, number> | null = null,
  useCpv: boolean = false,
  metasMensais: Record<string, number> | null = null,
  cpvValue: number = indicators2025.cpv,
  investimentoInicialJan: number = 0
): FunnelData[] {
  let investimentoAnterior = 0;
  
  // Primeiro, calcula todos os dados originais (incluindo investimentos)
  const dadosOriginais = months.map(month => {
    const faturamentoVender = netRevenueToSell[month];
    const mrrBaseAtual = mrrComChurn ? mrrComChurn[month] : 0;
    const faturamentoMeta = metasMensais ? metasMensais[month] : (mrrBaseAtual + faturamentoVender);
    
    const vendas = faturamentoVender / metrics.ticketMedio;
    const propostas = vendas / metrics.propToVenda;
    const rrs = propostas / metrics.rrToProp;
    const rms = rrs / metrics.rmToRr;
    const mqls = rms / metrics.mqlToRm;
    const leads = mqls / metrics.leadToMql;
    
    // Calcula investimento baseado na fórmula original
    const investimentoCalculado = useCpv ? vendas * cpvValue : vendas * metrics.cac;
    
    // Garante que o investimento nunca diminua (sempre crescente ou estável)
    const investimento = Math.max(investimentoCalculado, investimentoAnterior);
    investimentoAnterior = investimento;
    
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
  
  // Desloca os investimentos em 1 mês:
  // Jan recebe o investimento de Fev, Fev recebe o de Mar, etc.
  // Isso reflete que o investimento de um mês gera resultado no mês seguinte
  return dadosOriginais.map((dados, index) => {
    // Se é janeiro e tem investimento inicial definido, recalcula vendas baseado no investimento e CPV
    if (index === 0 && investimentoInicialJan > 0) {
      const vendasIniciais = Math.ceil(investimentoInicialJan / cpvValue);
      const propostas = Math.ceil(vendasIniciais / metrics.propToVenda);
      const rrs = Math.ceil(propostas / metrics.rrToProp);
      const rms = Math.ceil(rrs / metrics.rmToRr);
      const mqls = Math.ceil(rms / metrics.mqlToRm);
      const leads = Math.ceil(mqls / metrics.leadToMql);
      
      return { 
        ...dados, 
        investimento: investimentoInicialJan,
        vendas: vendasIniciais,
        propostas,
        rrs,
        rms,
        mqls,
        leads,
      };
    }
    
    // Pega o investimento do próximo mês, ou mantém o próprio se for dezembro
    const investimentoDeslocado = index < months.length - 1 
      ? dadosOriginais[index + 1].investimento 
      : dados.investimento;
    
    return {
      ...dados,
      investimento: investimentoDeslocado,
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

// Interface para indicadores por BU
interface BUIndicators {
  ticketMedio: number;
  cpmql: number;
  cpv: number;
  mqlToRm: number;
  rmToRr: number;
  rrToProp: number;
  propToVenda: number;
}

interface BUInvestmentTableProps {
  title: string;
  icon: React.ReactNode;
  funnelData: FunnelData[];
  color: string;
  metrics: FunnelMetrics;
  showMrrBase?: boolean;
  mrrBase?: number;
  churnMensal?: number;
  retencaoVendas?: number;
  mrrFinal?: number;
}

function BUInvestmentTable({ 
  title, 
  icon, 
  funnelData, 
  color, 
  metrics, 
  showMrrBase = false, 
  mrrBase = 0,
  churnMensal = 0.06,
  retencaoVendas = 0.25,
  mrrFinal = 0
}: BUInvestmentTableProps) {
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
                CPV: {formatCurrency(metrics.cpv || indicators2025.cpv)}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                CAC: {formatCurrency(metrics.cac)}
              </Badge>
            )}
            {showMrrBase && (
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                Churn: {(churnMensal * 100).toFixed(0)}%/mês
              </Badge>
            )}
            {showMrrBase && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                Retenção: {(retencaoVendas * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>
        {showMrrBase && (
          <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>MRR Base Inicial: {formatCurrency(mrrBase)} — Churn {(churnMensal * 100).toFixed(0)}%/mês + Retenção {(retencaoVendas * 100).toFixed(0)}% das vendas</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-destructive">Churn: -{(churnMensal * 100).toFixed(0)}%/mês sobre MRR</span>
              <span>•</span>
              <span className="text-blue-600">Retenção: +{(retencaoVendas * 100).toFixed(0)}% das vendas anteriores</span>
              <span>•</span>
              <span>MRR Final (Dez): {formatCurrency(mrrFinal)}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Investimento Total</p>
            <p className="text-xl font-display font-bold text-primary">{formatCompact(totalInvestimento)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">ROI Projetado</p>
            <p className="text-xl font-display font-bold text-emerald-600">{roi.toFixed(1)}x</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">% do A Vender</p>
            <p className="text-xl font-display font-bold text-amber-600">
              {totalFaturamentoVender > 0 ? ((totalInvestimento / totalFaturamentoVender) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">% da Meta</p>
            <p className="text-xl font-display font-bold text-blue-600">
              {totalFaturamentoMeta > 0 ? ((totalInvestimento / totalFaturamentoMeta) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">CPV</p>
            <p className="text-xl font-display font-bold text-emerald-600">{formatCurrency(metrics.cpv || metrics.cac)}</p>
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
                <TableHead className="text-right min-w-[130px]">Meta</TableHead>
                {showMrrBase && <TableHead className="text-right min-w-[130px]">MRR Base</TableHead>}
                {showMrrBase && <TableHead className="text-right min-w-[130px]">A Vender</TableHead>}
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Propostas</TableHead>
                <TableHead className="text-right">RRs</TableHead>
                <TableHead className="text-right">RMs</TableHead>
                <TableHead className="text-right">MQLs</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right min-w-[120px]">Investimento</TableHead>
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
                    <TableCell className="text-right font-medium">{formatCurrency(data.faturamentoMeta)}</TableCell>
                    {showMrrBase && (
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(data.mrrBase)}</TableCell>
                    )}
                    {showMrrBase && (
                      <TableCell className="text-right text-amber-600 font-medium">{formatCurrency(data.faturamentoVender)}</TableCell>
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
                <TableCell className="text-right">{formatCurrency(totalFaturamentoMeta)}</TableCell>
                {showMrrBase && <TableCell className="text-right text-muted-foreground">—</TableCell>}
                {showMrrBase && <TableCell className="text-right text-amber-600">{formatCurrency(totalFaturamentoVender)}</TableCell>}
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

// Componente para editar indicadores de uma BU
interface BUIndicatorEditorProps {
  indicators: BUIndicators;
  onChange: (indicators: BUIndicators) => void;
  buName: string;
  buIcon: React.ReactNode;
}

function BUIndicatorEditor({ indicators, onChange, buName, buIcon }: BUIndicatorEditorProps) {
  const handleChange = (key: keyof BUIndicators, value: number) => {
    onChange({ ...indicators, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        {buIcon}
        <h4 className="font-semibold text-lg">{buName}</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Valores Monetários */}
        <div className="space-y-4">
          <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Valores</h5>
          
          <div className="space-y-2">
            <Label>Ticket Médio</Label>
            <Input
              type="number"
              value={indicators.ticketMedio}
              onChange={(e) => handleChange('ticketMedio', Number(e.target.value))}
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Custo por MQL (CPMQL)</Label>
            <Input
              type="number"
              value={indicators.cpmql}
              onChange={(e) => handleChange('cpmql', Number(e.target.value))}
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label>CPV (Custo por Venda)</Label>
            <Input
              type="number"
              value={indicators.cpv}
              onChange={(e) => handleChange('cpv', Number(e.target.value))}
              className="font-mono"
            />
          </div>
        </div>

        {/* Taxas de Conversão - Parte 1 */}
        <div className="space-y-4">
          <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Conversão (Topo)</h5>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>MQL → RM</Label>
              <span className="font-mono text-primary">{(indicators.mqlToRm * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[indicators.mqlToRm * 100]}
              onValueChange={(v) => handleChange('mqlToRm', v[0] / 100)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>RM → RR</Label>
              <span className="font-mono text-primary">{(indicators.rmToRr * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[indicators.rmToRr * 100]}
              onValueChange={(v) => handleChange('rmToRr', v[0] / 100)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Taxas de Conversão - Parte 2 */}
        <div className="space-y-4">
          <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Conversão (Fundo)</h5>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>RR → Proposta</Label>
              <span className="font-mono text-primary">{(indicators.rrToProp * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[indicators.rrToProp * 100]}
              onValueChange={(v) => handleChange('rrToProp', v[0] / 100)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Proposta → Venda</Label>
              <span className="font-mono text-primary">{(indicators.propToVenda * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[indicators.propToVenda * 100]}
              onValueChange={(v) => handleChange('propToVenda', v[0] / 100)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Resumo de conversão */}
      <div className="bg-muted/30 rounded-lg p-3 mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Conversão Total (MQL → Venda)</span>
          <span className="font-mono font-bold text-primary">
            {((indicators.mqlToRm * indicators.rmToRr * indicators.rrToProp * indicators.propToVenda) * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function MediaInvestmentTab() {
  // Estados editáveis - Taxas gerais (Modelo Atual)
  const [mrrInicial, setMrrInicial] = useState(700000);
  const [valorVenderInicial, setValorVenderInicial] = useState(400000);
  const [churnMensal, setChurnMensal] = useState(0.06);
  const [retencaoVendas, setRetencaoVendas] = useState(0.25);
  
  // Estados editáveis - O2 TAX
  const [mrrInicialO2Tax, setMrrInicialO2Tax] = useState(100000);
  const [churnMensalO2Tax, setChurnMensalO2Tax] = useState(0.04);
  const [retencaoVendasO2Tax, setRetencaoVendasO2Tax] = useState(0.30);
  
  // Estados editáveis - Metas trimestrais
  const [metasTrimestrais, setMetasTrimestrais] = useState({
    Q1: 3750000,
    Q2: 4500000,
    Q3: 6000000,
    Q4: 8000000,
  });

  // Estados editáveis - Indicadores por BU (separados Oxy Hacker e Franquia)
  const [indicadoresPorBU, setIndicadoresPorBU] = useState<{
    modeloAtual: BUIndicators;
    o2Tax: BUIndicators;
    oxyHacker: BUIndicators;
    franquia: BUIndicators;
  }>({
    modeloAtual: {
      ticketMedio: 17000,
      cpmql: 472.72,
      cpv: 6517.05,
      mqlToRm: 0.49,
      rmToRr: 0.72,
      rrToProp: 0.88,
      propToVenda: 0.24,
    },
    o2Tax: {
      ticketMedio: 15000,
      cpmql: 600,
      cpv: 2500,
      mqlToRm: 0.45,
      rmToRr: 0.65,
      rrToProp: 0.80,
      propToVenda: 0.20,
    },
    oxyHacker: {
      ticketMedio: 54000,
      cpmql: 800,
      cpv: 5000,
      mqlToRm: 0.40,
      rmToRr: 0.60,
      rrToProp: 0.75,
      propToVenda: 0.15,
    },
    franquia: {
      ticketMedio: 140000,
      cpmql: 1200,
      cpv: 12000,
      mqlToRm: 0.35,
      rmToRr: 0.55,
      rrToProp: 0.70,
      propToVenda: 0.12,
    },
  });

  const [configOpen, setConfigOpen] = useState(false);
  const [selectedBUTab, setSelectedBUTab] = useState("modeloAtual");

  // Quarterly totals para outras BUs
  const quarterlyTotalsOutrasBUs = useMemo(() => ({
    o2Tax: { Q1: 412224, Q2: 587220.48, Q3: 781590.46, Q4: 1040296.90 },
    oxyHacker: { Q1: 5 * 54000, Q2: 15 * 54000, Q3: 30 * 54000, Q4: 50 * 54000 },
    franquia: { Q1: 2 * 140000, Q2: 3 * 140000, Q3: 6 * 140000, Q4: 9 * 140000 },
  }), []);

  // Funnel metrics dinâmicos usando indicadores por BU
  const funnelMetrics = useMemo(() => ({
    modeloAtual: {
      name: "Modelo Atual",
      ticketMedio: indicadoresPorBU.modeloAtual.ticketMedio,
      leadToMql: 0.43, // Fixed for now
      mqlToRm: indicadoresPorBU.modeloAtual.mqlToRm,
      rmToRr: indicadoresPorBU.modeloAtual.rmToRr,
      rrToProp: indicadoresPorBU.modeloAtual.rrToProp,
      propToVenda: indicadoresPorBU.modeloAtual.propToVenda,
      cpmql: indicadoresPorBU.modeloAtual.cpmql,
      cprr: indicators2025.cprr,
      cac: indicators2025.cac,
      cpv: indicadoresPorBU.modeloAtual.cpv,
      color: "hsl(var(--primary))",
      icon: <Building2 className="h-5 w-5 text-primary" />,
    },
    o2Tax: {
      name: "O2 TAX",
      ticketMedio: indicadoresPorBU.o2Tax.ticketMedio,
      cpv: indicadoresPorBU.o2Tax.cpv,
      leadToMql: 0.35,
      mqlToRm: indicadoresPorBU.o2Tax.mqlToRm,
      rmToRr: indicadoresPorBU.o2Tax.rmToRr,
      rrToProp: indicadoresPorBU.o2Tax.rrToProp,
      propToVenda: indicadoresPorBU.o2Tax.propToVenda,
      cpmql: indicadoresPorBU.o2Tax.cpmql,
      cprr: 1800,
      cac: 12000,
      color: "hsl(var(--warning))",
      icon: <DollarSign className="h-5 w-5 text-warning" />,
    },
    oxyHacker: {
      name: "Oxy Hacker",
      ticketMedio: indicadoresPorBU.oxyHacker.ticketMedio,
      cpv: indicadoresPorBU.oxyHacker.cpv,
      leadToMql: 0.25,
      mqlToRm: indicadoresPorBU.oxyHacker.mqlToRm,
      rmToRr: indicadoresPorBU.oxyHacker.rmToRr,
      rrToProp: indicadoresPorBU.oxyHacker.rrToProp,
      propToVenda: indicadoresPorBU.oxyHacker.propToVenda,
      cpmql: indicadoresPorBU.oxyHacker.cpmql,
      cprr: 2500,
      cac: 18000,
      color: "hsl(var(--accent))",
      icon: <Rocket className="h-5 w-5 text-accent-foreground" />,
    },
    franquia: {
      name: "Franquia",
      ticketMedio: indicadoresPorBU.franquia.ticketMedio,
      cpv: indicadoresPorBU.franquia.cpv,
      leadToMql: 0.20,
      mqlToRm: indicadoresPorBU.franquia.mqlToRm,
      rmToRr: indicadoresPorBU.franquia.rmToRr,
      rrToProp: indicadoresPorBU.franquia.rrToProp,
      propToVenda: indicadoresPorBU.franquia.propToVenda,
      cpmql: indicadoresPorBU.franquia.cpmql,
      cprr: 4000,
      cac: 25000,
      color: "hsl(var(--secondary))",
      icon: <Users className="h-5 w-5 text-secondary-foreground" />,
    },
  }), [indicadoresPorBU]);

  // Metas mensais distribuídas (fonte da verdade: meta trimestral)
  const metasMensaisModeloAtual = useMemo(() => 
    distributeQuarterlyToMonthly(metasTrimestrais), 
    [metasTrimestrais]
  );

  // Calcula MRR dinâmico e "A Vender" a partir das metas fixas
  const mrrDynamic = useMemo(() => 
    calculateMrrAndRevenueToSell(
      mrrInicial, 
      churnMensal, 
      retencaoVendas,
      metasMensaisModeloAtual,
      indicadoresPorBU.modeloAtual.ticketMedio,
      valorVenderInicial
    ),
    [mrrInicial, churnMensal, retencaoVendas, metasMensaisModeloAtual, indicadoresPorBU.modeloAtual.ticketMedio, valorVenderInicial]
  );

  // Receitas outras BUs
  const o2TaxMonthly = useMemo(() => 
    calculateMonthlyValuesSmooth(quarterlyTotalsOutrasBUs.o2Tax, 120000), 
    [quarterlyTotalsOutrasBUs]
  );
  const oxyHackerMonthly = useMemo(() => 
    calculateFromUnits(oxyHackerUnits, 54000), 
    []
  );
  const franquiaMonthly = useMemo(() => 
    calculateFromUnits(franquiaUnits, 140000), 
    []
  );

  // Calculate funnel data for each BU
  const modeloAtualFunnel = useMemo(() => 
    calculateReverseFunnel(
      mrrDynamic.revenueToSell, 
      funnelMetrics.modeloAtual, 
      mrrDynamic.mrrPorMes, 
      true, 
      metasMensaisModeloAtual,
      indicadoresPorBU.modeloAtual.cpv
    ),
    [mrrDynamic, funnelMetrics.modeloAtual, metasMensaisModeloAtual, indicadoresPorBU.modeloAtual.cpv]
  );
  
  const o2TaxFunnel = useMemo(() => 
    calculateReverseFunnel(o2TaxMonthly, funnelMetrics.o2Tax, null, true, null, funnelMetrics.o2Tax.cpv, 10000),
    [o2TaxMonthly, funnelMetrics.o2Tax]
  );
  
  const oxyHackerFunnel = useMemo(() => 
    calculateReverseFunnel(oxyHackerMonthly, funnelMetrics.oxyHacker, null, true, null, funnelMetrics.oxyHacker.cpv, 10000),
    [oxyHackerMonthly, funnelMetrics.oxyHacker]
  );
  
  const franquiaFunnel = useMemo(() => 
    calculateReverseFunnel(franquiaMonthly, funnelMetrics.franquia, null, true, null, funnelMetrics.franquia.cpv, 10000),
    [franquiaMonthly, funnelMetrics.franquia]
  );

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

  const metaAnualTotal = metasTrimestrais.Q1 + metasTrimestrais.Q2 + metasTrimestrais.Q3 + metasTrimestrais.Q4;

  const overallROI = totalFaturamento / totalInvestimento;

  // Publish metas to context for SalesGoalsTab consumption
  const { setMetasPorBU } = useMediaMetas();
  
  useEffect(() => {
    setMetasPorBU({
      modelo_atual: Object.fromEntries(
        modeloAtualFunnel.map(d => [d.month, d.faturamentoMeta])
      ),
      o2_tax: Object.fromEntries(
        o2TaxFunnel.map(d => [d.month, d.faturamentoMeta])
      ),
      oxy_hacker: Object.fromEntries(
        oxyHackerFunnel.map(d => [d.month, d.faturamentoMeta])
      ),
      franquia: Object.fromEntries(
        franquiaFunnel.map(d => [d.month, d.faturamentoMeta])
      ),
    });
  }, [modeloAtualFunnel, o2TaxFunnel, oxyHackerFunnel, franquiaFunnel, setMetasPorBU]);

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

  const handleMetaChange = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', value: string) => {
    const numValue = parseFloat(value.replace(/\D/g, '')) || 0;
    setMetasTrimestrais(prev => ({ ...prev, [quarter]: numValue }));
  };

  const handleBUIndicatorChange = (bu: 'modeloAtual' | 'o2Tax' | 'oxyHacker' | 'franquia', indicators: BUIndicators) => {
    setIndicadoresPorBU(prev => ({ ...prev, [bu]: indicators }));
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
            Cálculo de investimento baseado em funil reverso. <strong>MRR Inicial: {formatCurrency(mrrInicial)}</strong> — investimento apenas para vender a diferença da meta mensal.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              Meta Anual: {formatCurrency(totalFaturamento)}
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              Investimento Total: {formatCurrency(totalInvestimento)}
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              ROI Médio: {overallROI.toFixed(1)}x
            </Badge>
          </div>
        </div>
      </div>

      {/* Configurações Editáveis */}
      <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
        <Card className="glass-card border-primary/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Configurações do Modelo (Clique para {configOpen ? 'ocultar' : 'editar'})
                </CardTitle>
                <Button variant="outline" size="sm">
                  {configOpen ? 'Ocultar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Metas Trimestrais */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Metas Trimestrais Modelo Atual (Total: {formatCurrency(metaAnualTotal)})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
                    <div key={quarter} className="space-y-2">
                      <Label htmlFor={quarter}>{quarter}</Label>
                      <Input
                        id={quarter}
                        type="text"
                        value={formatCurrency(metasTrimestrais[quarter]).replace('R$', '').trim()}
                        onChange={(e) => handleMetaChange(quarter, e.target.value)}
                        className="text-right font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Parâmetros Base do Modelo Atual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Parâmetros MRR (Modelo Atual)</h4>
                  
                  <div className="space-y-2">
                    <Label>MRR Inicial</Label>
                    <Input
                      type="number"
                      value={mrrInicial}
                      onChange={(e) => setMrrInicial(Number(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Valor A Vender Inicial (Jan)</Label>
                    <Input
                      type="number"
                      value={valorVenderInicial}
                      onChange={(e) => setValorVenderInicial(Number(e.target.value))}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      MRR Base Jan calculado: {formatCurrency(metasMensaisModeloAtual["Jan"] - valorVenderInicial)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Taxas de Retenção (Modelo Atual)</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Churn Mensal</Label>
                      <span className="text-sm font-mono text-primary">{(churnMensal * 100).toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[churnMensal * 100]}
                      onValueChange={(v) => setChurnMensal(v[0] / 100)}
                      max={20}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Retenção de Vendas</Label>
                      <span className="text-sm font-mono text-primary">{(retencaoVendas * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[retencaoVendas * 100]}
                      onValueChange={(v) => setRetencaoVendas(v[0] / 100)}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Parâmetros O2 TAX */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-warning" />
                  Configurações O2 TAX
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>MRR Inicial O2 TAX</Label>
                    <Input
                      type="number"
                      value={mrrInicialO2Tax}
                      onChange={(e) => setMrrInicialO2Tax(Number(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Churn Mensal</Label>
                      <span className="text-sm font-mono text-warning">{(churnMensalO2Tax * 100).toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[churnMensalO2Tax * 100]}
                      onValueChange={(v) => setChurnMensalO2Tax(v[0] / 100)}
                      max={20}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Retenção de Vendas</Label>
                      <span className="text-sm font-mono text-warning">{(retencaoVendasO2Tax * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[retencaoVendasO2Tax * 100]}
                      onValueChange={(v) => setRetencaoVendasO2Tax(v[0] / 100)}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Indicadores por BU - Tabs */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Indicadores por BU (Ticket, CPMQL, CPV, Taxas de Conversão)
                </h4>
                
                <Tabs value={selectedBUTab} onValueChange={setSelectedBUTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="modeloAtual" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Modelo Atual</span>
                    </TabsTrigger>
                    <TabsTrigger value="o2Tax" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="hidden sm:inline">O2 Tax</span>
                    </TabsTrigger>
                    <TabsTrigger value="oxyHacker" className="flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      <span className="hidden sm:inline">Oxy Hacker</span>
                    </TabsTrigger>
                    <TabsTrigger value="franquia" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Franquias</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="modeloAtual">
                    <BUIndicatorEditor
                      indicators={indicadoresPorBU.modeloAtual}
                      onChange={(ind) => handleBUIndicatorChange('modeloAtual', ind)}
                      buName="Modelo Atual"
                      buIcon={<Building2 className="h-5 w-5 text-primary" />}
                    />
                  </TabsContent>

                  <TabsContent value="o2Tax">
                    <BUIndicatorEditor
                      indicators={indicadoresPorBU.o2Tax}
                      onChange={(ind) => handleBUIndicatorChange('o2Tax', ind)}
                      buName="O2 Tax"
                      buIcon={<DollarSign className="h-5 w-5 text-warning" />}
                    />
                  </TabsContent>

                  <TabsContent value="oxyHacker">
                    <BUIndicatorEditor
                      indicators={indicadoresPorBU.oxyHacker}
                      onChange={(ind) => handleBUIndicatorChange('oxyHacker', ind)}
                      buName="Oxy Hacker"
                      buIcon={<Rocket className="h-5 w-5 text-accent-foreground" />}
                    />
                  </TabsContent>

                  <TabsContent value="franquia">
                    <BUIndicatorEditor
                      indicators={indicadoresPorBU.franquia}
                      onChange={(ind) => handleBUIndicatorChange('franquia', ind)}
                      buName="Franquias"
                      buIcon={<Users className="h-5 w-5 text-secondary-foreground" />}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
              <p className="text-xs text-muted-foreground">MRR Inicial 2026</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(mrrInicial)}</p>
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
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value, name) => {
                            const formatted = formatCurrency(Number(value));
                            return name === "total" ? <strong>{formatted}</strong> : formatted;
                          }} 
                        />
                      } 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="modeloAtual" stackId="1" stroke="hsl(var(--primary))" fill="url(#colorModeloAtual)" name="Modelo Atual" />
                    <Area type="monotone" dataKey="o2Tax" stackId="1" stroke="hsl(var(--warning))" fill="url(#colorO2Tax)" name="O2 TAX" />
                    <Area type="monotone" dataKey="oxyHacker" stackId="1" stroke="hsl(var(--accent))" fill="url(#colorOxyHacker)" name="Oxy Hacker" />
                    <Area type="monotone" dataKey="franquia" stackId="1" stroke="hsl(var(--secondary))" fill="url(#colorFranquia)" name="Franquia" />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Total" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Investment vs Return Chart with Temporal Shift */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Investimento vs Retorno (Deslocamento Temporal)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              O investimento de cada mês gera retorno no mês seguinte. Ex: Investimento de Jan gera vendas em Fev.
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={months.map((month, index) => {
                    const investimento = modeloAtualFunnel[index]?.investimento || 0;
                    // Retorno é o faturamento a vender do mês seguinte (que foi gerado pelo investimento deste mês)
                    const retornoMesSeguinte = index < months.length - 1 
                      ? modeloAtualFunnel[index + 1]?.faturamentoVender || 0
                      : modeloAtualFunnel[index]?.faturamentoVender || 0;
                    const roi = investimento > 0 ? retornoMesSeguinte / investimento : 0;
                    
                    return {
                      month,
                      investimento,
                      retorno: retornoMesSeguinte,
                      roi: roi.toFixed(2),
                    };
                  })} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorInvestimento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRetorno" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
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
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">{label}</p>
                          <p className="text-sm text-destructive">
                            Investimento: {formatCurrency(payload[0]?.value as number)}
                          </p>
                          <p className="text-sm text-emerald-600">
                            Retorno (mês seguinte): {formatCurrency(payload[1]?.value as number)}
                          </p>
                          <p className="text-sm text-primary font-semibold mt-1">
                            ROI: {payload[0]?.payload?.roi}x
                          </p>
                        </div>
                      );
                    }} 
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="investimento" 
                    stroke="hsl(var(--destructive))" 
                    fill="url(#colorInvestimento)" 
                    name="Investimento (este mês)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="retorno" 
                    stroke="hsl(var(--success))" 
                    fill="url(#colorRetorno)" 
                    name="Retorno (mês seguinte)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            {/* ROI Summary */}
            <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
              {months.slice(0, 6).map((month, index) => {
                const investimento = modeloAtualFunnel[index]?.investimento || 0;
                const retorno = index < months.length - 1 
                  ? modeloAtualFunnel[index + 1]?.faturamentoVender || 0
                  : modeloAtualFunnel[index]?.faturamentoVender || 0;
                const roi = investimento > 0 ? retorno / investimento : 0;
                
                return (
                  <div key={month} className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">{month}</p>
                    <p className="text-sm font-bold text-primary">{roi.toFixed(1)}x</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-3 md:grid-cols-6 gap-2">
              {months.slice(6).map((month, index) => {
                const realIndex = index + 6;
                const investimento = modeloAtualFunnel[realIndex]?.investimento || 0;
                const retorno = realIndex < months.length - 1 
                  ? modeloAtualFunnel[realIndex + 1]?.faturamentoVender || 0
                  : modeloAtualFunnel[realIndex]?.faturamentoVender || 0;
                const roi = investimento > 0 ? retorno / investimento : 0;
                
                return (
                  <div key={month} className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">{month}</p>
                    <p className="text-sm font-bold text-primary">{roi.toFixed(1)}x</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
                    <TableHead className="text-center">Investimento</TableHead>
                    <TableHead className="text-center">% A Vender</TableHead>
                    <TableHead className="text-center">% Meta</TableHead>
                    <TableHead className="text-center">CPV</TableHead>
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
                    // Get funnel data for this BU to calculate percentages
                    const buFunnelData = key === 'modeloAtual' ? modeloAtualFunnel :
                                        key === 'o2Tax' ? o2TaxFunnel :
                                        key === 'oxyHacker' ? oxyHackerFunnel :
                                        franquiaFunnel;
                    const totalInv = buFunnelData.reduce((sum, d) => sum + d.investimento, 0);
                    const totalAVender = buFunnelData.reduce((sum, d) => sum + d.faturamentoVender, 0);
                    const totalMeta = buFunnelData.reduce((sum, d) => sum + d.faturamentoMeta, 0);
                    const pctAVender = totalAVender > 0 ? (totalInv / totalAVender) * 100 : 0;
                    const pctMeta = totalMeta > 0 ? (totalInv / totalMeta) * 100 : 0;
                    
                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {metrics.icon}
                            {metrics.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{formatCurrency(metrics.ticketMedio)}</TableCell>
                        <TableCell className="text-center font-semibold text-primary">{formatCompact(totalInv)}</TableCell>
                        <TableCell className="text-center font-semibold text-amber-600">{pctAVender.toFixed(1)}%</TableCell>
                        <TableCell className="text-center font-semibold text-blue-600">{pctMeta.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">{formatCurrency(metrics.cpv || metrics.cac)}</TableCell>
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
            mrrBase={mrrInicial}
            churnMensal={churnMensal}
            retencaoVendas={retencaoVendas}
            mrrFinal={mrrDynamic.mrrPorMes["Dez"]}
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
