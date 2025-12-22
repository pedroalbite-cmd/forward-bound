import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import { Building2, DollarSign, Rocket, Users, TrendingUp } from "lucide-react";

// Quarterly totals from Goals2026Tab
const quarterlyTotals = {
  modeloAtual: { Q1: 3750000, Q2: 4500000, Q3: 6000000, Q4: 8000000 },
  o2Tax: { Q1: 412224, Q2: 587220.48, Q3: 781590.46, Q4: 1040296.90 },
  oxyHacker: { Q1: 5 * 54000, Q2: 15 * 54000, Q3: 30 * 54000, Q4: 50 * 54000 },
  franquia: { Q1: 2 * 140000, Q2: 3 * 140000, Q3: 6 * 140000, Q4: 9 * 140000 },
};

// Seasonality factors (Feb/Dec lower, Mar-Oct higher to compensate)
const seasonalityFactors = {
  Jan: 1.0,
  Fev: 0.75,
  Mar: 1.15,
  Abr: 1.05,
  Mai: 1.10,
  Jun: 1.05,
  Jul: 1.05,
  Ago: 1.10,
  Set: 1.05,
  Out: 1.10,
  Nov: 1.0,
  Dez: 0.75,
};

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const quarterMonths = {
  Q1: ["Jan", "Fev", "Mar"],
  Q2: ["Abr", "Mai", "Jun"],
  Q3: ["Jul", "Ago", "Set"],
  Q4: ["Out", "Nov", "Dez"],
};

// Calculate monthly values respecting quarterly totals and seasonality
function calculateMonthlyValues(quarterlyData: { Q1: number; Q2: number; Q3: number; Q4: number }) {
  const monthlyValues: Record<string, number> = {};

  Object.entries(quarterMonths).forEach(([quarter, monthsInQuarter]) => {
    const quarterTotal = quarterlyData[quarter as keyof typeof quarterlyData];
    const factors = monthsInQuarter.map(m => seasonalityFactors[m as keyof typeof seasonalityFactors]);
    const factorSum = factors.reduce((a, b) => a + b, 0);

    monthsInQuarter.forEach((month, index) => {
      const factor = factors[index];
      monthlyValues[month] = (quarterTotal * factor) / factorSum;
    });
  });

  return monthlyValues;
}

// For Oxy Hacker and Franquia, distribute units across months
function calculateUnitBasedMonthly(quarterlyUnits: { Q1: number; Q2: number; Q3: number; Q4: number }, unitValue: number) {
  const monthlyValues: Record<string, number> = {};

  Object.entries(quarterMonths).forEach(([quarter, monthsInQuarter]) => {
    const quarterUnits = quarterlyUnits[quarter as keyof typeof quarterlyUnits];
    const factors = monthsInQuarter.map(m => seasonalityFactors[m as keyof typeof seasonalityFactors]);
    const factorSum = factors.reduce((a, b) => a + b, 0);

    monthsInQuarter.forEach((month, index) => {
      const factor = factors[index];
      // Calculate proportional units for this month
      const monthUnits = (quarterUnits * factor) / factorSum;
      monthlyValues[month] = monthUnits * unitValue;
    });
  });

  return monthlyValues;
}

// Calculate all BU monthly values
const modeloAtualMonthly = calculateMonthlyValues(quarterlyTotals.modeloAtual);
const o2TaxMonthly = calculateMonthlyValues(quarterlyTotals.o2Tax);
const oxyHackerMonthly = calculateUnitBasedMonthly(
  { Q1: 5, Q2: 15, Q3: 30, Q4: 50 },
  54000
);
const franquiaMonthly = calculateUnitBasedMonthly(
  { Q1: 2, Q2: 3, Q3: 6, Q4: 9 },
  140000
);

// Build chart data
const chartData = months.map(month => ({
  month,
  modeloAtual: Math.round(modeloAtualMonthly[month]),
  o2Tax: Math.round(o2TaxMonthly[month]),
  oxyHacker: Math.round(oxyHackerMonthly[month]),
  franquia: Math.round(franquiaMonthly[month]),
  total: Math.round(
    modeloAtualMonthly[month] +
    o2TaxMonthly[month] +
    oxyHackerMonthly[month] +
    franquiaMonthly[month]
  ),
}));

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

const chartConfig = {
  modeloAtual: { label: "Modelo Atual", color: "hsl(var(--primary))" },
  o2Tax: { label: "O2 TAX", color: "hsl(var(--warning))" },
  oxyHacker: { label: "Oxy Hacker", color: "hsl(var(--accent))" },
  franquia: { label: "Franquia", color: "hsl(var(--secondary))" },
  total: { label: "Total", color: "hsl(var(--foreground))" },
};

interface BUTableProps {
  title: string;
  icon: React.ReactNode;
  data: Record<string, number>;
  color: string;
  total: number;
}

function BUTable({ title, icon, data, color, total }: BUTableProps) {
  const getQuarter = (month: string) => {
    if (["Jan", "Fev", "Mar"].includes(month)) return "Q1";
    if (["Abr", "Mai", "Jun"].includes(month)) return "Q2";
    if (["Jul", "Ago", "Set"].includes(month)) return "Q3";
    return "Q4";
  };

  const quarterTotals = {
    Q1: months.slice(0, 3).reduce((sum, m) => sum + data[m], 0),
    Q2: months.slice(3, 6).reduce((sum, m) => sum + data[m], 0),
    Q3: months.slice(6, 9).reduce((sum, m) => sum + data[m], 0),
    Q4: months.slice(9, 12).reduce((sum, m) => sum + data[m], 0),
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="font-display">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Mês</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Trimestre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((month, index) => {
                const quarter = getQuarter(month);
                const isQuarterEnd = [2, 5, 8, 11].includes(index);
                return (
                  <TableRow key={month} className={isQuarterEnd ? "border-b-2 border-border" : ""}>
                    <TableCell className="font-medium">
                      <Badge variant="outline" className="w-12 justify-center">{month}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-display font-semibold">
                      {formatCurrency(Math.round(data[month]))}
                    </TableCell>
                    <TableCell className="text-right">
                      {isQuarterEnd && (
                        <Badge className={`${color}`}>
                          {quarter}: {formatCompact(quarterTotals[quarter as keyof typeof quarterTotals])}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right font-display text-lg">{formatCurrency(Math.round(total))}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface BUChartProps {
  title: string;
  data: { month: string; value: number }[];
  color: string;
}

function BUChart({ title, data, color }: BUChartProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title} - Evolução Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
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
                content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function MonthlyRevenueTab() {
  const modeloAtualTotal = Object.values(modeloAtualMonthly).reduce((a, b) => a + b, 0);
  const o2TaxTotal = Object.values(o2TaxMonthly).reduce((a, b) => a + b, 0);
  const oxyHackerTotal = Object.values(oxyHackerMonthly).reduce((a, b) => a + b, 0);
  const franquiaTotal = Object.values(franquiaMonthly).reduce((a, b) => a + b, 0);
  const grandTotal = modeloAtualTotal + o2TaxTotal + oxyHackerTotal + franquiaTotal;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
        <div className="relative z-10">
          <Badge className="mb-4 bg-primary-foreground/20 text-primary-foreground border-0">
            Faturamento Mensal 2026
          </Badge>
          <h2 className="font-display text-4xl font-bold mb-4">Planejamento Mês a Mês</h2>
          <p className="text-primary-foreground/80 max-w-2xl">
            Projeção de faturamento mensal para cada BU, considerando sazonalidade (Fev/Dez reduzidos) e crescimento quarter a quarter.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary-foreground/20 text-primary-foreground border-0">
              Total: {formatCurrency(Math.round(grandTotal))}
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

        {/* Consolidated Table */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="font-display">Faturamento Mensal por BU</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Mês</TableHead>
                    <TableHead className="text-right">Modelo Atual</TableHead>
                    <TableHead className="text-right">O2 TAX</TableHead>
                    <TableHead className="text-right">Oxy Hacker</TableHead>
                    <TableHead className="text-right">Franquia</TableHead>
                    <TableHead className="text-right font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((row, index) => {
                    const isQuarterEnd = [2, 5, 8, 11].includes(index);
                    return (
                      <TableRow key={row.month} className={isQuarterEnd ? "border-b-2 border-border" : ""}>
                        <TableCell>
                          <Badge variant="outline" className="w-12 justify-center">{row.month}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.modeloAtual)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.o2Tax)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.oxyHacker)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.franquia)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right text-primary">{formatCurrency(Math.round(modeloAtualTotal))}</TableCell>
                    <TableCell className="text-right text-warning">{formatCurrency(Math.round(o2TaxTotal))}</TableCell>
                    <TableCell className="text-right text-accent">{formatCurrency(Math.round(oxyHackerTotal))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Math.round(franquiaTotal))}</TableCell>
                    <TableCell className="text-right text-lg">{formatCurrency(Math.round(grandTotal))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Stacked Area Chart */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="font-display">Evolução do Faturamento Consolidado</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientModeloAtual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="gradientO2Tax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="gradientOxyHacker" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="gradientFranquia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    tickFormatter={(value) => formatCompact(value)} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={80}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="modeloAtual"
                    name="Modelo Atual"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="url(#gradientModeloAtual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="o2Tax"
                    name="O2 TAX"
                    stackId="1"
                    stroke="hsl(var(--warning))"
                    fill="url(#gradientO2Tax)"
                  />
                  <Area
                    type="monotone"
                    dataKey="oxyHacker"
                    name="Oxy Hacker"
                    stackId="1"
                    stroke="hsl(var(--accent))"
                    fill="url(#gradientOxyHacker)"
                  />
                  <Area
                    type="monotone"
                    dataKey="franquia"
                    name="Franquia"
                    stackId="1"
                    stroke="hsl(var(--secondary))"
                    fill="url(#gradientFranquia)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Total Line Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display">Faturamento Total Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    tickFormatter={(value) => formatCompact(value)} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={80}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--foreground))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Individual BU Views */}
      <div>
        <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Visão por Unidade de Negócio
        </h3>

        {/* Modelo Atual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BUTable
            title="Modelo Atual"
            icon={<Building2 className="h-5 w-5 text-primary" />}
            data={modeloAtualMonthly}
            color="bg-primary"
            total={modeloAtualTotal}
          />
          <BUChart
            title="Modelo Atual"
            data={months.map(m => ({ month: m, value: Math.round(modeloAtualMonthly[m]) }))}
            color="hsl(var(--primary))"
          />
        </div>

        {/* O2 TAX */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BUTable
            title="O2 TAX"
            icon={<DollarSign className="h-5 w-5 text-warning" />}
            data={o2TaxMonthly}
            color="bg-warning"
            total={o2TaxTotal}
          />
          <BUChart
            title="O2 TAX"
            data={months.map(m => ({ month: m, value: Math.round(o2TaxMonthly[m]) }))}
            color="hsl(var(--warning))"
          />
        </div>

        {/* Oxy Hacker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BUTable
            title="Oxy Hacker"
            icon={<Rocket className="h-5 w-5 text-accent" />}
            data={oxyHackerMonthly}
            color="bg-accent"
            total={oxyHackerTotal}
          />
          <BUChart
            title="Oxy Hacker"
            data={months.map(m => ({ month: m, value: Math.round(oxyHackerMonthly[m]) }))}
            color="hsl(var(--accent))"
          />
        </div>

        {/* Franquia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BUTable
            title="Franquia"
            icon={<Users className="h-5 w-5 text-secondary-foreground" />}
            data={franquiaMonthly}
            color="bg-secondary"
            total={franquiaTotal}
          />
          <BUChart
            title="Franquia"
            data={months.map(m => ({ month: m, value: Math.round(franquiaMonthly[m]) }))}
            color="hsl(var(--secondary))"
          />
        </div>
      </div>
    </div>
  );
}
