

## Adicionar Tolerância de "Quase Atingiu" nos Acelerômetros Monetários

### Problema

O Faturamento está mostrando amarelo com R$ 399.832,02 / R$ 400.000 (99,96%), mas uma diferença de apenas ~R$ 168 deveria ser considerada como meta atingida para fins visuais.

---

### Solução

Adicionar uma tolerância para métricas monetárias: se a diferença entre realizado e meta for menor que **R$ 500** (ou menos de **0,5% da meta**), considerar como "verde" mesmo que tecnicamente seja < 100%.

---

### Alterações Técnicas

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/IndicatorsTab.tsx` | Adicionar lógica de tolerância no `MonetaryRadialCard` |

---

### Código Atualizado

```typescript
const MonetaryRadialCard = ({ title, realized, meta, format, onClick, isClickable = false }: MonetaryRadialCardProps) => {
  const isInverted = format === 'duration';
  const percentage = meta > 0 ? (realized / meta) * 100 : 0;
  
  // Tolerância para valores monetários: considera "atingido" se faltar menos de R$ 500
  // ou menos de 0.5% da meta (o que for menor)
  const isCurrencyFormat = format === 'currency';
  const tolerance = isCurrencyFormat ? Math.min(500, meta * 0.005) : 0;
  const isWithinTolerance = isCurrencyFormat && (meta - realized) <= tolerance && (meta - realized) >= 0;
  
  const getColor = () => {
    if (isInverted) {
      return percentage <= 100 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))";
    }
    // Considera verde se >= 100% OU dentro da tolerância
    if (percentage >= 100 || isWithinTolerance) return "hsl(var(--chart-2))"; // Verde
    if (percentage >= 80) return "hsl(45, 93%, 47%)";    // Amarelo
    return "hsl(var(--destructive))";                    // Vermelho
  };
  
  const getTextColorClass = () => {
    if (isInverted) {
      return percentage <= 100 ? "text-chart-2" : "text-destructive";
    }
    if (percentage >= 100 || isWithinTolerance) return "text-chart-2";
    if (percentage >= 80) return "text-amber-500";
    return "text-destructive";
  };
  // ...
};
```

---

### Lógica da Tolerância

| Meta | Tolerância Calculada | Limite para Verde |
|------|---------------------|-------------------|
| R$ 400.000 | min(500, 2000) = R$ 500 | R$ 399.500+ |
| R$ 100.000 | min(500, 500) = R$ 500 | R$ 99.500+ |
| R$ 50.000 | min(500, 250) = R$ 250 | R$ 49.750+ |

---

### Resultado

- **Faturamento R$ 399.832 / Meta R$ 400.000**: Diferença de R$ 168 < R$ 500 → **VERDE** ✅
- **Faturamento R$ 350.000 / Meta R$ 400.000**: Diferença de R$ 50.000 > R$ 500 → Amarelo (87,5%)
- **SLA**: Mantém lógica invertida sem tolerância

