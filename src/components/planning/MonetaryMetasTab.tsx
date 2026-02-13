import { useState, useEffect, useMemo } from 'react';
import { useMonetaryMetas, BuType, MonthType, BU_LABELS, isPontualOnlyBU } from '@/hooks/useMonetaryMetas';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

const TARGET_TOTAL = 33_306_500;

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return `R$ ${value.toFixed(0)}`;
};

const formatCompact = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toFixed(0);
};

const DEFAULT_TICKETS: Record<BuType, number> = {
  modelo_atual: 400_000,
  o2_tax: 15_000,
  oxy_hacker: 54_000,
  franquia: 140_000,
};

// Get current month index (0-based). Feb 2026 = 1
function getCurrentMonthIndex(): number {
  const now = new Date();
  if (now.getFullYear() === 2026) return now.getMonth();
  return 1; // February
}

function isMonthLocked(monthIndex: number): boolean {
  return monthIndex < getCurrentMonthIndex();
}

export function MonetaryMetasTab() {
  const { toast } = useToast();
  const { metas, isLoading, bulkUpdateMetas, BUS, MONTHS } = useMonetaryMetas();

  const [selectedBu, setSelectedBu] = useState<BuType>('modelo_atual');
  
  // Local state: faturamento per BU per month (PRIMARY EDITABLE)
  const [localFaturamento, setLocalFaturamento] = useState<Record<string, Record<string, number>>>({});
  // Ticket medio per BU
  const [localTickets, setLocalTickets] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingTicket, setEditingTicket] = useState<string | null>(null);
  const [editingTicketValue, setEditingTicketValue] = useState<string>('');

  // Initialize from DB
  useEffect(() => {
    if (metas.length > 0) {
      const fatMap: Record<string, Record<string, number>> = {};
      const ticketMap: Record<string, number> = {};

      BUS.forEach(bu => {
        fatMap[bu] = {};
        let foundTicket = 0;
        MONTHS.forEach(month => {
          const meta = metas.find(m => m.bu === bu && m.month === month);
          if (meta) {
            fatMap[bu][month] = Number(meta.faturamento) || 0;
            if (Number(meta.ticket_medio) > 0) foundTicket = Number(meta.ticket_medio);
          } else {
            fatMap[bu][month] = 0;
          }
        });
        ticketMap[bu] = foundTicket > 0 ? foundTicket : DEFAULT_TICKETS[bu];
      });

      setLocalFaturamento(fatMap);
      setLocalTickets(ticketMap);
      setHasChanges(false);
    } else {
      const fatMap: Record<string, Record<string, number>> = {};
      const ticketMap: Record<string, number> = {};
      BUS.forEach(bu => {
        fatMap[bu] = {};
        MONTHS.forEach(month => { fatMap[bu][month] = 0; });
        ticketMap[bu] = DEFAULT_TICKETS[bu];
      });
      setLocalFaturamento(fatMap);
      setLocalTickets(ticketMap);
    }
  }, [metas]);

  const getFaturamento = (bu: string, month: string) => localFaturamento[bu]?.[month] ?? 0;
  const getTicket = (bu: string) => localTickets[bu] ?? 0;
  const getVendas = (bu: string, month: string) => {
    const ticket = getTicket(bu);
    if (ticket <= 0) return 0;
    return Math.round(getFaturamento(bu, month) / ticket);
  };

  const getBuMonthlyTotal = (bu: string) => MONTHS.reduce((s, m) => s + getFaturamento(bu, m), 0);
  const getBuVendasTotal = (bu: string) => MONTHS.reduce((s, m) => s + getVendas(bu, m), 0);

  // Consolidated total across all BUs
  const consolidatedTotal = useMemo(() => {
    return BUS.reduce((sum, bu) => sum + getBuMonthlyTotal(bu), 0);
  }, [localFaturamento, localTickets]);

  const diff = consolidatedTotal - TARGET_TOTAL;
  const isOnTarget = Math.abs(diff) < 1000;
  const progressPct = Math.min((consolidatedTotal / TARGET_TOTAL) * 100, 100);

  const updateFaturamento = (bu: string, month: string, value: number) => {
    setLocalFaturamento(prev => ({
      ...prev,
      [bu]: { ...prev[bu], [month]: value },
    }));
    setHasChanges(true);
  };

  const updateTicket = (bu: string, value: number) => {
    setLocalTickets(prev => ({ ...prev, [bu]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const updates = BUS.flatMap(bu => {
      const ticket = getTicket(bu);
      const pontualOnly = isPontualOnlyBU(bu);
      return MONTHS.map(month => {
        const fat = getFaturamento(bu, month);
        const vendas = ticket > 0 ? Math.round(fat / ticket) : 0;
        return {
          bu,
          month,
          vendas,
          ticket_medio: ticket,
          faturamento: fat,
          mrr: pontualOnly ? 0 : Math.round(fat * 0.25),
          setup: pontualOnly ? 0 : Math.round(fat * 0.6),
          pontual: pontualOnly ? fat : Math.round(fat * 0.15),
        };
      });
    });

    try {
      await bulkUpdateMetas.mutateAsync(updates);
      toast({ title: 'Metas salvas com sucesso!' });
      setHasChanges(false);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao salvar metas' });
    }
  };

  // Derived metrics for display
  const getMetrics = (bu: string, month: string) => {
    const fat = getFaturamento(bu, month);
    const pontualOnly = isPontualOnlyBU(bu as BuType);
    return {
      faturamento: fat,
      mrr: pontualOnly ? 0 : Math.round(fat * 0.25),
      setup: pontualOnly ? 0 : Math.round(fat * 0.6),
      pontual: pontualOnly ? fat : Math.round(fat * 0.15),
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pontualOnly = isPontualOnlyBU(selectedBu);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-gradient mb-2">
          Metas Monetárias por BU
        </h2>
        <p className="text-muted-foreground">
          Defina o faturamento (meta) e ticket médio por BU. O sistema calcula vendas e métricas automaticamente.
        </p>
      </div>

      {/* Consolidated Target Validation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Meta Consolidada</span>
            <span className="text-sm font-medium">
              {formatCurrency(consolidatedTotal)} / {formatCurrency(TARGET_TOTAL)}
            </span>
          </div>
          <Progress 
            value={progressPct} 
            className={`h-3 ${isOnTarget ? '[&>div]:bg-green-500' : diff > 0 ? '[&>div]:bg-amber-500' : '[&>div]:bg-destructive'}`}
          />
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${isOnTarget ? 'text-green-600' : 'text-destructive'}`}>
              {isOnTarget 
                ? '✅ Meta atingida' 
                : diff > 0 
                  ? `⚠️ Excede em ${formatCurrency(diff)}` 
                  : `❌ Faltam ${formatCurrency(Math.abs(diff))}`}
            </span>
            <span className="text-xs text-muted-foreground">
              {BUS.map(bu => `${BU_LABELS[bu]}: ${formatCurrency(getBuMonthlyTotal(bu))}`).join(' | ')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* BU Selector + Ticket + Save */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Unidade de Negócio</label>
                <Select value={selectedBu} onValueChange={(v) => setSelectedBu(v as BuType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUS.map(bu => (
                      <SelectItem key={bu} value={bu}>{BU_LABELS[bu]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Ticket Médio</label>
                <Input
                  type="text"
                  value={
                    editingTicket === selectedBu
                      ? editingTicketValue
                      : `R$ ${formatCompact(getTicket(selectedBu))}`
                  }
                  onFocus={() => {
                    setEditingTicket(selectedBu);
                    const v = getTicket(selectedBu);
                    setEditingTicketValue(v > 0 ? v.toString() : '');
                  }}
                  onChange={(e) => setEditingTicketValue(e.target.value)}
                  onBlur={() => {
                    const cleaned = editingTicketValue.replace(/[^\d]/g, '');
                    updateTicket(selectedBu, parseInt(cleaned) || 0);
                    setEditingTicket(null);
                  }}
                  className="w-[160px] h-9"
                />
              </div>

              <div className="text-sm text-muted-foreground pt-5">
                Total BU: <strong>{formatCurrency(getBuMonthlyTotal(selectedBu))}</strong>
                {' '}({getBuVendasTotal(selectedBu)} vendas)
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || bulkUpdateMetas.isPending}
            >
              {bulkUpdateMetas.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Todas as BUs
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[120px]">Métrica</TableHead>
                  {MONTHS.map((month, i) => (
                    <TableHead 
                      key={month} 
                      className={`text-center min-w-[90px] ${isMonthLocked(i) ? 'bg-muted/50' : ''}`}
                    >
                      {month}
                      {isMonthLocked(i) && <span className="block text-[10px] text-muted-foreground">🔒</span>}
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[100px] bg-muted/30">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Faturamento Row - EDITABLE (primary input) */}
                <TableRow className="bg-primary/5">
                  <TableCell className="sticky left-0 bg-primary/5 z-10 font-semibold">
                    🎯 Meta (Fat.)
                  </TableCell>
                  {MONTHS.map((month, i) => {
                    const locked = isMonthLocked(i);
                    const cellKey = `fat-${month}`;
                    const value = getFaturamento(selectedBu, month);
                    return (
                      <TableCell key={cellKey} className={`text-center p-1 ${locked ? 'bg-muted/50' : ''}`}>
                        <Input
                          type="text"
                          disabled={locked}
                          value={
                            editingCell === cellKey ? editingValue : (value > 0 ? formatCompact(value) : '')
                          }
                          placeholder={locked ? formatCompact(value) : '0'}
                          onFocus={() => {
                            setEditingCell(cellKey);
                            setEditingValue(value > 0 ? value.toString() : '');
                          }}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => {
                            const cleaned = editingValue.replace(/[^\d]/g, '');
                            const parsed = parseInt(cleaned) || 0;
                            updateFaturamento(selectedBu, month, parsed);
                            setEditingCell(null);
                          }}
                          className={`w-20 h-8 text-center text-sm font-semibold ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold bg-muted/30">
                    {formatCurrency(getBuMonthlyTotal(selectedBu))}
                  </TableCell>
                </TableRow>

                {/* Vendas Row - CALCULATED (display only) */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium">
                    Vendas
                  </TableCell>
                  {MONTHS.map((month, i) => (
                    <TableCell key={`vendas-${month}`} className={`text-center text-sm ${isMonthLocked(i) ? 'bg-muted/50' : ''}`}>
                      {getVendas(selectedBu, month)}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold bg-muted/30">
                    {getBuVendasTotal(selectedBu)}
                  </TableCell>
                </TableRow>

                {/* MRR Row - only for non-pontual BUs */}
                {!pontualOnly && (
                  <TableRow>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium text-muted-foreground">
                      MRR (25%)
                    </TableCell>
                    {MONTHS.map((month, i) => (
                      <TableCell key={`mrr-${month}`} className={`text-center text-sm text-muted-foreground ${isMonthLocked(i) ? 'bg-muted/50' : ''}`}>
                        {formatCompact(getMetrics(selectedBu, month).mrr)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-sm font-medium bg-muted/30">
                      {formatCurrency(MONTHS.reduce((s, m) => s + getMetrics(selectedBu, m).mrr, 0))}
                    </TableCell>
                  </TableRow>
                )}

                {/* Setup Row - only for non-pontual BUs */}
                {!pontualOnly && (
                  <TableRow>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium text-muted-foreground">
                      Setup (60%)
                    </TableCell>
                    {MONTHS.map((month, i) => (
                      <TableCell key={`setup-${month}`} className={`text-center text-sm text-muted-foreground ${isMonthLocked(i) ? 'bg-muted/50' : ''}`}>
                        {formatCompact(getMetrics(selectedBu, month).setup)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-sm font-medium bg-muted/30">
                      {formatCurrency(MONTHS.reduce((s, m) => s + getMetrics(selectedBu, m).setup, 0))}
                    </TableCell>
                  </TableRow>
                )}

                {/* Pontual Row */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium text-muted-foreground">
                    Pontual {pontualOnly ? '(100%)' : '(15%)'}
                  </TableCell>
                  {MONTHS.map((month, i) => (
                    <TableCell key={`pont-${month}`} className={`text-center text-sm text-muted-foreground ${isMonthLocked(i) ? 'bg-muted/50' : ''}`}>
                      {formatCompact(getMetrics(selectedBu, month).pontual)}
                    </TableCell>
                  ))}
                  <TableCell className="text-center text-sm font-medium bg-muted/30">
                    {formatCurrency(MONTHS.reduce((s, m) => s + getMetrics(selectedBu, m).pontual, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
