
## Ajustes nos Acelerômetros e Widget de Conversão

### Objetivo

Implementar três alterações solicitadas:
1. Remover a legenda de cores do widget de Conversão de Funil por Tier
2. Corrigir a coloração do acelerômetro de Faturamento (garantir que 100% seja verde)
3. Adicionar faixa amarela para 80-99% nos acelerômetros (exceto SLA)

---

### Alterações Técnicas

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/indicators/FunnelConversionByTierWidget.tsx` | Remover linhas 378-391 (legenda de cores) |
| `src/components/planning/IndicatorsTab.tsx` | Ajustar lógica de cores nos componentes RadialProgressCard e MonetaryRadialCard |

---

### 1. Remover Legenda do Widget de Conversão

**Código a remover (linhas 377-392):**

```tsx
{/* Legend */}
<div className="flex flex-wrap gap-4 justify-center text-sm">
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded bg-green-500" />
    <span className="text-muted-foreground">≥ 70% (Excelente)</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded bg-amber-500" />
    <span className="text-muted-foreground">40-69% (Atenção)</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded bg-red-500" />
    <span className="text-muted-foreground">&lt; 40% (Gargalo)</span>
  </div>
</div>
```

---

### 2. Nova Lógica de Cores com Faixa Amarela (80-99%)

**Lógica atual (2 faixas):**
- Verde: >= 100%
- Vermelho: < 100%

**Nova lógica (3 faixas) - Exceto SLA:**
- Verde: >= 100%
- Amarelo: 80% a 99%
- Vermelho: < 80%

**SLA mantém lógica invertida:**
- Verde: <= 100%
- Vermelho: > 100%

---

### 3. Código Atualizado para RadialProgressCard

```typescript
const RadialProgressCard = ({ title, realized, meta, onClick, isClickable = false }: RadialProgressCardProps) => {
  const percentage = meta > 0 ? (realized / meta) * 100 : 0;
  
  // Nova lógica: Verde >= 100%, Amarelo 80-99%, Vermelho < 80%
  const getColor = () => {
    if (percentage >= 100) return "hsl(var(--chart-2))"; // Verde
    if (percentage >= 80) return "hsl(45, 93%, 47%)";    // Amarelo
    return "hsl(var(--destructive))";                    // Vermelho
  };
  
  const getTextColorClass = () => {
    if (percentage >= 100) return "text-chart-2";
    if (percentage >= 80) return "text-amber-500";
    return "text-destructive";
  };
  
  const chartData = [{ value: Math.min(percentage, 100), fill: getColor() }];
  // ...
};
```

---

### 4. Código Atualizado para MonetaryRadialCard

```typescript
const MonetaryRadialCard = ({ title, realized, meta, format, onClick, isClickable = false }: MonetaryRadialCardProps) => {
  const isInverted = format === 'duration'; // SLA
  const percentage = meta > 0 ? (realized / meta) * 100 : 0;
  
  // SLA mantém lógica binária (verde/vermelho)
  // Outros indicadores usam 3 faixas
  const getColor = () => {
    if (isInverted) {
      // SLA: menor é melhor
      return percentage <= 100 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))";
    }
    // Outros indicadores monetários
    if (percentage >= 100) return "hsl(var(--chart-2))";
    if (percentage >= 80) return "hsl(45, 93%, 47%)";
    return "hsl(var(--destructive))";
  };
  
  const getTextColorClass = () => {
    if (isInverted) {
      return percentage <= 100 ? "text-chart-2" : "text-destructive";
    }
    if (percentage >= 100) return "text-chart-2";
    if (percentage >= 80) return "text-amber-500";
    return "text-destructive";
  };
  // ...
};
```

---

### Resultado Visual

| Indicador | < 80% | 80-99% | >= 100% |
|-----------|-------|--------|---------|
| MQLs, RMs, RRs, etc. | Vermelho | Amarelo | Verde |
| Faturamento, MRR, Setup, Pontual | Vermelho | Amarelo | Verde |
| SLA | Verde (<=100%) | - | Vermelho (>100%) |

---

### Sobre o Problema do Faturamento a 100%

A imagem mostra Faturamento com R$ 400k / Meta R$ 400k = 100%. Se o valor realizado for exatamente igual à meta, a condição `percentage >= 100` deveria retornar verde. Se estiver mostrando vermelho, pode haver uma pequena diferença de arredondamento (ex: 399.999 / 400.000 = 99.9998%). A nova lógica com faixa amarela de 80-99% também ajudará a evitar essa situação, pois 99.9998% será exibido como amarelo ao invés de vermelho.
