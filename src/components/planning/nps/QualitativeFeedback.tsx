import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FeedbackItem } from '@/hooks/useNpsData';
import { ChevronDown, Quote } from 'lucide-react';

const TABS = [
  { key: 'elogios', label: 'Elogio', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  { key: 'sugestoes', label: 'Sugestão', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { key: 'criticas', label: 'Crítica', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  { key: 'expectativas', label: 'Expectativa', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
];

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const sentimentColor = item.sentiment === 'Positivo' ? 'text-green-600' : item.sentiment === 'Negativo' ? 'text-red-600' : 'text-muted-foreground';
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
      <div className="flex gap-2">
        <Quote className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
        <p className="text-sm text-foreground italic leading-relaxed">"{item.quote}"</p>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">NPS: <strong>{item.npsScore}</strong></span>
        <span className={sentimentColor}>• {item.sentiment}</span>
      </div>
    </div>
  );
}

interface Props {
  data: Record<string, FeedbackItem[]>;
}

export function QualitativeFeedback({ data }: Props) {
  const [activeTab, setActiveTab] = useState('elogios');
  const [open, setOpen] = useState(true);

  const items = data[activeTab] || [];
  const totalFeedback = Object.values(data).reduce((s, arr) => s + arr.length, 0);

  if (totalFeedback === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-6 h-0.5 bg-primary rounded" />
        Análise Qualitativa
      </h2>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex-row items-center justify-between cursor-pointer">
              <div>
                <CardTitle className="text-base text-left">Feedback Qualitativo dos Clientes</CardTitle>
                <CardDescription className="text-left">Comentários coletados na pesquisa, organizados por categoria</CardDescription>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="flex flex-wrap gap-2">
                {TABS.map(tab => {
                  const count = data[tab.key]?.length || 0;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.key ? tab.color : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {tab.label} <span className="font-bold">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-3">
                {items.length > 0 ? items.map((item, i) => (
                  <FeedbackCard key={i} item={item} />
                )) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum feedback nesta categoria</p>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
