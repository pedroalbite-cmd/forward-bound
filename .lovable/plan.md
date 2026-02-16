
# Fix: Valor Pontual zerado no drill-down de Propostas da Franquia

## Problema identificado

O drill-down de "Propostas Enviadas" para Franquia abre corretamente com os KPIs e colunas ajustados (sem MRR, mostrando "Valor Pontual"), porem todos os valores monetarios aparecem como R$ 0.

**Causa raiz**: No hook `useExpansaoAnalytics.ts`, a funcao `toDetailItem` mapeia `pontual: card.valorPontual`. Porem, para cards de Franquia, o valor real esta no campo `card.taxaFranquia`, e o campo `valorPontual` fica zerado.

O `buildPropostaMiniDashboard` (ja ajustado) le `item.pontual` para BUs de expansao, mas como `pontual` vem de `valorPontual` (que e 0), tudo aparece zerado.

## Solucao

### Arquivo: `src/hooks/useExpansaoAnalytics.ts`

Na funcao `toDetailItem` (linha ~309-323), usar `taxaFranquia` como valor para o campo `pontual` quando `valorPontual` estiver zerado:

```
const toDetailItem = (card: ExpansaoCard): DetailItem => ({
  ...campos existentes...,
  pontual: card.taxaFranquia > 0 ? card.taxaFranquia : card.valorPontual,
  ...
});
```

Isso garante que:
- Para Franquia: `pontual` = Taxa de franquia (campo correto)
- Para Oxy Hacker: `pontual` = valorPontual (que ja e o campo correto para Oxy Hacker)
- Fallback seguro: se ambos forem zero, continua zero

## Resultado esperado

- O drill-down de Propostas da Franquia mostrara os valores reais da Taxa de franquia nos KPIs (Valor Pontual, Ticket Medio) e na tabela
- Oxy Hacker continuara funcionando normalmente
- O2 TAX e Modelo Atual nao sao afetados (usam outro hook)
