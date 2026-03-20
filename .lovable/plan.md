

## Subtrair excluídos da contagem de MQL e manter badge no acelerômetro

### Problema atual
A contagem de MQL inclui **todos** os cards qualificados, e o badge "X excluídos" é apenas informativo. O usuário quer que os cards com motivos de exclusão (Duplicado, Pessoa física, etc.) sejam **retirados** da contagem principal, mas o número de excluídos continue aparecendo embaixo no acelerômetro como "perdidos".

### Solução

**1. `src/hooks/useModeloAtualMetas.ts` — subtrair excluídos do `getQtyForPeriod`**
- No bloco `if (indicator === 'mql')` (linha ~376), adicionar filtro `!excludedMqlIds.has(movement.id)` para não contar cards com motivos de exclusão
- Resultado: a contagem do funil e do acelerômetro já virá sem os excluídos

**2. `src/hooks/useModeloAtualAnalytics.ts` — subtrair excluídos do `getCardsForIndicator`**
- No bloco MQL do `getCardsForIndicator` (linha ~410), adicionar condição `!excludedMqlIds.has(card.id)` ao filtro existente
- Isso faz com que o `getRealizedForIndicator` no IndicatorsTab já retorne o número correto (sem excluídos)
- O `getExcludedMqlCount` continua calculando quantos foram excluídos (sem alteração)

**3. `src/components/planning/IndicatorsTab.tsx` — manter badge com contagem de perdidos/excluídos**
- O badge já mostra `${getExcludedMqlCount} excluídos` — nenhuma alteração necessária aqui
- O número principal do acelerômetro agora mostrará o total **sem** excluídos
- O badge continuará mostrando quantos foram retirados

### Resultado esperado
- Acelerômetro MQL: número principal = MQLs qualificados **menos** excluídos
- Badge abaixo: "X excluídos" continua visível
- Março: 269 total - 4 teste - X excluídos = contagem final alinhada

### Arquivos alterados
1. `src/hooks/useModeloAtualMetas.ts` — 1 linha alterada no `getQtyForPeriod`
2. `src/hooks/useModeloAtualAnalytics.ts` — 1 linha alterada no `getCardsForIndicator`

