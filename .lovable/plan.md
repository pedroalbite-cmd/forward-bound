

## Plano: Corrigir Filtro de Closers que Está Zerando Vendas

### Problema Identificado

Após a mudança para separar o campo `closer` do campo `responsavel`, os totais de vendas estão zerados ou incorretos, mesmo quando o filtro de closers é removido. O problema parece estar na lógica de filtro que não consegue encontrar correspondência entre os valores do filtro e os valores do campo `closer` nos cards.

### Análise Técnica

1. **Dados no banco confirmados**: Vendas de janeiro 2026 têm `"Closer responsável": "Pedro Albite"` corretamente preenchido

2. **Fluxo atual do código**:
   - `getFilteredModeloAtualQty` verifica se `selectedClosers.length > 0`
   - Se sim, filtra cards por `c.closer`
   - Se não, usa `getModeloAtualQty` de `useModeloAtualMetas`

3. **Problema potencial**: O campo `closer` pode estar vindo como `undefined` ou `null` ao invés de string vazia quando o valor não existe, causando falha na comparação

### Solução Proposta

Modificar o código para ser mais robusto na comparação de closers, verificando explicitamente por valores válidos:

#### 1. Atualizar `useModeloAtualAnalytics.ts` - Garantir campo closer sempre definido

| Linha | Mudança |
|-------|---------|
| 159 | Usar nullish coalescing mais robusto |

**Antes:**
```typescript
closer: row['Closer responsável'] || '',
```

**Depois:**
```typescript
closer: String(row['Closer responsável'] ?? '').trim(),
```

Isso garante que:
- Valores `null` ou `undefined` virem `''`
- Espaços em branco extras sejam removidos
- O valor sempre seja uma string

#### 2. Atualizar `ClickableFunnelChart.tsx` - Melhorar robustez do filtro

| Função | Mudança |
|--------|---------|
| `getFilteredModeloAtualQty` | Adicionar logging e trim nos valores |
| `getFilteredModeloAtualValue` | Mesma correção |

**Antes:**
```typescript
return cards.filter(c => selectedClosers.includes(c.closer || '')).length;
```

**Depois:**
```typescript
const filteredCards = cards.filter(c => {
  const closerValue = (c.closer || '').trim();
  return closerValue && selectedClosers.includes(closerValue);
});
console.log(`[ClickableFunnelChart] Filter ${indicator}: ${cards.length} total, ${filteredCards.length} matched closers ${selectedClosers.join(',')}`);
return filteredCards.length;
```

#### 3. Adicionar logs de diagnóstico temporários

Para identificar o valor exato de `closer` nos cards, adicionar logs:

```typescript
// Em getCardsForIndicator ou no mapping
console.log(`[ModeloAtualAnalytics] Card ${card.id} closer: "${card.closer}" (typeof: ${typeof card.closer})`);
```

### Arquivos a Modificar

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/hooks/useModeloAtualAnalytics.ts` | Usar `String().trim()` para normalizar campo closer |
| `src/components/planning/ClickableFunnelChart.tsx` | Adicionar trim e validação no filtro |
| `src/components/planning/LeadsStackedChart.tsx` | Mesma correção no filtro de closers |
| `src/components/planning/LeadsMqlsStackedChart.tsx` | Mesma correção no filtro de closers |
| `src/components/planning/IndicatorsTab.tsx` | Mesma correção no filtro de closers |

### Comportamento Esperado Após Correção

| Cenário | Resultado |
|---------|-----------|
| Sem filtro de closers | Mostra todas as vendas (6 cards conforme logs) |
| Filtro Pedro ativo | Mostra apenas vendas de Pedro (3+ vendas confirmadas no banco) |
| Filtro Daniel ativo | Mostra apenas vendas de Daniel |
| Ambos selecionados | Mostra vendas de Pedro + Daniel |

### Validação

Após a correção, verificar nos logs do console:
1. `[ClickableFunnelChart] Filter venda: X total, Y matched closers Pedro Albite` → Y deve ser > 0
2. Os valores de venda no funil devem corresponder aos cards filtrados

