

# Corrigir contagem de vendas: bug do limite de 500 card IDs

## Causa raiz identificada

A edge function `query_card_history` limita a consulta a 500 card IDs. O sistema tem mais de 500 cards unicos no periodo (Janeiro). Os 5 cards de venda faltantes foram corretamente capturados pela query `query_period_by_signature` e estao no array `cards`, porem seus IDs ficaram apos a posicao 500 no array `uniqueCardIds`.

Na linha 312, o codigo usa `fullHistory` exclusivamente quando disponivel:
```text
const historyToUse = fullHistory.length > 0 ? fullHistory : cards
```

Como `fullHistory` nao contem os 5 cards (truncados pelo limite de 500), eles nunca entram no `firstEntryByCardAndIndicator`, e `getCardsForIndicator('venda')` retorna 13 em vez de 18.

## Solucao

### Arquivo: `src/hooks/useModeloAtualAnalytics.ts`

**Mudanca 1 - Linha 312**: Combinar `fullHistory` E `cards` em vez de usar um ou outro:
```text
const historyToUse = [...fullHistory, ...cards];
```

A logica de "manter a entrada mais antiga" (`effectiveDate < existingDate`) ja trata duplicatas naturalmente -- entradas duplicadas sao simplesmente substituidas pela mais antiga. Isso garante que cards presentes em `cards` mas ausentes de `fullHistory` sejam incluidos.

**Por que isso funciona**: 
- Cards que estao em ambos (`fullHistory` e `cards`): a logica "keep earliest" seleciona a entrada mais antiga do fullHistory
- Cards que estao so em `cards` (os 5 faltantes): sao incluidos porque agora fazem parte do `historyToUse`
- Nenhum dado e perdido ou duplicado incorretamente

### Nenhuma outra mudanca necessaria

- A edge function ja funciona corretamente (retorna 197 rows por assinatura)
- O `parseCardRow` ja sobrescreve `dataEntrada = dataAssinatura` para "Contrato assinado"
- O `getCardsForIndicator` ja usa `dataAssinatura` como effective date para vendas

## Resultado esperado

`getCardsForIndicator('venda')` retornara 18 cards em Janeiro, alinhado com `useModeloAtualMetas`.

