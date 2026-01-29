

## Plano: Corrigir Filtro de Closer para O2 TAX

### Problema Identificado

O filtro de Closers não funciona para a BU **O2 TAX** porque:

| Fonte | Campo `Closer responsável` | Mapeamento |
|-------|---------------------------|------------|
| `pipefy_moviment_cfos` (Modelo Atual) | `"Daniel Trindade"` | `BU_CLOSERS['modelo_atual']` = `['Pedro Albite', 'Daniel Trindade']` |
| `pipefy_cards_movements` (O2 TAX) | `"Lucas"` | `BU_CLOSERS['o2_tax']` = `['Lucas Ilha']` |

A função `matchesCloserFilter` usa comparação **exata**: `selectedClosers.includes(responsavel)`, então:
- `"Lucas Ilha".includes("Lucas")` → **FALSE** (falha!)

### Solução

Modificar a função `matchesCloserFilter` para usar comparação **parcial** (case-insensitive), similar ao que já fazemos com `matchesSdrFilter`.

---

### Seção Técnica

#### Alteração em `IndicatorsTab.tsx`

Antes:
```typescript
const matchesCloserFilter = (responsavel?: string | null): boolean => {
  if (selectedClosers.length === 0) return true;
  if (!responsavel) return false;
  return selectedClosers.includes(responsavel); // Comparação exata - FALHA!
};
```

Depois:
```typescript
const matchesCloserFilter = (closerValue?: string | null): boolean => {
  if (selectedClosers.length === 0) return true;
  if (!closerValue) return false;
  
  // Comparação parcial (case-insensitive) para lidar com variações de nome
  // Ex: "Lucas" no banco deve corresponder a "Lucas Ilha" no filtro
  const normalizedCloser = closerValue.toLowerCase().trim();
  return selectedClosers.some(selected => {
    const normalizedSelected = selected.toLowerCase().trim();
    // Match se o closer do banco está contido no filtro OU vice-versa
    return normalizedSelected.includes(normalizedCloser) || 
           normalizedCloser.includes(normalizedSelected);
  });
};
```

---

### Por que Comparação Bidirecional?

| Valor no Banco | Valor no Filtro | `banco.includes(filtro)` | `filtro.includes(banco)` | Resultado |
|----------------|-----------------|-------------------------|-------------------------|-----------|
| `"Lucas"` | `"Lucas Ilha"` | false | true | Match |
| `"Daniel Trindade"` | `"Daniel Trindade"` | true | true | Match |
| `"Pedro Albite"` | `"Pedro Albite"` | true | true | Match |

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Alterar `matchesCloserFilter` para usar comparação parcial bidirecional |

---

### Comportamento Esperado

Após a correção:
1. Selecionar **Lucas** na O2 TAX → Mostra todos os registros com `Closer responsável = "Lucas"`
2. Selecionar **Pedro** no Modelo Atual → Mostra todos os registros com `Closer responsável = "Pedro Albite"`
3. Selecionar **Daniel** no Modelo Atual → Mostra todos os registros com `Closer responsável = "Daniel Trindade"`

