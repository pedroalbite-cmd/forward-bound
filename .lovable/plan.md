
# Plano: Corrigir Sincronização MQL entre Acelerômetro e Drill-Down

## Problema Identificado

O componente `LeadsMqlsStackedChart.tsx` (gráfico de barras MQL) ainda usa `getQtyForPeriod` para calcular o total exibido, enquanto o drill-down usa `getCardsForIndicator`. Isso causa a discrepância:

| Componente | Valor | Função Usada |
|------------|-------|--------------|
| Acelerômetro | 73 | `getModeloAtualQty('mql')` → conta qualquer movimento |
| Drill-down | 69 | `modeloAtualAnalytics.getCardsForIndicator('mql')` → conta primeira entrada |

## Solução

Modificar `LeadsMqlsStackedChart.tsx` para usar `getCardsForIndicator` de TODOS os hooks de analytics em vez de `getQtyForPeriod`.

## Arquivo a Modificar

### `src/components/planning/LeadsMqlsStackedChart.tsx`

**Mudanças na função `getTotalRealized` (linhas 123-145):**

```text
ANTES:
const getTotalRealized = (): number => {
  let total = 0;
  
  if (includesModeloAtual) {
    if (selectedClosers?.length && selectedClosers.length > 0) {
      const cards = modeloAtualAnalytics.getCardsForIndicator('mql');
      const filteredCards = cards.filter(c => { ... });
      total += filteredCards.length;
    } else {
      total += getModeloAtualQty('mql', startDate, endDate);  // ❌ ERRADO
    }
  }
  
  if (includesO2Tax) total += getO2TaxQty('mql', startDate, endDate);  // ❌ ERRADO
  if (includesOxyHacker) total += getOxyHackerQty('mql', startDate, endDate);  // ❌ ERRADO
  if (includesFranquia) total += getExpansaoQty('mql', startDate, endDate);  // ❌ ERRADO
  
  return total;
};

DEPOIS:
const getTotalRealized = (): number => {
  let total = 0;
  
  if (includesModeloAtual) {
    if (selectedClosers?.length && selectedClosers.length > 0) {
      const cards = modeloAtualAnalytics.getCardsForIndicator('mql');
      const filteredCards = cards.filter(c => {
        const closerValue = (c.closer || '').trim();
        return closerValue && selectedClosers.includes(closerValue);
      });
      total += filteredCards.length;
    } else {
      total += modeloAtualAnalytics.getCardsForIndicator('mql').length;  // ✅ CORRETO
    }
  }
  
  if (includesO2Tax) total += o2TaxAnalytics.getDetailItemsForIndicator('mql').length;  // ✅ CORRETO
  if (includesOxyHacker) total += oxyHackerAnalytics.getDetailItemsForIndicator('mql').length;  // ✅ CORRETO
  if (includesFranquia) total += franquiaAnalytics.getDetailItemsForIndicator('mql').length;  // ✅ CORRETO
  
  return total;
};
```

## Resultado Esperado

Após a correção:
- **Acelerômetro**: 69 MQLs (usa lógica de primeira entrada)
- **Drill-down**: 69 MQLs (usa lógica de primeira entrada)

Os 4 cards que não aparecem são aqueles cuja primeira entrada em MQL foi em período anterior (ex: Janeiro).
