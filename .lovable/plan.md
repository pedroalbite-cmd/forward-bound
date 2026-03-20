

## Aplicar lógica de exclusão de MQL também para O2 TAX

### Problema identificado

Investiguei o banco de dados via edge function e confirmei: **O2 TAX tem cards perdidos com motivos de exclusão**. Por exemplo, o card "Pub" (ID 1316314576) tem motivo "Não é MQL, mas entrou como MQL" — que é um dos motivos de exclusão. Porém, a lógica de exclusão de MQL só existe no Modelo Atual. O2 TAX não filtra nada.

Além disso, o badge "X excluídos" no acelerômetro usa fixamente `modeloAtualAnalytics.getExcludedMqlCount`, ignorando O2 TAX.

Os widgets `LostDealsWidget` e `LossReasonsWidget` existem mas estão dentro de `AnalyticsSection`, que **não é importado em nenhum lugar** — então não são renderizados.

### Solução

**1. `src/hooks/useO2TaxAnalytics.ts` — adicionar lógica de exclusão de MQL**
- Importar `isMqlExcludedByLoss`, `buildExcludedMqlCardIds` de `useModeloAtualMetas`
- Construir `excludedMqlIds` a partir do `fullHistory` (mesma lógica do Modelo Atual)
- Filtrar `excludedMqlIds` no `getCardsForIndicator` para MQL
- Adicionar `getExcludedMqlCount` que retorna a quantidade de cards excluídos no período
- Exportar `getExcludedMqlCount` no return

**2. `src/components/planning/IndicatorsTab.tsx` — badge dinâmico por BU**
- Quando `includesModeloAtual`: somar `modeloAtualAnalytics.getExcludedMqlCount`
- Quando `includesO2Tax`: somar `o2TaxAnalytics.getExcludedMqlCount`
- Badge mostra a soma total de excluídos das BUs selecionadas

### Detalhes técnicos

No `useO2TaxAnalytics.ts`:
```typescript
import { isMqlExcludedByLoss, buildExcludedMqlCardIds } from "./useModeloAtualMetas";

// Dentro do hook, após ter fullHistory:
const excludedMqlIds = useMemo(() => {
  const historyToUse = fullHistory.length > 0 ? fullHistory : cards;
  return buildExcludedMqlCardIds(
    historyToUse.map(c => ({ id: c.id, motivoPerda: c.motivoPerda || undefined }))
  );
}, [cards, fullHistory]);

// No getCardsForIndicator, para MQL:
if (excludedMqlIds.has(card.id)) continue;

// Novo getter:
const getExcludedMqlCount = useMemo(() => {
  // Contar apenas os que estão no período e são MQL qualificados
  const mqlCards = getCardsForIndicator('mql'); // já sem excluídos
  // Contar excluídos que SERIAM MQL no período
  ...
}, [...]);
```

No `IndicatorsTab.tsx`:
```typescript
const excludedMqlTotal = 
  (includesModeloAtual ? modeloAtualAnalytics.getExcludedMqlCount : 0) +
  (includesO2Tax ? o2TaxAnalytics.getExcludedMqlCount : 0);

badge={indicator.key === 'mql' && excludedMqlTotal > 0
  ? `${excludedMqlTotal} excluídos`
  : undefined}
```

### Resultado esperado
- MQL de O2 TAX será filtrado pelos mesmos motivos de exclusão do Modelo Atual
- Badge "excluídos" somará exclusões de todas as BUs selecionadas
- Card "Pub" e similares serão retirados da contagem de MQL da O2 TAX

### Arquivos alterados
1. `src/hooks/useO2TaxAnalytics.ts` — exclusão de MQL + `getExcludedMqlCount`
2. `src/components/planning/IndicatorsTab.tsx` — badge somando excluídos de múltiplas BUs

