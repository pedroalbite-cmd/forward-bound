import { useState } from 'react';
import { useOperationsData, CfoDistribution } from '@/hooks/useOperationsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, AlertTriangle, UserMinus, DollarSign, ClipboardList, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PipefyCardLink, PIPEFY_PIPES } from './PipefyCardLink';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(210, 70%, 55%)',
  'hsl(340, 65%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(45, 80%, 50%)',
  'hsl(280, 60%, 55%)',
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

export function OperationsSection() {
  const { data, isLoading, error } = useOperationsData();
  const [selectedCfo, setSelectedCfo] = useState<CfoDistribution | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center text-destructive">
          Erro ao carregar dados de operação: {error?.message || 'Dados indisponíveis'}
        </CardContent>
      </Card>
    );
  }

  const { kpis, cfoDistribution, tratativasAtivas = [], motivoChurnCount = {}, motivoCount = {} } = data;

  const kpiCards = [
    { icon: Users, label: 'Clientes Ativos', value: kpis.totalAtivos, color: 'text-primary' },
    { icon: UserCheck, label: 'Em Operação', value: kpis.emOperacao, color: 'text-green-600 dark:text-green-400' },
    { icon: ClipboardList, label: 'Onboarding', value: kpis.emOnboarding, color: 'text-blue-600 dark:text-blue-400' },
    { icon: AlertTriangle, label: 'Em Tratativa', value: kpis.tratativasAtivas, color: 'text-amber-600 dark:text-amber-400' },
    { icon: UserMinus, label: 'Churn', value: kpis.churn, color: 'text-red-600 dark:text-red-400' },
    { icon: DollarSign, label: 'MRR Total', value: formatCurrency(kpis.mrrTotal), color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  const motivoChurnData = Object.entries(motivoChurnCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const motivoData = Object.entries(motivoCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
              <div className="rounded-full bg-muted p-2.5">
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CFO Distribution Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Clientes por CFO — clique para ver lista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CFO</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                    <TableHead className="text-right">MRR</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cfoDistribution.map((row) => (
                    <TableRow
                      key={row.cfo}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCfo(row)}
                    >
                      <TableCell className="font-medium">{row.cfo}</TableCell>
                      <TableCell className="text-right">{row.clientes}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.mrr)}</TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Motivos das Tratativas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Motivos das Tratativas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={motivoData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {motivoData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tratativas Ativas Table */}
      {tratativasAtivas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tratativas Ativas ({tratativasAtivas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>CFO</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tratativasAtivas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.empresa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.motivo}</Badge>
                      </TableCell>
                      <TableCell>{t.cfo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.faseAtual}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={t.diasEmTratativa > 30 ? 'text-destructive font-bold' : ''}>
                          {t.diasEmTratativa}d
                        </span>
                      </TableCell>
                      <TableCell>
                        <PipefyCardLink pipeId={PIPEFY_PIPES.TRATATIVAS} cardId={t.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivos de Churn */}
      {motivoChurnData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Motivos de Churn (Tratativas Finalizadas)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={motivoChurnData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={160} tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* CFO Client Drill-down Sheet */}
      <Sheet open={!!selectedCfo} onOpenChange={() => setSelectedCfo(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedCfo && (
            <>
              <SheetHeader>
                <SheetTitle>Clientes — {selectedCfo.cfo}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Clientes</p>
                    <p className="text-lg font-bold text-foreground">{selectedCfo.clientes}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">MRR Total</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(selectedCfo.mrr)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(selectedCfo.clients || []).map((client, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{client.titulo}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatCurrency(client.mrr)}</span>
                          <Badge variant="outline" className="text-[10px]">{client.fase}</Badge>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        <PipefyCardLink pipeId={PIPEFY_PIPES.CENTRAL_PROJETOS} cardId={client.cardId} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
