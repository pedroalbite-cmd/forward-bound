
# Excluir MQLs Perdidos com Motivos Especificos

## Problema
Atualmente, a contagem de MQLs do Modelo Atual inclui cards que estao em "Perdido" com motivos de perda que indicam que nao sao leads reais. Esses cards nao deveriam ser contabilizados como MQL.

## Motivos de perda a excluir
- Duplicado
- Pessoa fisica, fora do ICP
- Nao e uma demanda real
- Buscando parceria
- Quer solucoes para cliente
- Nao e MQL, mas entrou como MQL

## Regra
Se o card esta com **Fase Atual = "Perdido"** E o **Motivo da perda** e um dos listados acima, ele NAO deve ser contabilizado como MQL.

## Onde aplicar

A logica de MQL do Modelo Atual usa a **Data de Criacao** do card (nao a data de entrada em fase). Os cards sao buscados via `query_period_by_creation` e podem estar em qualquer fase, incluindo "Perdido". A filtragem precisa ser adicionada em 3 lugares:

### 1. `src/hooks/useModeloAtualMetas.ts` (hook de metas/volumes)
- Adicionar `motivoPerda` e ajustar `faseAtual` no tipo `ModeloAtualMovement`
- Parsear o campo `Motivo da perda` do banco de dados ao construir os movements e mqlByCreation
- Criar constante `MQL_EXCLUDED_LOSS_REASONS` com os 6 motivos
- Criar funcao `isMqlExcludedByLoss(faseAtual, motivoPerda)` que retorna true se Fase Atual = "Perdido" E motivo esta na lista
- Adicionar filtro nas contagens de MQL: alem de `isMqlQualified(faixa)`, tambem verificar `!isMqlExcludedByLoss(faseAtual, motivoPerda)`
- Exportar a funcao para uso no hook de analytics

### 2. `src/hooks/useModeloAtualAnalytics.ts` (hook de analytics/indicadores)
- Adicionar campos `motivoPerda` e `faseAtual` ao tipo `ModeloAtualCard`
- Parsear `Motivo da perda` e `Fase Atual` na funcao `parseCardRow`
- Importar `isMqlExcludedByLoss` do hook de metas
- Aplicar o filtro em `getCardsForIndicator` quando `indicator === 'mql'`
- Aplicar o filtro no `firstEntryByCardAndIndicator` quando construindo entradas de MQL
- Aplicar no `getDetailItemsWithFullHistory` para MQL

### 3. Verificar impacto nos outros hooks
- `useO2TaxAnalytics.ts` e `useExpansaoAnalytics.ts` ja possuem `motivoPerda` parseado, mas a regra solicitada e especifica para o Modelo Atual (pipefy_moviment_cfos). NAO sera aplicada nesses hooks a menos que solicitado.

## Detalhe Tecnico

A constante e funcao de exclusao:

```text
MQL_EXCLUDED_LOSS_REASONS = [
  'Duplicado',
  'Pessoa física, fora do ICP',
  'Não é uma demanda real',
  'Buscando parceria',
  'Quer soluções para cliente',
  'Não é MQL, mas entrou como MQL',
]

isMqlExcludedByLoss(faseAtual, motivoPerda):
  return faseAtual === 'Perdido' AND motivoPerda IN MQL_EXCLUDED_LOSS_REASONS
```

## Resultado
Cards perdidos com esses motivos serao automaticamente excluidos da contagem de MQLs no dashboard, tanto nos indicadores quanto nas metas, mantendo uma contagem mais precisa de leads realmente qualificados.
