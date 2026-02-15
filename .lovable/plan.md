
# Corrigir MQL zerado para Franquia e Oxy Hacker nos acelerometros

## Problema

Os radial cards (acelerometros) de MQL para Franquia e Oxy Hacker continuam mostrando 0, mesmo apos as alteracoes nos hooks de metas. Isso acontece porque o dashboard usa `useExpansaoAnalytics.getCardsForIndicator()` como fonte de verdade para o "realizado", e essa funcao nao foi atualizada para incluir leads como MQL.

## Causa raiz

No arquivo `src/hooks/useExpansaoAnalytics.ts`, linha 278:

```typescript
const indicatorsToCheck = indicator === 'leads' 
  ? ['leads', 'mql'] as IndicatorType[]
  : [indicator];
```

Quando `indicator === 'mql'`, o codigo so busca cards na fase `'mql'` do Pipefy. Como Franquia e Oxy Hacker raramente usam essa fase, o resultado e 0. Precisa incluir `'leads'` tambem quando o indicador for `'mql'`.

## Solucao

### Arquivo: `src/hooks/useExpansaoAnalytics.ts`

Alterar a logica de `getCardsForIndicator` (linha 278) para tambem unir leads + mql quando o indicador solicitado for `'mql'`:

```typescript
// Antes:
const indicatorsToCheck = indicator === 'leads' 
  ? ['leads', 'mql'] as IndicatorType[]
  : [indicator];

// Depois:
const indicatorsToCheck = (indicator === 'leads' || indicator === 'mql')
  ? ['leads', 'mql'] as IndicatorType[]
  : [indicator];
```

Isso faz com que, para Franquia e Oxy Hacker, o indicador MQL inclua todos os cards que passaram pela fase "Start form" (leads) e pela fase "MQL", garantindo que MQL = Leads nessas BUs.

## Resultado esperado

- Franquia: MQL passara de 1 para 22 (mesmo valor de Leads)
- Oxy Hacker: MQL passara de 0 para 20 (mesmo valor de Leads)
- Os graficos "Qtd MQLs" e "Funil do Periodo" tambem refletirao os novos valores
- Nenhuma alteracao nas BUs Modelo Atual e O2 TAX (que possuem criterio separado de MQL)

## Impacto

Apenas 1 linha alterada em 1 arquivo. A mudanca e segura pois:
- Para Modelo Atual e O2 TAX, o hook `useExpansaoAnalytics` nao e usado (usam `useModeloAtualAnalytics` e `useO2TaxAnalytics`)
- O hook `useExpansaoAnalytics` e instanciado duas vezes no IndicatorsTab: uma para Franquia e outra para Oxy Hacker
- Ambas as BUs nao possuem criterio separado de MQL, entao igualar a Leads e o comportamento correto
