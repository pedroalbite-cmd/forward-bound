import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { NpsKpiCards } from './nps/NpsKpiCards';
import { NpsGauges } from './nps/NpsGauges';
import { NpsScoreCards } from './nps/NpsScoreCards';
import { NpsDistributions } from './nps/NpsDistributions';
import { CfoPerformanceTable } from './nps/CfoPerformanceTable';
import { QualitativeFeedback } from './nps/QualitativeFeedback';
import { ChurnDossierSection } from './nps/ChurnDossierSection';
import { NpsFilters } from './nps/NpsFilters';

import { OperationsSection } from './nps/OperationsSection';
import { useNpsData, processNpsData, NpsCard } from '@/hooks/useNpsData';
import { useOperationsData } from '@/hooks/useOperationsData';
import { ChevronDown, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { parseISO, isWithinInterval } from 'date-fns';

function parseEntradaDate(entrada: string | null | undefined): Date | null {
  if (!entrada) return null;
  try {
    // Try DD/MM/YYYY format
    const parts = entrada.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (parts) return new Date(+parts[3], +parts[2] - 1, +parts[1]);
    // Try ISO format
    return parseISO(entrada);
  } catch {
    return null;
  }
}

export function NpsTab() {
  const [npsOpen, setNpsOpen] = useState(false);
  const [churnOpen, setChurnOpen] = useState(true);
  const [opsOpen, setOpsOpen] = useState(false);
  const { data: npsData, isLoading, error } = useNpsData();
  const { data: opsData } = useOperationsData();

  // Filter state
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [selectedCfos, setSelectedCfos] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Extract unique produtos and cfos from raw data
  const { produtos, cfos } = useMemo(() => {
    if (!npsData?.raw) return { produtos: [], cfos: [] };
    const { produtoMap, cfoMap } = npsData.raw;
    return {
      produtos: [...new Set(Object.values(produtoMap))].sort(),
      cfos: [...new Set(Object.values(cfoMap))].sort(),
    };
  }, [npsData?.raw]);

  // Filtered and processed NPS data
  const filteredNpsData = useMemo(() => {
    if (!npsData?.raw) return null;
    const { npsRows, cfoMap, titleMap, produtoMap, npsPipeId } = npsData.raw;

    let filtered: NpsCard[] = npsRows;

    // Filter by produto
    if (selectedProdutos.length > 0) {
      const matchingIds = new Set(
        Object.entries(produtoMap)
          .filter(([, p]) => selectedProdutos.includes(p))
          .map(([id]) => id)
      );
      filtered = filtered.filter(c => matchingIds.has(c.ID));
    }

    // Filter by CFO
    if (selectedCfos.length > 0) {
      const matchingIds = new Set(
        Object.entries(cfoMap)
          .filter(([, c]) => selectedCfos.includes(c))
          .map(([id]) => id)
      );
      filtered = filtered.filter(c => matchingIds.has(c.ID));
    }

    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(c => {
        const d = parseEntradaDate(c['Entrada']);
        if (!d) return false;
        return isWithinInterval(d, { start: dateRange.from!, end: dateRange.to! });
      });
    }

    return processNpsData(filtered, cfoMap, titleMap, npsPipeId);
  }, [npsData?.raw, selectedProdutos, selectedCfos, dateRange]);

  const handlePeriodChange = (period: string, range?: DateRange) => {
    setSelectedPeriod(period);
    setDateRange(range);
  };

  const handleClearFilters = () => {
    setSelectedProdutos([]);
    setSelectedCfos([]);
    setSelectedPeriod('all');
    setDateRange(undefined);
  };

  // Use filtered data when filters are active, otherwise use original
  const hasFilters = selectedProdutos.length > 0 || selectedCfos.length > 0 || selectedPeriod !== 'all';
  const displayData = hasFilters ? filteredNpsData : npsData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">2025</Badge>
          <Badge variant="outline">Customer Success</Badge>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Customer Success — Operação & NPS</h1>
        <p className="text-muted-foreground mt-1">Visão completa de operação e satisfação — O2 Inc.</p>
      </div>

      {/* Filters - always visible */}
      {(displayData || isLoading) && (
        <NpsFilters
          produtos={produtos}
          cfos={cfos}
          selectedProdutos={selectedProdutos}
          selectedCfos={selectedCfos}
          selectedPeriod={selectedPeriod}
          dateRange={dateRange}
          onProdutosChange={setSelectedProdutos}
          onCfosChange={setSelectedCfos}
          onPeriodChange={handlePeriodChange}
          onClear={handleClearFilters}
        />
      )}

      {/* Dossiê de Churn - No topo, aberto por padrão */}
      <div className="space-y-4">
        <button
          onClick={() => setChurnOpen(!churnOpen)}
          className="flex items-center gap-2 text-xl font-semibold text-foreground hover:text-primary transition-colors w-full text-left"
        >
          {churnOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          📉 Dossiê de Churn
          <Badge variant="outline" className="ml-2 text-xs font-normal">
            {churnOpen ? 'Clique para fechar' : 'Clique para abrir'}
          </Badge>
        </button>

        {churnOpen && (
          <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <ChurnDossierSection data={opsData?.churnDossier || []} />
          </div>
        )}
      </div>

      {/* Operação Section - Collapsible */}
      <div className="space-y-4">
        <button
          onClick={() => setOpsOpen(!opsOpen)}
          className="flex items-center gap-2 text-xl font-semibold text-foreground hover:text-primary transition-colors w-full text-left"
        >
          {opsOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          📊 Operação
          <Badge variant="outline" className="ml-2 text-xs font-normal">
            {opsOpen ? 'Clique para fechar' : 'Clique para abrir'}
          </Badge>
        </button>

        {opsOpen && (
          <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <OperationsSection />
          </div>
        )}
      </div>

      {/* NPS Section - Collapsible */}
      <div className="space-y-4">
        <button
          onClick={() => setNpsOpen(!npsOpen)}
          className="flex items-center gap-2 text-xl font-semibold text-foreground hover:text-primary transition-colors w-full text-left"
        >
          {npsOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          📋 Resultados NPS
          <Badge variant="outline" className="ml-2 text-xs font-normal">
            {npsOpen ? 'Clique para fechar' : 'Clique para abrir'}
          </Badge>
        </button>

        {npsOpen && (
          <div className="space-y-8 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            {isLoading && (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Carregando dados NPS...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center py-12 gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Erro ao carregar dados NPS: {(error as Error).message}</span>
              </div>
            )}
            {displayData && (
              <>
                {/* Filters */}
                <NpsFilters
                  produtos={produtos}
                  cfos={cfos}
                  selectedProdutos={selectedProdutos}
                  selectedCfos={selectedCfos}
                  selectedPeriod={selectedPeriod}
                  dateRange={dateRange}
                  onProdutosChange={setSelectedProdutos}
                  onCfosChange={setSelectedCfos}
                  onPeriodChange={handlePeriodChange}
                  onClear={handleClearFilters}
                />

                <NpsKpiCards data={displayData.kpis} />
                <NpsGauges data={displayData.metrics} />
                <NpsScoreCards
                  metrics={displayData.metrics}
                  npsDistribution={displayData.npsDistribution}
                  csatDistribution={displayData.csatDistribution}
                  seanEllisDistribution={displayData.seanEllisDistribution}
                />
                <NpsDistributions
                  npsDistribution={displayData.npsDistribution}
                  csatDistribution={displayData.csatDistribution}
                  seanEllisDistribution={displayData.seanEllisDistribution}
                  seExcluded={displayData.seExcluded}
                />
                <CfoPerformanceTable data={displayData.cfoPerformance} npsPipeId={displayData.npsPipeId} />
                <QualitativeFeedback data={displayData.feedback} npsPipeId={displayData.npsPipeId} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
