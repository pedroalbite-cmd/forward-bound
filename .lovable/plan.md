

## Plano: Filtrar Itens do Drill-Down por Closer

### Problema Identificado

Quando você clica nos valores monetários (Proposta Enviada ou Contrato Assinado) com o filtro de closer ativo (ex: só Pedro), a lista no DetailSheet ainda mostra registros de todos os closers (Pedro + Daniel). Isso acontece porque a função `getItemsForIndicator` não aplica o filtro de closers aos itens retornados.

---

### Solução

Modificar a função `getItemsForIndicator` para filtrar os itens do Modelo Atual pelo campo `responsible` quando `selectedClosers` estiver ativo.

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/ClickableFunnelChart.tsx` | Adicionar filtro de closers na função `getItemsForIndicator` |

---

### Mudança Técnica

**Função `getItemsForIndicator` (linha 192-249):**

Quando buscar itens do Modelo Atual, aplicar o filtro de closers antes de retornar:

```typescript
// Get detail items for an indicator based on selected BU
const getItemsForIndicator = (indicator: IndicatorType): DetailItem[] => {
  // ... código existente para Franquia, Oxy Hacker, O2 TAX ...

  // For Modelo Atual or Consolidado (use Modelo Atual data)
  if (selectedBU === 'modelo_atual' || useConsolidado) {
    let items = modeloAtualAnalytics.getDetailItemsForIndicator(indicator);
    
    // Apply closers filter to Modelo Atual items
    if (selectedClosers?.length && selectedClosers.length > 0) {
      items = items.filter(item => 
        selectedClosers.includes(item.responsible || '')
      );
    }
    
    // For consolidado, also add items from all BUs
    if (useConsolidado) {
      // ... resto do código de agregação das outras BUs ...
      return [...items, ...o2TaxItems, ...franquiaItems, ...oxyHackerItems];
    }
    
    return items;
  }

  return [];
};
```

---

### Comportamento Esperado

| Cenário | Itens no Drill-Down |
|---------|---------------------|
| Sem filtro de closers | Todos os registros do Modelo Atual |
| Pedro selecionado | Apenas registros onde `responsible = "Pedro Albite"` |
| Daniel selecionado | Apenas registros onde `responsible = "Daniel Trindade"` |
| Ambos selecionados | Registros de Pedro + Daniel |
| O2 TAX / Franquia / Oxy Hacker | Sem alteração (não têm closers CFO) |

---

### Resumo

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/components/planning/ClickableFunnelChart.tsx` | Adicionar filtro de `selectedClosers` na função `getItemsForIndicator` para filtrar itens do Modelo Atual pelo campo `responsible` |

