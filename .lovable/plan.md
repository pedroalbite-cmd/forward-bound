

## Limitar a 1 entrada por card por fase por mês

### O que muda
Atualmente, após a mudança "Every Entry", o mesmo card pode aparecer N vezes na mesma fase se tiver N movimentações distintas no período. O pedido é: **no máximo 1 contagem por card por fase por mês**. Se o card entrou em RM duas vezes em março, conta só 1. Se entrou em março e abril, conta 1 em cada.

### Alteração técnica
Nos 3 hooks, trocar a chave de deduplicação de `card.id|card.fase|timestamp` para `card.id|card.fase|YYYY-MM`:

```typescript
// ANTES
const key = `${card.id}|${card.fase}|${entryTime}`;

// DEPOIS
const month = `${card.dataEntrada.getFullYear()}-${card.dataEntrada.getMonth()}`;
const key = `${card.id}|${card.fase}|${month}`;
```

Isso garante que o mesmo card na mesma fase no mesmo mês só é contado uma vez, mas aparece em meses diferentes se tiver entradas em meses diferentes.

### Arquivos
- `src/hooks/useModeloAtualAnalytics.ts` — `getCardsForIndicator`
- `src/hooks/useO2TaxAnalytics.ts` — `getCardsForIndicator`
- `src/hooks/useExpansaoAnalytics.ts` — `getCardsForIndicator`

