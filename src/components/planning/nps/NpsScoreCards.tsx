import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NPS_METRICS, NPS_DISTRIBUTION } from './npsData';
import { CheckCircle2, XCircle, Target } from 'lucide-react';

interface ScoreCardProps {
  title: string;
  score: number | string;
  suffix?: string;
  description: string;
  meta: number | string;
  metaAtingida: boolean;
}

function ScoreCard({ title, score, suffix, description, meta, metaAtingida }: ScoreCardProps) {
  const scoreColor = metaAtingida ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
        <p className={`text-5xl font-bold ${scoreColor} leading-none`}>
          {score}<span className="text-2xl">{suffix}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Meta: {meta}{suffix}
          </span>
          {metaAtingida ? (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Atingida
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-0 gap-1">
              <XCircle className="h-3 w-3" /> Não atingida
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function NpsScoreCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ScoreCard
        title="NPS"
        score={NPS_METRICS.nps.score}
        description={`${NPS_DISTRIBUTION.promotores.count} promotores, ${NPS_DISTRIBUTION.neutros.count} neutros, ${NPS_DISTRIBUTION.detratores.count} detratores`}
        meta={NPS_METRICS.nps.meta}
        metaAtingida={NPS_METRICS.nps.metaAtingida}
      />
      <ScoreCard
        title="CSAT"
        score={NPS_METRICS.csat.score}
        suffix="%"
        description="18 de 22 respondentes satisfeitos"
        meta={NPS_METRICS.csat.meta}
        metaAtingida={NPS_METRICS.csat.metaAtingida}
      />
      <ScoreCard
        title="SEAN ELLIS SCORE"
        score={NPS_METRICS.seanEllis.score}
        suffix="%"
        description="2 de 14 usuários ativos"
        meta={NPS_METRICS.seanEllis.meta}
        metaAtingida={NPS_METRICS.seanEllis.metaAtingida}
      />
    </div>
  );
}
