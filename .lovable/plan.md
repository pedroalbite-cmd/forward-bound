

## Remover lógica de "First Entry" — contar todas as passagens por fase

### Contexto
Atualmente, o sistema conta um card apenas na **primeira vez** que ele entra em uma fase (ex: Reunião Marcada). Se o mesmo card passar pela fase novamente em outro mês, a segunda passagem é ignorada. O pedido é contar **todas** as passagens, desde que estejam dentro do período filtrado.

### Impacto
Essa mudança afeta os 3 hooks de analytics que alimentam os indicadores de funil:
- `useModeloAtualAnalytics.ts`
- `useO2TaxAnalytics.ts`
- `useExpansaoAnalytics.ts`

### Plano de alteração

**1. `useModeloAtualAnalytics.ts`**
- No `getCardsForIndicator`: para indicadores não-MQL, em vez de consultar `firstEntryByCardAndIndicator` (que guarda apenas a entrada mais antiga), iterar sobre **todos os cards** (period + fullHistory) e incluir cada movimentação cuja `dataEntrada` esteja no período selecionado.
- Remover a deduplicação por card ID — o mesmo card pode gerar múltiplas entradas.
- O `getDetailItemsForIndicator` seguirá a mesma lógica (todas as passagens no período).
- MQL continua usando data de criação (sem mudança).

**2. `useO2TaxAnalytics.ts`**
- Mesma mudança: `getCardsForIndicator` e funções derivadas (`getDealsWon`, `getMeetingsByRevenue`, etc.) passam a considerar todas as entradas no período, não apenas a primeira.

**3. `useExpansaoAnalytics.ts`**
- Mesma mudança para Franquia e Oxy Hacker.

### Detalhe técnico

Em cada hook, a lógica muda de:
```text
// ANTES: busca apenas firstEntry no mapa
const firstEntry = cardMap.get(indicator);
if (firstEntry && firstEntry.dataEntrada in period) → count

// DEPOIS: itera todos os cards/history
for (card of allCards) {
  if (phaseToIndicator[card.fase] === indicator && card.dataEntrada in period) → count
}
```

O `firstEntryByCardAndIndicator` pode ser mantido internamente para outros usos (como cálculo de SLA), mas deixa de ser o filtro principal de contagem.

### Arquivos alterados
- `src/hooks/useModeloAtualAnalytics.ts`
- `src/hooks/useO2TaxAnalytics.ts`
- `src/hooks/useExpansaoAnalytics.ts`

### Riscos
- Os números do funil vão aumentar em relação ao que era exibido antes, pois cards que passaram pela mesma fase mais de uma vez serão contados múltiplas vezes.
- O funil pode mostrar mais reuniões que leads, por exemplo, se um card passou por RM duas vezes mas por Lead apenas uma.

