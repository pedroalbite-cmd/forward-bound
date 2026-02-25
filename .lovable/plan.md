

# Correcao: Eventos nao aparecem na atribuicao de Marketing

## Problema identificado

A funcao `parseCards()` em `useModeloAtualAnalytics.ts` filtra cards cuja fase NAO esta no mapa `PHASE_TO_INDICATOR`. Cards de eventos (com `Origem do lead` = "G4 Eventos", "G4 Frontier", etc.) que estao em fases como "Remarcar reuniao / No show" ou "Em contato" sao descartados antes de chegarem a logica de atribuicao no `MarketingIndicatorsTab`.

Confirmei no banco que existem cards com "Origem do lead" contendo "G4 Eventos" e "G4 Frontier", mas eles estao em fases nao mapeadas e por isso sao excluidos pelo filtro de fase.

## Solucao

Expor uma propriedade adicional `allCards` (sem filtro de fase) no retorno de `useModeloAtualAnalytics` para uso exclusivo pela atribuicao de marketing. O array `cards` existente continua inalterado para os indicadores de funil.

### Arquivo 1: `src/hooks/useModeloAtualAnalytics.ts`

1. Na query function, apos o `parseCards(periodResponse.data.data)` existente (linha 275), adicionar um parse sem filtro de fase:

```typescript
const allCardsUnfiltered = parseCards(periodResponse.data.data, true); // skipPhaseFilter=true
```

2. Incluir `allCardsUnfiltered` no retorno da query (junto com `cards`, `fullHistory`, `mqlByCreation`).

3. Expor `allCards` no retorno do hook:

```typescript
const allCards = data?.allCardsUnfiltered ?? [];
```

4. Adicionar `allCards` ao objeto retornado pelo hook.

### Arquivo 2: `src/components/planning/MarketingIndicatorsTab.tsx`

Alterar a desestruturacao na linha 127 para usar `allCards` em vez de `cards` para a atribuicao:

```typescript
const { cards: modeloAtualCards, allCards: modeloAtualAllCards, isLoading: isLoadingMACards } = useModeloAtualAnalytics(...);
```

E no `useMemo` de `allAttributionCards`, usar `modeloAtualAllCards` em vez de `modeloAtualCards` para o loop do Modelo Atual.

### Arquivo 3: Logica de deteccao de canal (ajuste menor)

Atualmente `g4` no campo `origemLead` classifica como "eventos", mas "G4 Frontier" nao e um evento - e o programa G4 de educacao executiva. Ajustar a deteccao para ser mais especifica:

```typescript
if (tipo.includes('evento') || origem.includes('evento')) return 'eventos';
```

Remover a checagem generica de "g4" para evitar falsos positivos (G4 Frontier, G4 Educacao, etc. nao sao eventos). Manter apenas "evento" como keyword.

## Resultado esperado

Cards de todas as fases serao considerados na atribuicao de marketing, e aqueles com "Origem do lead" contendo "Evento" (como "G4 Eventos") aparecerao corretamente no card de Eventos.

