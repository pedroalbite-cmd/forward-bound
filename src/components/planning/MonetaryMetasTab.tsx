import { useState, useEffect, useMemo } from 'react';
import { useMonetaryMetas, BuType, MonthType, MetricType, BU_LABELS, METRIC_LABELS, isPontualOnlyBU } from '@/hooks/useMonetaryMetas';
import { useMediaMetas, FunnelDataItem } from '@/contexts/MediaMetasContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calculator, Save, Download, Database, TrendingUp } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Format currency for display
const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }
  return value.toFixed(0);
};

// Parse currency input with k/m suffix support
const parseCurrencyInput = (input: string): number => {
  const cleaned = input.trim().toLowerCase();
  
  // Suporta sufixos k (mil) e m (milhão)
  if (cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1).replace(',', '.')) || 0;
    return Math.round(num * 1000);
  }
  if (cleaned.endsWith('m')) {
    const num = parseFloat(cleaned.slice(0, -1).replace(',', '.')) || 0;
    return Math.round(num * 1000000);
  }
  
  // Remove caracteres não numéricos exceto ponto e vírgula
  const numericStr = cleaned.replace(/[^\d.,]/g, '').replace(',', '.');
  return Math.round(parseFloat(numericStr) || 0);
};

export function MonetaryMetasTab() {
  const { toast } = useToast();
  const { 
    metas, 
    isLoading, 
    bulkUpdateMetas,
    BUS,
    MONTHS,
    METRICS,
  } = useMonetaryMetas();
  
  const { funnelData } = useMediaMetas();

  const [selectedBu, setSelectedBu] = useState<BuType>('modelo_atual');
  const [localMetas, setLocalMetas] = useState<Record<string, Record<MetricType, number>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Initialize local metas from fetched data
  useEffect(() => {
    if (metas.length > 0) {
      const metasMap: Record<string, Record<MetricType, number>> = {};
      metas.forEach(m => {
        metasMap[`${m.bu}-${m.month}`] = {
          faturamento: Number(m.faturamento) || 0,
          mrr: Number(m.mrr) || 0,
          setup: Number(m.setup) || 0,
          pontual: Number(m.pontual) || 0,
        };
      });
      setLocalMetas(metasMap);
      setHasChanges(false);
    }
  }, [metas]);

  // Get local value
  const getLocalValue = (bu: string, month: string, metric: MetricType): number => {
    const key = `${bu}-${month}`;
    return localMetas[key]?.[metric] ?? 0;
  };

  // Update local value - auto-calculates MRR/Setup/Pontual when faturamento changes
  const updateLocalValue = (bu: string, month: string, metric: MetricType, value: number) => {
    const key = `${bu}-${month}`;
    const isPontualOnly = isPontualOnlyBU(bu as BuType);
    
    // Para BUs pontual-only, editar Pontual atualiza faturamento também
    if (isPontualOnly && metric === 'pontual') {
      setLocalMetas(prev => ({
        ...prev,
        [key]: {
          faturamento: value,
          mrr: 0,
          setup: 0,
          pontual: value,
        },
      }));
      setHasChanges(true);
      return;
    }
    
    if (metric === 'faturamento') {
      if (isPontualOnly) {
        // Para BUs de expansão: 100% vai para Pontual
        setLocalMetas(prev => ({
          ...prev,
          [key]: {
            faturamento: value,
            mrr: 0,
            setup: 0,
            pontual: value,
          },
        }));
      } else {
        // Para Modelo Atual e O2 TAX: split padrão 25/60/15
        setLocalMetas(prev => ({
          ...prev,
          [key]: {
            faturamento: value,
            mrr: Math.round(value * 0.25),
            setup: Math.round(value * 0.6),
            pontual: Math.round(value * 0.15),
          },
        }));
      }
    } else {
      // Para outras métricas, atualiza apenas o campo específico
      setLocalMetas(prev => ({
        ...prev,
        [key]: {
          ...prev[key] || { faturamento: 0, mrr: 0, setup: 0, pontual: 0 },
          [metric]: value,
        },
      }));
    }
    setHasChanges(true);
  };

  // Calculate totals for a metric
  const getMetricTotal = (bu: string, metric: MetricType): number => {
    return MONTHS.reduce((sum, month) => sum + getLocalValue(bu, month, metric), 0);
  };

  // Calculate from default percentages (60/25/15)
  const handleCalculateFromPercentages = () => {
    const newMetas = { ...localMetas };
    
    MONTHS.forEach(month => {
      const key = `${selectedBu}-${month}`;
      const faturamento = getLocalValue(selectedBu, month, 'faturamento');
      
      newMetas[key] = {
        faturamento,
        mrr: Math.round(faturamento * 0.25),
        setup: Math.round(faturamento * 0.6),
        pontual: Math.round(faturamento * 0.15),
      };
    });
    
    setLocalMetas(newMetas);
    setHasChanges(true);
    toast({ title: 'Valores calculados com base nos percentuais padrão (MRR 25% / Setup 60% / Pontual 15%)' });
  };

  // Tickets médios por BU para cálculo de faturamento
  const BU_TICKETS: Record<BuType, number> = {
    modelo_atual: 17000,
    o2_tax: 15000,
    oxy_hacker: 54000,
    franquia: 140000,
  };

  // Import from Plan Growth
  const handleImportFromPlanGrowth = () => {
    if (!funnelData) {
      toast({ 
        variant: 'destructive', 
        title: 'Dados não disponíveis', 
        description: 'Visite a aba Plan Growth primeiro para carregar os dados.' 
      });
      return;
    }

    const newMetas = { ...localMetas };
    
    // Map BU to funnel data key
    const buToFunnelKey: Record<BuType, keyof typeof funnelData> = {
      modelo_atual: 'modeloAtual',
      o2_tax: 'o2Tax',
      oxy_hacker: 'oxyHacker',
      franquia: 'franquia',
    };
    
    const funnelKey = buToFunnelKey[selectedBu];
    const buFunnelData = funnelData[funnelKey] as FunnelDataItem[];
    const ticket = BU_TICKETS[selectedBu];
    const isPontualOnly = isPontualOnlyBU(selectedBu);
    
    if (buFunnelData && buFunnelData.length > 0) {
      buFunnelData.forEach((item: FunnelDataItem) => {
        const key = `${selectedBu}-${item.month}`;
        const faturamento = (item.vendas || 0) * ticket;
        
        if (isPontualOnly) {
          // BUs de expansão: 100% vai para pontual
          newMetas[key] = {
            faturamento,
            mrr: 0,
            setup: 0,
            pontual: faturamento,
          };
        } else {
          // Modelo Atual / O2 TAX: split padrão
          newMetas[key] = {
            faturamento,
            mrr: Math.round(faturamento * 0.25),
            setup: Math.round(faturamento * 0.6),
            pontual: Math.round(faturamento * 0.15),
          };
        }
      });
      
      setLocalMetas(newMetas);
      setHasChanges(true);
      toast({ 
        title: 'Valores importados do Plan Growth!',
        description: `${buFunnelData.length} meses importados para ${BU_LABELS[selectedBu]}`
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Sem dados para esta BU',
        description: 'O Plan Growth não possui dados calculados para esta unidade de negócio.'
      });
    }
  };

  // Check if current BU has data in Plan Growth
  const hasPlanGrowthData = useMemo(() => {
    if (!funnelData) return false;
    const buToFunnelKey: Record<BuType, keyof typeof funnelData> = {
      modelo_atual: 'modeloAtual',
      o2_tax: 'o2Tax',
      oxy_hacker: 'oxyHacker',
      franquia: 'franquia',
    };
    const buData = funnelData[buToFunnelKey[selectedBu]] as FunnelDataItem[] | undefined;
    return buData && buData.length > 0 && buData.some((item: FunnelDataItem) => item.vendas > 0);
  }, [funnelData, selectedBu]);

  // Check if current BU has data in database
  const hasDbData = useMemo(() => {
    return metas.some(m => 
      m.bu === selectedBu && 
      (Number(m.faturamento) > 0 || Number(m.mrr) > 0 || Number(m.setup) > 0 || Number(m.pontual) > 0)
    );
  }, [metas, selectedBu]);

  // Save changes
  const handleSave = async () => {
    const updates = MONTHS.map(month => ({
      bu: selectedBu,
      month,
      faturamento: getLocalValue(selectedBu, month, 'faturamento'),
      mrr: getLocalValue(selectedBu, month, 'mrr'),
      setup: getLocalValue(selectedBu, month, 'setup'),
      pontual: getLocalValue(selectedBu, month, 'pontual'),
    }));

    try {
      await bulkUpdateMetas.mutateAsync(updates);
      toast({ title: 'Metas salvas com sucesso!' });
      setHasChanges(false);
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao salvar', 
        description: 'Não foi possível atualizar as metas' 
      });
    }
  };

  // Métricas a exibir baseado na BU selecionada
  const visibleMetrics = useMemo(() => {
    if (isPontualOnlyBU(selectedBu)) {
      return ['pontual'] as MetricType[];
    }
    return METRICS;
  }, [selectedBu, METRICS]);

  // Validation: MRR + Setup + Pontual should not exceed Faturamento
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    
    // BUs pontual-only não precisam de validação (só tem 1 campo)
    if (isPontualOnlyBU(selectedBu)) {
      return issues;
    }
    
    // Validação padrão: soma não excede faturamento
    MONTHS.forEach(month => {
      const fat = getLocalValue(selectedBu, month, 'faturamento');
      const sum = getLocalValue(selectedBu, month, 'mrr') +
                  getLocalValue(selectedBu, month, 'setup') +
                  getLocalValue(selectedBu, month, 'pontual');
      if (fat > 0 && sum > fat) {
        issues.push(`${month}: MRR + Setup + Pontual (${formatCurrency(sum)}) excede Faturamento (${formatCurrency(fat)})`);
      }
    });
    return issues;
  }, [localMetas, selectedBu]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-gradient mb-2">
          Metas Monetárias por BU
        </h2>
        <p className="text-muted-foreground">
          Configure as metas de Incremento de Faturamento, MRR, Setup e Pontual para cada unidade de negócio
        </p>
      </div>

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
                      <SelectItem key={bu} value={bu}>
                        {BU_LABELS[bu]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Indicador de fonte de dados */}
              <div className="flex items-center gap-2">
                {hasDbData ? (
                  <Badge variant="secondary" className="gap-1">
                    <Database className="h-3 w-3" />
                    Banco
                  </Badge>
                ) : hasPlanGrowthData ? (
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Plan Growth
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Sem dados
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleImportFromPlanGrowth}
                disabled={!hasPlanGrowthData}
                title={hasPlanGrowthData ? 'Importar metas calculadas do Plan Growth' : 'Visite a aba Plan Growth para gerar dados'}
              >
                <Download className="h-4 w-4 mr-2" />
                Importar Plan Growth
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCalculateFromPercentages}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calcular % Padrão
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || validationIssues.length > 0 || bulkUpdateMetas.isPending}
              >
                {bulkUpdateMetas.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[100px]">Métrica</TableHead>
                  {MONTHS.map(month => (
                    <TableHead key={month} className="text-center min-w-[100px]">
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[120px] bg-muted/30">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMetrics.map(metric => (
                  <TableRow key={metric}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
                      {METRIC_LABELS[metric]}
                    </TableCell>
                    {MONTHS.map(month => {
                      const cellKey = `${metric}-${month}`;
                      const rawValue = getLocalValue(selectedBu, month, metric);
                      return (
                        <TableCell key={cellKey} className="text-center p-1">
                          <Input
                            type="text"
                            value={
                              editingCell === cellKey
                                ? editingValue
                                : formatCurrency(rawValue)
                            }
                            onChange={(e) => {
                              setEditingValue(e.target.value);
                            }}
                            onFocus={() => {
                              setEditingCell(cellKey);
                              setEditingValue(rawValue > 0 ? rawValue.toString() : '');
                            }}
                            onBlur={() => {
                              const value = parseCurrencyInput(editingValue);
                              updateLocalValue(selectedBu, month, metric, value);
                              setEditingCell(null);
                              setEditingValue('');
                            }}
                            className="w-20 h-8 text-center text-sm"
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {formatCurrency(getMetricTotal(selectedBu, metric))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {validationIssues.length > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive font-medium mb-1">⚠️ Validação:</p>
              <ul className="text-sm text-destructive list-disc list-inside">
                {validationIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona</CardTitle>
        <CardDescription>
            Os valores definidos aqui serão usados como metas nos indicadores. Ao preencher o Incremento, MRR/Setup/Pontual são calculados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          {isPontualOnlyBU(selectedBu) ? (
            <>
              <p>
                <strong>{BU_LABELS[selectedBu]}</strong> opera com ticket único (valor pontual).
              </p>
              <p>
                Preencha o valor de <strong>Pontual</strong> esperado para cada mês.
              </p>
              <p>
                Ticket padrão: <strong>{selectedBu === 'oxy_hacker' ? 'R$ 54.000' : 'R$ 140.000'}</strong>
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Percentuais padrão:</strong> MRR = 25%, Setup = 60%, Pontual = 15% do Incremento
              </p>
              <p>
                <strong>Dica:</strong> Ao preencher o Incremento, os demais campos são calculados automaticamente. Você pode ajustar manualmente depois.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
