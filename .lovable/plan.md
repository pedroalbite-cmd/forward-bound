

## Corrigir Discrepância de Faturamento O2 TAX

### Problema Identificado

O acelerômetro de faturamento para **O2 TAX** exibe **R$ 60.000**, mas o drill-down mostra **R$ 54.000**. A causa é:

| Componente | Fonte de Dados | Cálculo | Resultado |
|------------|----------------|---------|-----------|
| **Acelerômetro** | `IndicatorsTab.tsx` linha 1591 | `getO2TaxQty('venda') * 15000` | 4 vendas × 15k = **60k** |
| **Drill-down** | `useO2TaxAnalytics.ts` linha 540 | `card.valor` (MRR + Setup + Pontual reais) | Soma real = **~54k** |

O valor correto é **R$ 54k** (soma dos valores reais do banco).

---

### Solução

Substituir o cálculo fixo de **quantidade × R$ 15.000** pelo valor real retornado pela função `getValueForPeriod` do hook `useO2TaxMetas`.

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planning/IndicatorsTab.tsx` | Usar `getO2TaxValue` em vez de `getO2TaxQty * 15000` |

---

### Mudança no Código

**Linha 1591 - Antes:**
```typescript
if (includesO2Tax) {
  total += getO2TaxQty('venda' as O2TaxIndicator, startDate, endDate) * 15000;
}
```

**Depois:**
```typescript
if (includesO2Tax) {
  total += getO2TaxValue('venda' as O2TaxIndicator, startDate, endDate);
}
```

---

### Verificações Adicionais

Preciso verificar se `getO2TaxValue` já está disponível no componente. Se não estiver, será necessário:

1. Adicionar a desestruturação do hook:
```typescript
const { 
  getQtyForPeriod: getO2TaxQty, 
  getValueForPeriod: getO2TaxValue,  // ← ADICIONAR
  getGroupedData: getO2TaxGroupedData 
} = useO2TaxMetas(startDate, endDate);
```

---

### Impacto

| Métrica | Antes | Depois |
|---------|-------|--------|
| Faturamento O2 TAX (Jan) | R$ 60.000 | R$ 53.888 (~54k) |
| Consistência Gauge ↔ Drill-down | ❌ Inconsistente | ✅ Consistente |

---

### Nota Técnica

A função `getValueForPeriod` em `useO2TaxMetas.ts` (linhas 140-185) já implementa a lógica correta:
- Filtra cards únicos que entraram na fase "Contrato assinado" no período
- Soma `valorPontual + valorSetup + valorMRR` de cada card
- Retorna o total real

