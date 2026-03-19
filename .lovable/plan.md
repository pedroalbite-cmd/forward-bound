

## Filtrar cards de teste da contagem de MQL

### Problema
4 cards de teste (TESTE, 123, Empresa Teste, teste duda) estão inflando a contagem de MQL de 265 para 269.

### Solução
Adicionar uma função `isTestCard` em `useModeloAtualMetas.ts` que identifica cards de teste pelo título, e aplicar esse filtro em todos os pontos de contagem de MQL.

### Arquivos alterados

**1. `src/hooks/useModeloAtualMetas.ts`**
- Criar função exportada `isTestCard(titulo: string): boolean` que verifica se o título normalizado é um dos valores de teste conhecidos: `teste`, `123`, `empresa teste`, `teste duda`, `joao`
- Adicionar filtro `!isTestCard(movement.titulo)` no loop de `getQtyForPeriod` para MQL (linha 368)

**2. `src/hooks/useModeloAtualAnalytics.ts`**
- Importar `isTestCard` de `useModeloAtualMetas`
- Adicionar filtro `!isTestCard(card.titulo)` em `getCardsForIndicator` para MQL (linha 410)
- Adicionar filtro em `getExcludedMqlCount` para não contar cards de teste como excluídos
- Adicionar filtro em `firstEntryByCardAndIndicator` para MQL

### Detalhes técnicos

```typescript
// Títulos de cards de teste (normalizados)
const TEST_CARD_TITLES = ['teste', '123', 'empresa teste', 'teste duda', 'joao'];

export function isTestCard(titulo?: string): boolean {
  if (!titulo) return false;
  const normalized = normalizeStr(titulo);
  return TEST_CARD_TITLES.includes(normalized);
}
```

Resultado esperado: MQL março passa de 269 → 265, alinhado com o Pipefy.

