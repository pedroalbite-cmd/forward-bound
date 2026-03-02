import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EXECUTIVE_SUMMARY } from './npsData';
import { ChevronDown, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

export function ExecutiveSummary() {
  const [open, setOpen] = useState(true);

  const sections = [
    { title: 'Pontos Fortes', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', items: EXECUTIVE_SUMMARY.pontosFortes },
    { title: 'Pontos de Atenção', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', items: EXECUTIVE_SUMMARY.pontosAtencao },
    { title: 'Recomendações', icon: Lightbulb, color: 'text-blue-600 dark:text-blue-400', items: EXECUTIVE_SUMMARY.recomendacoes },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-6 h-0.5 bg-primary rounded" />
        Conclusão Executiva
      </h2>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex-row items-center justify-between cursor-pointer">
              <CardTitle className="text-base text-left">Leitura Geral dos Resultados</CardTitle>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              <p className="text-sm text-muted-foreground">
                A empresa atingiu <strong>1 de 4 metas</strong> estabelecidas para Q4/2025. O resultado indica oportunidades claras de melhoria.
              </p>
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <div key={section.title}>
                    <h4 className={`text-sm font-semibold flex items-center gap-2 mb-2 ${section.color}`}>
                      <Icon className="h-4 w-4" />
                      {section.title}
                    </h4>
                    <ul className="space-y-1.5">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground italic">{EXECUTIVE_SUMMARY.conclusao}</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
