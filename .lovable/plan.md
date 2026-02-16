
# Corrigir limite de 500 IDs no query_card_history para O2 TAX Analytics

## Problema

O hook `useO2TaxAnalytics` busca o historico completo dos cards via `query_card_history`, mas essa acao tem um limite de 500 IDs. Em fevereiro, existem mais de 500 cards unicos no periodo, entao cards como o ROBSUS79 ficam de fora do historico e nao aparecem nos indicadores.

**Evidencia**: O log do console mostra `"Built first entry map for 500 cards"` - exatamente 500, confirmando o truncamento.

## Solucao

Enviar os IDs em lotes (batches) de 500 para o `query_card_history`, e depois combinar todos os resultados. Isso garante que TODOS os cards do periodo tenham seu historico completo carregado.

## Mudanca

### Arquivo: `src/hooks/useO2TaxAnalytics.ts`

Na funcao `queryFn` (linhas ~194-207), substituir a chamada unica de `query_card_history` por um loop que envia lotes de 500 IDs:

```typescript
// Antes: uma unica chamada com todos os IDs (truncada em 500)
const { data: historyData } = await supabase.functions.invoke('query-external-db', {
  body: { table: 'pipefy_cards_movements', action: 'query_card_history', cardIds: uniqueCardIds }
});

// Depois: enviar em lotes de 500
const BATCH_SIZE = 500;
let fullHistory = [];
for (let i = 0; i < uniqueCardIds.length; i += BATCH_SIZE) {
  const batch = uniqueCardIds.slice(i, i + BATCH_SIZE);
  const { data: historyData } = await supabase.functions.invoke('query-external-db', {
    body: { table: 'pipefy_cards_movements', action: 'query_card_history', cardIds: batch }
  });
  if (historyData?.data) {
    fullHistory.push(...historyData.data.map(parseRawCard));
  }
}
```

## Resultado esperado

- Todos os cards do periodo terao seu historico completo carregado, independente da quantidade
- O ROBSUS79 aparecera corretamente no indicador de Proposta da O2 TAX
- O log mostrara mais de 500 cards no first entry map
