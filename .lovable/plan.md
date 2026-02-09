

# Corrigir contagem de vendas: usar Data de Assinatura do Contrato

## Problema

O sistema mostra apenas 13 vendas em Janeiro quando o Pipefy mostra 18. A causa raiz: o sistema usa a data de **Entrada** na fase "Contrato assinado" para determinar o mes da venda. Porem, alguns cards sao assinados em Janeiro mas movidos para "Contrato assinado" no Pipefy apenas em Fevereiro. O campo **"Data de assinatura do contrato"** tem a data correta, mas nao e usado na filtragem por periodo.

## Solucao

Priorizar o campo `Data de assinatura do contrato` sobre `Entrada` ao determinar a data do evento de venda. Quando preenchido, esse campo substitui a data de Entrada para fins de contagem no periodo.

## Arquivos a modificar

### 1. `src/hooks/useModeloAtualMetas.ts`

**Parsing (linhas 165-200):**
- Adicionar parsing de `Data de assinatura do contrato` como `dataAssinatura`
- Para movimentos na fase `'Contrato assinado'`: se `dataAssinatura` existir, sobrescrever `dataEntrada` com `dataAssinatura`
- Adicionar `dataAssinatura` ao tipo `ModeloAtualMovement`

Isso corrige automaticamente `getQtyForPeriod('venda')`, `getValueForPeriod('venda')`, `countForWindow('venda')` e `getGroupedData('venda')`, pois todos usam `movement.dataEntrada`.

### 2. `src/hooks/useModeloAtualAnalytics.ts`

**No `firstEntryByCardAndIndicator` (linhas 275-303):**
- Para o indicador `'venda'`: ao determinar a data mais antiga, usar `card.dataAssinatura || card.dataEntrada` como data efetiva
- Isso garante que o first-entry use a data real da assinatura

**No `getCardsForIndicator` (linhas 307-351):**
- Para `'venda'`: usar `firstEntry.dataAssinatura?.getTime() || firstEntry.dataEntrada.getTime()` ao verificar se esta dentro do periodo

**No `toDetailItem` (linhas 360-377):**
- Para vendas, usar `dataAssinatura` como `date` quando disponivel (para exibicao correta no drill-down)

## Impacto

- A contagem de vendas passara de 13 para 18 em Janeiro (compativel com o XLSX do Pipefy)
- O calculo de receita realizada (`useIndicatorsRealized`) tambem sera corrigido automaticamente, pois usa `getValueForPeriod('venda')` do `useModeloAtualMetas`
- Os graficos e drill-downs na aba Indicadores refletirao os dados corretos
- Nenhum outro indicador (leads, mql, rm, rr, proposta) e afetado -- a mudanca so se aplica quando `fase === 'Contrato assinado'` E `Data de assinatura do contrato` esta preenchido

## Detalhes tecnicos

A regra de priorizacao:
```text
data_efetiva_venda = dataAssinatura ?? dataEntrada
```

Aplicada APENAS para o indicador 'venda' (fase 'Contrato assinado'). Todos os outros indicadores continuam usando `Entrada` normalmente.

