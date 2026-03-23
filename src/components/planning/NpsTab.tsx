import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { NpsKpiCards } from './nps/NpsKpiCards';
import { NpsGauges } from './nps/NpsGauges';
import { NpsScoreCards } from './nps/NpsScoreCards';
import { NpsDistributions } from './nps/NpsDistributions';
import { CfoPerformanceTable } from './nps/CfoPerformanceTable';
import { QualitativeFeedback } from './nps/QualitativeFeedback';
import { ChurnDossierSection } from './nps/ChurnDossierSection';

import { OperationsSection } from './nps/OperationsSection';
import { useNpsData } from '@/hooks/useNpsData';
import { useOperationsData } from '@/hooks/useOperationsData';
import { ChevronDown, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

export function NpsTab() {
  const [npsOpen, setNpsOpen] = useState(false);
  const [churnOpen, setChurnOpen] = useState(true);
  const [opsOpen, setOpsOpen] = useState(false);
  const { data: npsData, isLoading, error } = useNpsData();
  const { data: opsData } = useOperationsData();

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
            {npsData && (
              <>
                <NpsKpiCards data={npsData.kpis} />
                <NpsGauges data={npsData.metrics} />
                <NpsScoreCards
                  metrics={npsData.metrics}
                  npsDistribution={npsData.npsDistribution}
                  csatDistribution={npsData.csatDistribution}
                  seanEllisDistribution={npsData.seanEllisDistribution}
                />
                <NpsDistributions
                  npsDistribution={npsData.npsDistribution}
                  csatDistribution={npsData.csatDistribution}
                  seanEllisDistribution={npsData.seanEllisDistribution}
                  seExcluded={npsData.seExcluded}
                />
                <CfoPerformanceTable data={npsData.cfoPerformance} npsPipeId={npsData.npsPipeId} />
                <QualitativeFeedback data={npsData.feedback} npsPipeId={npsData.npsPipeId} />
                
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
