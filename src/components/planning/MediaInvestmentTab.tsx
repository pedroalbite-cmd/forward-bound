import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Building2, DollarSign, Rocket, Users, TrendingUp, Target, Megaphone, BarChart3 } from "lucide-react";

// Quarterly totals from Goals2026Tab
const quarterlyTotals = {
  modeloAtual: { Q1: 3750000, Q2: 4500000, Q3: 6000000, Q4: 8000000 },
  o2Tax: { Q1: 412224, Q2: 587220.48, Q3: 781590.46, Q4: 1040296.90 },
  oxyHacker: { Q1: 5 * 54000, Q2: 15 * 54000, Q3: 30 * 54000, Q4: 50 * 54000 },
  franquia: { Q1: 2 * 140000, Q2: 3 * 140000, Q3: 6 * 140000, Q4: 9 * 140000 },
};

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Funnel metrics per BU
const funnelMetrics = {
  modeloAtual: {
    name: "Modelo Atual",
    ticketMedio: 15000,
    leadToMql: 0.43,
    mqlToRm: 0.49,
    rmToRr: 0.72,
    rrToProp: 0.88,
    propToVenda: 0.24,
    cpl: 80,
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
    cpl: 120,
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
    cpl: 200,
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
    cpl: 350,
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

// Reverse funnel calculation
interface FunnelData {
  month: string;
  faturamento: number;
  vendas: number;
  propostas: number;
  rrs: number;
  rms: number;
  mqls: number;
  leads: number;
  investimento: number;
}

function calculateReverseFunnel(
  monthlyRevenue: Record<string, number>,
  metrics: typeof funnelMetrics.modeloAtual
): FunnelData[] {
  return months.map(month => {
    const faturamento = monthlyRevenue[month];
    const vendas = faturamento / metrics.ticketMedio;
    const propostas = vendas / metrics.propToVenda;
    const rrs = propostas / metrics.rrToProp;
    const rms = rrs / metrics.rmToRr;
    const mqls = rms / metrics.mqlToRm;
    const leads = mqls / metrics.leadToMql;
    const investimento = leads * metrics.cpl;
    
    return {
      month,
      faturamento,
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
}

function BUInvestmentTable({ title, icon, funnelData, color, metrics }: BUInvestmentTableProps) {
  const totalInvestimento = funnelData.reduce((sum, d) => sum + d.investimento, 0);
  const totalFaturamento = funnelData.reduce((sum, d) => sum + d.faturamento, 0);
  const roi = totalFaturamento / totalInvestimento;
  const totalLeads = funnelData.reduce((sum, d) => sum + d.leads, 0);
  const totalVendas = funnelData.reduce((sum, d) => sum + d.vendas, 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="font-display">{title}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              Ticket: {formatCurrency(metrics.ticketMedio)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              CPL: {formatCurrency(metrics.cpl)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Investimento Total</p>
            <p className="text-xl font-display font-bold text-primary">{formatCompact(totalInvestimento)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">ROI Projetado</p>
            <p className="text-xl font-display font-bold text-emerald-600">{roi.toFixed(1)}x</p>
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
                <TableHead className="text-right">Faturamento</TableHead>
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
                    <TableCell className="text-right font-medium">{formatCompact(data.faturamento)}</TableCell>
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
                <TableCell className="text-right">{formatCompact(totalFaturamento)}</TableCell>
                <TableCell className="text-right">{totalVendas}</TableCell>
                <TableCell className="text-right">{funnelData.reduce((s, d) => s + d.propostas, 0)}</TableCell>
                <TableCell className="text-right">{funnelData.reduce((s, d) => s + d.rrs, 0)}</TableCell>
                <TableCell className="text-right">{funnelData.reduce((s, d) => s + d.rms, 0)}</TableCell>
                <TableCell className="text-right">{funnelData.reduce((s, d) => s + d.mqls, 0)}</TableCell>
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
  const modeloAtualFunnel = calculateReverseFunnel(modeloAtualMonthly, funnelMetrics.modeloAtual);
  const o2TaxFunnel = calculateReverseFunnel(o2TaxMonthly, funnelMetrics.o2Tax);
  const oxyHackerFunnel = calculateReverseFunnel(oxyHackerMonthly, funnelMetrics.oxyHacker);
  const franquiaFunnel = calculateReverseFunnel(franquiaMonthly, funnelMetrics.franquia);

  // Calculate totals
  const totalInvestimento = 
    modeloAtualFunnel.reduce((s, d) => s + d.investimento, 0) +
    o2TaxFunnel.reduce((s, d) => s + d.investimento, 0) +
    oxyHackerFunnel.reduce((s, d) => s + d.investimento, 0) +
    franquiaFunnel.reduce((s, d) => s + d.investimento, 0);

  const totalFaturamento = 
    modeloAtualFunnel.reduce((s, d) => s + d.faturamento, 0) +
    o2TaxFunnel.reduce((s, d) => s + d.faturamento, 0) +
    oxyHackerFunnel.reduce((s, d) => s + d.faturamento, 0) +
    franquiaFunnel.reduce((s, d) => s + d.faturamento, 0);

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
            Cálculo de investimento baseado em funil reverso: partindo do faturamento desejado, calculamos leads, MQLs e investimento necessário.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              Investimento Total: {formatCurrency(totalInvestimento)}
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              ROI Médio: {overallROI.toFixed(1)}x
            </Badge>
          </div>
        </div>
      </div>

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
                    <TableHead className="text-center">CPL</TableHead>
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
                        <TableCell className="text-center">{formatCurrency(metrics.cpl)}</TableCell>
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
