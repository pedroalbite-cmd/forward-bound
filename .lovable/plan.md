

## Plano: Adicionar Collapsible para Gráficos de Indicadores

### Objetivo

Permitir que o usuário minimize/expanda a seção "Gráficos de Indicadores" que contém os 5 gráficos de indicadores (MQLs, Reuniões Agendadas, Reuniões Realizadas, Propostas, Vendas).

---

### Abordagem

Utilizar o componente `Collapsible` do Radix UI (já disponível em `@/components/ui/collapsible`) para envolver a seção de gráficos, similar ao padrão já usado no `AnalyticsSection.tsx`.

---

### Mudanças no Arquivo

#### `src/components/planning/IndicatorsTab.tsx`

**1. Adicionar imports necessários (linha 1-28):**

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
```

**2. Adicionar estado para controlar o collapsible (após linha 165):**

```typescript
const [chartsOpen, setChartsOpen] = useState(true); // Começa expandido
```

**3. Modificar a seção de gráficos (linhas 756-797):**

**ANTES:**
```tsx
{/* Charts Section with View Mode Toggle */}
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-foreground">Gráficos de Indicadores</h3>
    <ToggleGroup ...>
      ...
    </ToggleGroup>
  </div>
  
  {indicatorConfigs.map((indicator) => (
    <IndicatorChartSection ... />
  ))}
</div>
```

**DEPOIS:**
```tsx
{/* Charts Section with View Mode Toggle - Collapsible */}
<Collapsible open={chartsOpen} onOpenChange={setChartsOpen} className="w-full">
  <CollapsibleTrigger className="w-full">
    <div className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <h3 className="text-lg font-semibold text-foreground">Gráficos de Indicadores</h3>
          <p className="text-sm text-muted-foreground">Evolução diária/acumulada de MQLs, RM, RR, Propostas e Vendas</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Toggle permanece visível fora do collapsible para troca rápida */}
        {chartsOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    </div>
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-4 space-y-4">
    {/* Toggle de visualização dentro do conteúdo */}
    <div className="flex justify-end">
      <ToggleGroup 
        type="single" 
        value={viewMode} 
        onValueChange={(v) => v && setViewMode(v as ViewMode)}
        className="bg-muted rounded-lg p-1"
      >
        <ToggleGroupItem value="daily" ...>
          ...
        </ToggleGroupItem>
        <ToggleGroupItem value="accumulated" ...>
          ...
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
    
    {indicatorConfigs.map((indicator) => (
      <IndicatorChartSection ... />
    ))}
  </CollapsibleContent>
</Collapsible>
```

---

### Comportamento

| Estado | Visualização |
|--------|-------------|
| Expandido (padrão) | Mostra header clicável + toggle de visualização + todos os 5 gráficos |
| Minimizado | Mostra apenas header clicável com ícone e descrição |

---

### Design Consistente

O design será consistente com a seção "Análises Detalhadas" (`AnalyticsSection.tsx`) que já usa este padrão:
- Card com ícone à esquerda
- Título e descrição
- Chevron à direita indicando estado
- Hover effect para indicar interatividade

---

### Resumo de Modificações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Adicionar imports, estado e envolver seção de gráficos com Collapsible |

