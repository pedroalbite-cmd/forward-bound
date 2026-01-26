

## Plano: Aplicar Filtro de Closers nos Valores Monetários do Funil

### Problema Identificado

Os valores monetários de "Proposta Enviada" e "Contrato Assinado" no funil ainda usam `getModeloAtualValue()` que retorna o total sem filtro de closers. Isso significa que mesmo com Pedro ou Daniel selecionado, os valores R$ continuam mostrando o total geral.

---

### Solução

Criar uma função auxiliar `getFilteredModeloAtualValue` que soma os valores (`card.valor`) apenas dos cards que passam no filtro de closers.

---

### Arquivo a Modificar

| Arquivo | Linha(s) | Mudança |
|---------|----------|---------|
| `src/components/planning/ClickableFunnelChart.tsx` | 66-73 e 123-142 | Adicionar helper e refatorar cálculo de valores |

---

### Mudanças Técnicas

#### 1. Adicionar função auxiliar para valores filtrados (após linha 73)

```typescript
// Helper to get filtered value for Modelo Atual when closers filter is active
const getFilteredModeloAtualValue = (indicator: 'proposta' | 'venda'): number => {
  if (selectedClosers?.length && selectedClosers.length > 0) {
    const cards = modeloAtualAnalytics.getCardsForIndicator(indicator);
    const filteredCards = cards.filter(c => selectedClosers.includes(c.responsavel || ''));
    return filteredCards.reduce((sum, card) => sum + card.valor, 0);
  }
  return getModeloAtualValue(indicator, startDate, endDate);
};
```

#### 2. Atualizar cálculo de propostaValue (linha 123-132)

**Antes:**
```typescript
const propostaValue = useConsolidado
  ? getModeloAtualValue('proposta', startDate, endDate) + getO2TaxValue('proposta', ...) + ...
  : ...
  : getModeloAtualValue('proposta', startDate, endDate);
```

**Depois:**
```typescript
const propostaValue = useConsolidado
  ? getFilteredModeloAtualValue('proposta') + getO2TaxValue('proposta', ...) + ...
  : ...
  : getFilteredModeloAtualValue('proposta');
```

#### 3. Atualizar cálculo de vendaValue (linha 134-142)

**Antes:**
```typescript
const vendaValue = useConsolidado
  ? getModeloAtualValue('venda', startDate, endDate) + getO2TaxValue('venda', ...) + ...
  : ...
  : getModeloAtualValue('venda', startDate, endDate);
```

**Depois:**
```typescript
const vendaValue = useConsolidado
  ? getFilteredModeloAtualValue('venda') + getO2TaxValue('venda', ...) + ...
  : ...
  : getFilteredModeloAtualValue('venda');
```

---

### Comportamento Esperado

| Cenário | Proposta Enviada | Contratos Assinados |
|---------|------------------|---------------------|
| Sem filtro | Soma total de todas as propostas | Soma total de todos os contratos |
| Pedro selecionado | Apenas propostas onde `responsavel = "Pedro Albite"` | Apenas contratos de Pedro |
| Daniel selecionado | Apenas propostas onde `responsavel = "Daniel Trindade"` | Apenas contratos de Daniel |
| Ambos selecionados | Soma de Pedro + Daniel | Soma de Pedro + Daniel |
| O2 TAX / Franquia / Oxy Hacker | Valores dessas BUs (sem filtro de closer) | Valores dessas BUs |

---

### Resumo

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/components/planning/ClickableFunnelChart.tsx` | Adicionar `getFilteredModeloAtualValue` e aplicar nos cálculos de `propostaValue` e `vendaValue` |

