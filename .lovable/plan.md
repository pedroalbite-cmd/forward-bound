
# Corrigir MQL para excluir fase "Start form"

## Problema
Atualmente, o indicador MQL inclui cards da fase "Start form" porque:
1. O mapeamento `PHASE_TO_INDICATOR` mapeia "Start form" e "Lead" ambos para `'leads'`
2. A logica de MQL faz uniao de `'leads' + 'mql'`, incluindo "Start form" indevidamente

O correto: MQL deve contar apenas cards que passaram pelas fases "Lead" ou "MQL", nunca "Start form".

## Solucao

Separar o mapeamento de "Start form" para que o MQL possa diferenciar.

### Arquivo 1: `src/hooks/useExpansaoAnalytics.ts`

Alterar a logica de `getCardsForIndicator` (linha ~278-281) para nao usar a uniao generica quando o indicador for 'mql'. Em vez disso, verificar diretamente as fases do card:

```
// Antes:
const indicatorsToCheck = (indicator === 'leads' || indicator === 'mql')
  ? ['leads', 'mql'] as IndicatorType[]
  : [indicator];

// Depois: para MQL, filtrar apenas fases "Lead" e "MQL" (excluir "Start form")
// para Leads, manter o comportamento atual (todas as fases de lead)
```

Na pratica, o `firstEntryByCardAndIndicator` agrupa "Start form" e "Lead" ambos sob 'leads'. Para diferenciar, a solucao mais limpa eh adicionar uma verificacao extra: quando o indicador for 'mql', percorrer os cards e verificar se a fase original eh "Lead" ou "MQL" (nunca "Start form").

Implementacao:
- Quando `indicator === 'mql'`: iterar cards com indicador 'leads' ou 'mql', mas so incluir se `card.fase !== 'Start form'`
- Quando `indicator === 'leads'`: manter comportamento atual (uniao de leads + mql)

### Arquivo 2: `src/hooks/useExpansaoMetas.ts`

Na funcao `getQtyForPeriod` (linha ~130-136):

```
// Antes:
} else if (indicator === 'mql' && movementIndicator === 'leads') {
  uniqueCards.add(movement.id);
}

// Depois: so incluir se fase for "Lead" ou "MQL", nao "Start form"
} else if (indicator === 'mql' && (movement.fase === 'Lead' || movement.fase === 'MQL')) {
  uniqueCards.add(movement.id);
}
```

Mesma alteracao em `getValueForPeriod` e `countUniqueCardsInPeriod`.

### Arquivo 3: `src/hooks/useOxyHackerMetas.ts`

Mesma logica aplicada nas funcoes equivalentes de `getQtyForPeriod`, `getValueForPeriod` e `countUniqueCardsInPeriod`.

## Resultado esperado

- MQL para Oxy Hacker e Franquia: mostra apenas cards que entraram na fase "Lead" ou "MQL" (exclui "Start form")
- Leads continua mostrando todos os cards ("Start form" + "Lead" + "MQL")
- O filtro por produto ("Oxy Hacker" ou "Franquia") continua funcionando como antes
- Sem duplicatas (unicidade por card ID mantida)
