import { NPS_GENERAL } from './npsData';
import { Users, MessageSquare, TrendingUp, Target } from 'lucide-react';

const kpis = [
  { icon: Users, label: 'Clientes Pesquisados', value: NPS_GENERAL.clientesPesquisados },
  { icon: MessageSquare, label: 'Respostas', value: NPS_GENERAL.respostas },
  { icon: TrendingUp, label: 'Taxa Resposta', value: `${NPS_GENERAL.taxaResposta}%` },
  { icon: Target, label: 'CFOs Ativos', value: NPS_GENERAL.cfosAtivos },
];

export function NpsKpiCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
            <div className="rounded-full bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
