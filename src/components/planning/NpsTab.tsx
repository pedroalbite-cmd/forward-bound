import { Badge } from '@/components/ui/badge';
import { NpsKpiCards } from './nps/NpsKpiCards';
import { NpsGauges } from './nps/NpsGauges';
import { NpsScoreCards } from './nps/NpsScoreCards';
import { NpsDistributions } from './nps/NpsDistributions';
import { CfoPerformanceTable } from './nps/CfoPerformanceTable';
import { QualitativeFeedback } from './nps/QualitativeFeedback';
import { ExecutiveSummary } from './nps/ExecutiveSummary';

export function NpsTab() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Q4 2025</Badge>
          <Badge variant="outline">Customer Success</Badge>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Resultados da Pesquisa NPS</h1>
        <p className="text-muted-foreground mt-1">Apresentação Executiva — O2 Inc.</p>
      </div>

      <NpsKpiCards />
      <NpsGauges />
      <NpsScoreCards />
      <NpsDistributions />
      <CfoPerformanceTable />
      <QualitativeFeedback />
      <ExecutiveSummary />
    </div>
  );
}
