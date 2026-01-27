

## Plano: Adicionar Meta de Faturamento ao Gráfico de Faturamento por Período

### Objetivo

Exibir a meta de faturamento do Plan Growth como uma linha de referência no gráfico "Faturamento por Período", permitindo visualizar a performance realizada versus planejada.

---

### Fonte de Dados

A meta de faturamento virá do **`MediaMetasContext.metasPorBU`**, que contém as metas mensais de receita para cada BU:

```typescript
metasPorBU = {
  modelo_atual: { Jan: 1125000, Fev: 1237500, Mar: 1387500, ... },
  o2_tax: { Jan: 132975, Fev: 135635, ... },
  oxy_hacker: { Jan: 54000, Fev: 108000, ... },
  franquia: { Jan: 0, Fev: 140000, ... }
}
```

---

### Modificações no Componente `RevenueBreakdownChart.tsx`

#### 1. Importar o contexto de metas

```typescript
import { useMediaMetas } from "@/contexts/MediaMetasContext";
```

#### 2. Acessar metasPorBU no componente

```typescript
const { metasPorBU } = useMediaMetas();
```

#### 3. Adicionar campo `meta` ao ChartDataPoint

```typescript
interface ChartDataPoint {
  label: string;
  mrr: number;
  setup: number;
  pontual: number;
  total: number;
  meta: number;  // NOVO
  startDate: Date;
  endDate: Date;
}
```

#### 4. Calcular a meta por período

Criar função `calcularMetaPorPeriodo` que pro-rateia as metas mensais para o agrupamento do gráfico (diário/semanal/mensal):

```typescript
const calcularMetaDoPeriodo = (start: Date, end: Date): number => {
  if (!metasPorBU || !useModeloAtual) return 0;
  
  // Para Modelo Atual, pegar metas do contexto
  const metas = metasPorBU.modelo_atual;
  if (!metas || Object.keys(metas).length === 0) return 0;
  
  // Pro-ratear por dias do período
  const monthsInPeriod = eachMonthOfInterval({ start, end });
  let total = 0;
  
  for (const monthDate of monthsInPeriod) {
    const monthName = format(monthDate, 'MMM', { locale: ptBR }); // Jan, Fev...
    const monthMeta = metas[monthName] || 0;
    
    // Calcular fração do mês no período
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const overlapStart = start > monthStart ? start : monthStart;
    const overlapEnd = end < monthEnd ? end : monthEnd;
    const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    
    total += monthMeta * (overlapDays / daysInMonth);
  }
  
  return total;
};
```

#### 5. Incluir meta nos dados do gráfico

Dentro de `getGroupedMonetaryData`, adicionar o cálculo de meta para cada ponto do gráfico.

#### 6. Adicionar linha de meta no gráfico

```tsx
<Line 
  type="monotone" 
  dataKey="meta" 
  stroke="#22c55e" 
  strokeWidth={2} 
  strokeDasharray="5 5" 
  dot={false}
  name="meta"
/>
```

#### 7. Atualizar header com meta total

```tsx
<div className="flex items-center gap-2">
  <span className="text-muted-foreground">Meta:</span>
  <span className="font-medium text-green-500">{formatCompactCurrency(metaTotal)}</span>
</div>
```

---

### Design Visual do Gráfico Atualizado

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Faturamento por Período                                                        │
│                                                                                 │
│  Total: R$ 850k    Meta: R$ 1.2M    MRR: R$ 510k    Setup: R$ 213k    Pont: R$ 127k │
│                                                                                 │
│  ■ MRR   ■ Setup   ■ Pontual   ─ ─ Meta                                         │
│                                                                                 │
│        - - - - - - - - - - - - - - - - - - - - - - - - ← Linha de meta (verde)  │
│     ┌───┐         ┌───┐         ┌───┐         ┌───┐                            │
│  200k│███│      150k│███│      180k│███│      120k│███│  ← Barras empilhadas     │
│     │███│         │███│         │███│         │███│                            │
│     │░░░│         │░░░│         │░░░│         │░░░│                            │
│     │░░░│         │░░░│         │░░░│         │░░░│                            │
│     │▒▒▒│         │▒▒▒│         │▒▒▒│         │▒▒▒│                            │
│     └───┘         └───┘         └───┘         └───┘                            │
│      Jan           Fev           Mar           Abr                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Imports Adicionais Necessários

```typescript
import { useMediaMetas } from "@/contexts/MediaMetasContext";
import { startOfMonth, endOfMonth } from "date-fns";
import { Line, ComposedChart } from "recharts";
```

Nota: Precisamos trocar `BarChart` por `ComposedChart` para combinar barras empilhadas com linha de meta.

---

### Resumo de Modificações

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/planning/RevenueBreakdownChart.tsx` | Modificar | Importar useMediaMetas, calcular metas pro-rata, adicionar linha de meta ao gráfico, atualizar header |

---

### Detalhes Tecnico

1. **Pro-rateamento de metas**: As metas mensais serão divididas proporcionalmente para agrupamentos diários/semanais
2. **Tipo de gráfico**: Trocar `BarChart` por `ComposedChart` para suportar barras + linha
3. **Visual da meta**: Linha tracejada verde (#22c55e) que atravessa o gráfico
4. **Tooltip atualizado**: Incluir valor da meta ao passar o mouse
5. **Legenda atualizada**: Adicionar item "Meta" na legenda

