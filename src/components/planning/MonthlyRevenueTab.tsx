import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, Legend, PieChart, Pie, Cell } from "recharts";
import { Building2, DollarSign, Rocket, Users, TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";

// Quarterly totals from Goals2026Tab
const quarterlyTotals = {
  modeloAtual: { Q1: 3750000, Q2: 4500000, Q3: 6000000, Q4: 8000000 },
  o2Tax: { Q1: 412224, Q2: 587220.48, Q3: 781590.46, Q4: 1040296.90 },
  oxyHacker: { Q1: 5 * 54000, Q2: 15 * 54000, Q3: 30 * 54000, Q4: 50 * 54000 },
  franquia: { Q1: 2 * 140000, Q2: 3 * 140000, Q3: 6 * 140000, Q4: 9 * 140000 },
};

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const quarterMonths = {
  Q1: ["Jan", "Fev", "Mar"],
  Q2: ["Abr", "Mai", "Jun"],
  Q3: ["Jul", "Ago", "Set"],
  Q4: ["Out", "Nov", "Dez"],
};

// Calculate monthly values with smooth growth, respecting quarterly totals
// Starting from initialValue, with Feb/Dec reduced (~75%), and gradual increase through the year
function calculateMonthlyValuesSmooth(
  quarterlyData: { Q1: number; Q2: number; Q3: number; Q4: number },
  initialValue: number
) {
  const monthlyValues: Record<string, number> = {};
  const yearlyTotal = quarterlyData.Q1 + quarterlyData.Q2 + quarterlyData.Q3 + quarterlyData.Q4;
  
  // Define relative weights for smooth growth with seasonal adjustments
  // Jan=base, Feb/Dec reduced, rest grows gradually
  const rawWeights = {
    Jan: initialValue,
    Fev: initialValue * 0.91, // Reduced (about 75% of expected trend)
    Mar: 0, // Will be calculated to complete Q1
    Abr: 0, Mai: 0, Jun: 0, // Q2
    Jul: 0, Ago: 0, Set: 0, // Q3
    Out: 0, Nov: 0, Dez: 0, // Q4
  };
  
  // Calculate Mar to complete Q1
  rawWeights.Mar = quarterlyData.Q1 - rawWeights.Jan - rawWeights.Fev;
  
  // Calculate Q2 with gradual growth from Mar
  const q2Avg = quarterlyData.Q2 / 3;
  const marValue = rawWeights.Mar;
  // Start Q2 slightly above Mar, grow gradually
  rawWeights.Abr = marValue * 0.85; // Start Q2 a bit lower than Mar end
  rawWeights.Mai = rawWeights.Abr * 1.07; // +7%
  rawWeights.Jun = quarterlyData.Q2 - rawWeights.Abr - rawWeights.Mai; // Complete Q2
  
  // Calculate Q3 with gradual growth
  rawWeights.Jul = rawWeights.Jun * 1.08; // +8% from Jun
  rawWeights.Ago = rawWeights.Jul * 1.11; // +11%
  rawWeights.Set = quarterlyData.Q3 - rawWeights.Jul - rawWeights.Ago; // Complete Q3
  
  // Calculate Q4 with gradual growth and reduced Dec
  const q4Target = quarterlyData.Q4;
  rawWeights.Out = rawWeights.Set * 1.12; // +12% from Set
  rawWeights.Nov = rawWeights.Out * 1.15; // +15% 
  rawWeights.Dez = q4Target - rawWeights.Out - rawWeights.Nov; // Reduced Dec
  
  // Assign values
  months.forEach(month => {
    monthlyValues[month] = rawWeights[month as keyof typeof rawWeights];
  });
  
  return monthlyValues;
}

// For Oxy Hacker and Franquia, distribute units with gradual growth
function calculateUnitBasedMonthlySmooth(
  quarterlyUnits: { Q1: number; Q2: number; Q3: number; Q4: number },
  unitValue: number
) {
  const monthlyValues: Record<string, number> = {};
  
  // Distribute units within each quarter with gradual growth and Feb/Dec reduction
  const distributeQuarter = (quarterUnits: number, quarterKey: string): number[] => {
    if (quarterKey === "Q1") {
      // Jan normal, Feb reduced, Mar compensates
      const jan = quarterUnits * 0.34;
      const fev = quarterUnits * 0.26; // Reduced
      const mar = quarterUnits - jan - fev;
      return [jan, fev, mar];
    } else if (quarterKey === "Q4") {
      // Oct/Nov grow, Dec reduced
      const out = quarterUnits * 0.35;
      const nov = quarterUnits * 0.40;
      const dez = quarterUnits - out - nov; // Reduced
      return [out, nov, dez];
    } else {
      // Q2/Q3: gradual growth within quarter
      const first = quarterUnits * 0.30;
      const second = quarterUnits * 0.33;
      const third = quarterUnits - first - second;
      return [first, second, third];
    }
  };
  
  const q1Dist = distributeQuarter(quarterlyUnits.Q1, "Q1");
  const q2Dist = distributeQuarter(quarterlyUnits.Q2, "Q2");
  const q3Dist = distributeQuarter(quarterlyUnits.Q3, "Q3");
  const q4Dist = distributeQuarter(quarterlyUnits.Q4, "Q4");
  
  const allDist = [...q1Dist, ...q2Dist, ...q3Dist, ...q4Dist];
  
  months.forEach((month, index) => {
    monthlyValues[month] = allDist[index] * unitValue;
  });
  
  return monthlyValues;
}

// Calculate all BU monthly values with smooth distribution
// Modelo Atual: starts at R$ 1.1M
const modeloAtualMonthly = calculateMonthlyValuesSmooth(quarterlyTotals.modeloAtual, 1100000);

// O2 TAX: proportional distribution based on quarterly growth
const o2TaxMonthly = calculateMonthlyValuesSmooth(quarterlyTotals.o2Tax, 120000);

// Oxy Hacker: unit-based with gradual growth
const oxyHackerMonthly = calculateUnitBasedMonthlySmooth(
  { Q1: 5, Q2: 15, Q3: 30, Q4: 50 },
  54000
);

// Franquia: unit-based with gradual growth
const franquiaMonthly = calculateUnitBasedMonthlySmooth(
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

// Calculate MoM variation
function getMoMVariation(monthIndex: number, data: Record<string, number>): number | null {
  if (monthIndex === 0) return null;
  const currentMonth = months[monthIndex];
  const prevMonth = months[monthIndex - 1];
  const variation = ((data[currentMonth] - data[prevMonth]) / data[prevMonth]) * 100;
  return variation;
}

// Calculate QoQ variation
function getQoQVariation(quarter: string, quarterTotals: Record<string, number>): number | null {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const qIndex = quarters.indexOf(quarter);
  if (qIndex === 0) return null;
  const prevQ = quarters[qIndex - 1];
  const variation = ((quarterTotals[quarter] - quarterTotals[prevQ]) / quarterTotals[prevQ]) * 100;
  return variation;
}

// Variation Badge Component
function VariationBadge({ variation, showIcon = true }: { variation: number | null; showIcon?: boolean }) {
  if (variation === null) return <span className="text-muted-foreground text-xs">-</span>;
  
  const isPositive = variation > 0;
  const isNeutral = Math.abs(variation) < 0.5;
  
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      isNeutral ? "text-muted-foreground" : isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
    }`}>
      {showIcon && (
        isNeutral ? <Minus className="h-3 w-3" /> : 
        isPositive ? <ArrowUp className="h-3 w-3" /> : 
        <ArrowDown className="h-3 w-3" />
      )}
      {isPositive && "+"}{variation.toFixed(1)}%
    </span>
  );
}

const chartConfig = {
  modeloAtual: { label: "Modelo Atual", color: "hsl(var(--primary))" },
  o2Tax: { label: "O2 TAX", color: "hsl(var(--warning))" },
  oxyHacker: { label: "Oxy Hacker", color: "hsl(var(--accent))" },
  franquia: { label: "Franquia", color: "hsl(var(--secondary))" },
  total: { label: "Total", color: "hsl(var(--foreground))" },
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
];

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

  const quarterTotalsCalc = {
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
                <TableHead className="w-16">Mês</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right w-20">Var. MoM</TableHead>
                <TableHead className="text-right">Trimestre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((month, index) => {
                const quarter = getQuarter(month);
                const isQuarterEnd = [2, 5, 8, 11].includes(index);
                const momVariation = getMoMVariation(index, data);
                const qoqVariation = isQuarterEnd ? getQoQVariation(quarter, quarterTotalsCalc) : null;
                
                return (
                  <TableRow key={month} className={isQuarterEnd ? "border-b-2 border-border" : ""}>
                    <TableCell className="font-medium">
                      <Badge variant="outline" className="w-12 justify-center">{month}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-display font-semibold">
                      {formatCurrency(Math.round(data[month]))}
                    </TableCell>
                    <TableCell className="text-right">
                      <VariationBadge variation={momVariation} />
                    </TableCell>
                    <TableCell className="text-right">
                      {isQuarterEnd && (
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`${color}`}>
                            {quarter}: {formatCompact(quarterTotalsCalc[quarter as keyof typeof quarterTotalsCalc])}
                          </Badge>
                          {qoqVariation !== null && (
                            <span className="text-xs text-muted-foreground">
                              vs {quarter === "Q2" ? "Q1" : quarter === "Q3" ? "Q2" : "Q3"}: <VariationBadge variation={qoqVariation} showIcon={false} />
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right font-display text-lg">{formatCurrency(Math.round(total))}</TableCell>
                <TableCell></TableCell>
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

export function MonthlyRevenueTab() {
  const modeloAtualTotal = Object.values(modeloAtualMonthly).reduce((a, b) => a + b, 0);
  const o2TaxTotal = Object.values(o2TaxMonthly).reduce((a, b) => a + b, 0);
  const oxyHackerTotal = Object.values(oxyHackerMonthly).reduce((a, b) => a + b, 0);
  const franquiaTotal = Object.values(franquiaMonthly).reduce((a, b) => a + b, 0);
  const grandTotal = modeloAtualTotal + o2TaxTotal + oxyHackerTotal + franquiaTotal;

  // Data for pie chart
  const pieData = [
    { name: "Modelo Atual", value: modeloAtualTotal },
    { name: "O2 TAX", value: o2TaxTotal },
    { name: "Oxy Hacker", value: oxyHackerTotal },
    { name: "Franquia", value: franquiaTotal },
  ];

  // Calculate consolidated MoM variation
  const getConsolidatedMoM = (monthIndex: number) => {
    if (monthIndex === 0) return null;
    const currentTotal = chartData[monthIndex].total;
    const prevTotal = chartData[monthIndex - 1].total;
    return ((currentTotal - prevTotal) / prevTotal) * 100;
  };

  // Calculate quarterly totals for consolidated view
  const consolidatedQuarterTotals = {
    Q1: chartData.slice(0, 3).reduce((sum, d) => sum + d.total, 0),
    Q2: chartData.slice(3, 6).reduce((sum, d) => sum + d.total, 0),
    Q3: chartData.slice(6, 9).reduce((sum, d) => sum + d.total, 0),
    Q4: chartData.slice(9, 12).reduce((sum, d) => sum + d.total, 0),
  };

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

        {/* Pie Chart - BU Participation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display">Participação por BU</CardTitle>
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
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <span>
                              {name}: {formatCurrency(Number(value))} ({((Number(value) / grandTotal) * 100).toFixed(1)}%)
                            </span>
                          )}
                        />
                      }
                    />
                    {/* Center text */}
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                      <tspan x="50%" dy="-0.5em" className="text-lg font-bold fill-foreground">Total</tspan>
                      <tspan x="50%" dy="1.4em" className="text-sm fill-muted-foreground">{formatCompact(grandTotal)}</tspan>
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display">Resumo por BU</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pieData.map((bu, index) => (
                <div key={bu.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[index] }}
                    />
                    <span className="font-medium">{bu.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold">{formatCurrency(Math.round(bu.value))}</p>
                    <p className="text-xs text-muted-foreground">
                      {((bu.value / grandTotal) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

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
                    <TableHead className="w-16">Mês</TableHead>
                    <TableHead className="text-right">Modelo Atual</TableHead>
                    <TableHead className="text-right">O2 TAX</TableHead>
                    <TableHead className="text-right">Oxy Hacker</TableHead>
                    <TableHead className="text-right">Franquia</TableHead>
                    <TableHead className="text-right font-bold">Total</TableHead>
                    <TableHead className="text-right w-20">Var. MoM</TableHead>
                    <TableHead className="text-right">Trimestre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((row, index) => {
                    const isQuarterEnd = [2, 5, 8, 11].includes(index);
                    const quarter = isQuarterEnd ? (index === 2 ? "Q1" : index === 5 ? "Q2" : index === 8 ? "Q3" : "Q4") : null;
                    const momVariation = getConsolidatedMoM(index);
                    const qoqVariation = quarter ? getQoQVariation(quarter, consolidatedQuarterTotals) : null;
                    
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
                        <TableCell className="text-right">
                          <VariationBadge variation={momVariation} />
                        </TableCell>
                        <TableCell className="text-right">
                          {isQuarterEnd && quarter && (
                            <div className="flex flex-col items-end gap-1">
                              <Badge className="bg-primary">
                                {quarter}: {formatCompact(consolidatedQuarterTotals[quarter as keyof typeof consolidatedQuarterTotals])}
                              </Badge>
                              {qoqVariation !== null && (
                                <span className="text-xs text-muted-foreground">
                                  vs {quarter === "Q2" ? "Q1" : quarter === "Q3" ? "Q2" : "Q3"}: <VariationBadge variation={qoqVariation} showIcon={false} />
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
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
                    <TableCell></TableCell>
                    <TableCell></TableCell>
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
