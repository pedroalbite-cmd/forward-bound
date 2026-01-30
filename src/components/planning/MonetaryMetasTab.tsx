import { useState, useEffect, useMemo } from 'react';
import { useMonetaryMetas, BuType, MonthType, MetricType, BU_LABELS, METRIC_LABELS } from '@/hooks/useMonetaryMetas';
import { useMediaMetas } from '@/contexts/MediaMetasContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calculator, Save, Download } from 'lucide-react';
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

// Parse currency input
const parseCurrencyInput = (input: string): number => {
  const cleaned = input.replace(/[^\d.,]/g, '').replace(',', '.');
  return Math.round(parseFloat(cleaned) || 0);
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

  // Update local value
  const updateLocalValue = (bu: string, month: string, metric: MetricType, value: number) => {
    const key = `${bu}-${month}`;
    setLocalMetas(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || { faturamento: 0, mrr: 0, setup: 0, pontual: 0 },
        [metric]: value,
      },
    }));
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
    const buFunnelData = funnelData[funnelKey];
    
    if (buFunnelData) {
      buFunnelData.forEach(item => {
        const key = `${selectedBu}-${item.month}`;
        // Calculate faturamento from vendas * ticket médio (approximation)
        // For now, we'll use the investimento as a placeholder or skip if no direct mapping
        const faturamentoEstimado = (item.vendas || 0) * 17000; // Default ticket for Modelo Atual
        
        newMetas[key] = {
          faturamento: faturamentoEstimado,
          mrr: Math.round(faturamentoEstimado * 0.25),
          setup: Math.round(faturamentoEstimado * 0.6),
          pontual: Math.round(faturamentoEstimado * 0.15),
        };
      });
      
      setLocalMetas(newMetas);
      setHasChanges(true);
      toast({ title: 'Valores importados do Plan Growth' });
    }
  };

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

  // Validation: MRR + Setup + Pontual should not exceed Faturamento
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
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
          Configure as metas de Faturamento, MRR, Setup e Pontual para cada unidade de negócio
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
            </div>

            <div className="flex items-center gap-2 flex-wrap">
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
                {METRICS.map(metric => (
                  <TableRow key={metric}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
                      {METRIC_LABELS[metric]}
                    </TableCell>
                    {MONTHS.map(month => (
                      <TableCell key={`${metric}-${month}`} className="text-center p-1">
                        <Input
                          type="text"
                          value={formatCurrency(getLocalValue(selectedBu, month, metric))}
                          onChange={(e) => {
                            const value = parseCurrencyInput(e.target.value);
                            updateLocalValue(selectedBu, month, metric, value);
                          }}
                          onFocus={(e) => {
                            // Show raw value on focus
                            e.target.value = getLocalValue(selectedBu, month, metric).toString();
                          }}
                          onBlur={(e) => {
                            // Format on blur
                            const value = parseCurrencyInput(e.target.value);
                            updateLocalValue(selectedBu, month, metric, value);
                          }}
                          className="w-20 h-8 text-center text-sm"
                        />
                      </TableCell>
                    ))}
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
            Os valores definidos aqui serão usados como metas nos indicadores de Faturamento, MRR, Setup e Pontual.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Percentuais padrão:</strong> MRR = 25%, Setup = 60%, Pontual = 15% do Faturamento
          </p>
          <p>
            <strong>Dica:</strong> Preencha o Faturamento primeiro e clique em "Calcular % Padrão" para preencher automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
