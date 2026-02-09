

# Alinhar MQL do O2 TAX com logica do Modelo Atual (threshold >= R$ 500k)

## Contexto

O Modelo Atual conta MQLs por **Data de Criacao** + **faturamento >= R$ 200k**. O O2 TAX deve usar a mesma logica, mas com threshold de **>= R$ 500k**.

## Mudancas

### 1. `src/hooks/useO2TaxAnalytics.ts`

- Adicionar campo `dataCriacao` ao `O2TaxCard` interface e ao `parseRawCard` (parsear `row['Data Criação']`)
- Na queryFn, apos buscar movements por `query_period`, fazer segunda chamada `query_period_by_creation` na tabela `pipefy_cards_movements` para o mesmo periodo, armazenar como `mqlByCreation`
- Criar funcao `isO2TaxMqlQualified(faixa)` com tiers >= R$ 500k:
  - `'Entre R$ 500 mil e R$ 1 milhão'`
  - `'Entre R$ 1 milhão e R$ 5 milhões'`
  - `'Acima de R$ 5 milhões'`
- Em `getCardsForIndicator`: quando `indicator === 'mql'`, usar `mqlByCreation` filtrado por `dataCriacao` no periodo + `isO2TaxMqlQualified(faixa)`, deduplicando por card ID
- Em `getDetailItemsForIndicator`: mesma logica para MQL drill-down
- Em `firstEntryByCardAndIndicator`: para MQL, validar `isO2TaxMqlQualified` antes de incluir

### 2. `src/hooks/useO2TaxMetas.ts`

- Adicionar `dataCriacao` ao `O2TaxMovement` e parsear `row['Data Criação']`
- Adicionar `faixaFaturamento` ao `O2TaxMovement` e parsear `row['Faixa de faturamento mensal']`
- Na queryFn, adicionar segunda chamada `query_period_by_creation` na tabela `pipefy_cards_movements`, armazenar como `mqlByCreation`
- Em `getQtyForPeriod`: quando `indicator === 'mql'`, contar cards unicos de `mqlByCreation` onde `dataCriacao` esta no periodo e `isO2TaxMqlQualified(faixa)` retorna true
- Em `countUniqueCardsInPeriod` (usado por `getGroupedData`): mesma logica para MQL nos graficos de barras

### Funcao de qualificacao

```text
O2_TAX_MQL_QUALIFYING_TIERS = [
  'Entre R$ 500 mil e R$ 1 milhão',
  'Entre R$ 1 milhão e R$ 5 milhões',
  'Acima de R$ 5 milhões',
]
```

## Resultado esperado

- MQL O2 TAX passara a contar cards **criados no periodo** com faturamento **>= R$ 500k**
- Dos ~55 cards da planilha (Fev 1-9), apenas os com faixa >= R$ 500k serao contados como MQL
- Drill-down de MQL mostrara exatamente os mesmos cards
- Graficos temporais agruparao MQLs pela data de criacao
- Outros indicadores (leads, RM, RR, proposta, venda) permanecem inalterados
