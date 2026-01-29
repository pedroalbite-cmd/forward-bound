

## Plano: Corrigir Filtro de Closer no Cálculo de Realizado (O2 TAX)

### Problema Identificado

O filtro de Closer na aba Indicadores mostra **0** para todos os indicadores quando Lucas está selecionado na O2 TAX.

A causa está na função `getRealizedForIndicator()` no arquivo `IndicatorsTab.tsx`:

| Linha | Código Problemático |
|-------|---------------------|
| 661 | `return closerValue && closersForBU.includes(closerValue);` |
| 683 | `return closerValue && closersForBU.includes(closerValue);` |

Este código usa **comparação exata** enquanto os dados são:
- **Filtro selecionado**: `"Lucas Ilha"` (de `BU_CLOSERS.o2_tax`)
- **Valor no banco**: `"Lucas"` (apenas primeiro nome)

Resultado: `['Lucas Ilha'].includes('Lucas')` = **false**

### Solução

Substituir as comparações exatas `.includes(closerValue)` por uma **função auxiliar de match parcial** que reutiliza a mesma lógica já implementada em `matchesCloserFilter`.

---

### Seção Técnica

#### Alterações em `IndicatorsTab.tsx`

**1. Criar função helper de match parcial:**

```typescript
// Helper function for partial closer matching (reuses same logic as matchesCloserFilter)
const matchesCloserPartial = (closerValue: string, closerList: string[]): boolean => {
  if (!closerValue) return false;
  const normalizedCloser = closerValue.toLowerCase().trim();
  return closerList.some(selected => {
    const normalizedSelected = selected.toLowerCase().trim();
    return normalizedSelected.includes(normalizedCloser) || 
           normalizedCloser.includes(normalizedSelected);
  });
};
```

**2. Atualizar `getRealizedForIndicator()` - Modelo Atual (linha ~661):**

Antes:
```typescript
return closerValue && closersForBU.includes(closerValue);
```

Depois:
```typescript
return closerValue && matchesCloserPartial(closerValue, closersForBU);
```

**3. Atualizar `getRealizedForIndicator()` - O2 TAX (linha ~683):**

Antes:
```typescript
return closerValue && closersForBU.includes(closerValue);
```

Depois:
```typescript
return closerValue && matchesCloserPartial(closerValue, closersForBU);
```

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Adicionar `matchesCloserPartial()` e substituir comparações exatas por chamadas a esta função |

---

### Comportamento Esperado

Após a correção:
- Selecionar **O2 TAX** + **Lucas** → Mostra todos os indicadores com dados do Lucas
- Os totais (Realizado) corresponderão aos dados no drill-down
- A lógica será consistente em todo o componente

