

## Plano: Corrigir Discrepância de Percentual vs Meta no Faturamento

### Problema Identificado

O acelerador "Faturamento" mostra **42%** vs Meta, mas ao clicar, o drill-down mostra **34%** vs Meta.

| Local | Valor Realizado | Meta | Percentual |
|-------|-----------------|------|------------|
| Acelerador (fora) | R$ 256k | R$ 617k | **42%** |
| Drill-down (dentro) | Valor diferente | R$ 617k | **34%** |

---

### Causa Raiz

Duas fontes de dados diferentes são usadas:

**No acelerador radial (`getRealizedMonetaryForIndicator`):**
```typescript
// Linha 1530-1560
case 'faturamento': {
  let total = 0;
  if (includesModeloAtual) {
    total += getModeloAtualValue('venda', startDate, endDate); // Usa hook agregado
  }
  if (includesO2Tax) {
    total += getO2TaxQty('venda', ...) * 15000; // Ticket fixo
  }
  // ... outros com tickets fixos
  return total;
}
```

**No drill-down (`handleMonetaryCardClick`):**
```typescript
// Linha 1705-1706
const items = getItemsForIndicator('venda');
const totalFaturamento = items.reduce((sum, i) => sum + (i.value || 0), 0); // Soma valores reais
```

A discrepância ocorre porque:
- **Hook agregado** pode incluir fallbacks (ex: R$ 17.000 por card sem valor)
- **Soma de itens** usa o `item.value` real de cada card (que pode ser 0 ou diferente)

---

### Solução

Unificar a fonte de dados: o **drill-down deve usar o mesmo valor calculado pelo acelerador** para manter consistência.

---

### Seção Técnica

**Arquivo:** `src/components/planning/IndicatorsTab.tsx`

**Alteração na função `handleMonetaryCardClick` (linhas 1704-1710):**

```typescript
// ANTES - Usa soma de items.value (pode divergir do acelerador)
const handleMonetaryCardClick = (indicator: MonetaryIndicatorConfig) => {
  const items = getItemsForIndicator('venda');
  const totalFaturamento = items.reduce((sum, i) => sum + (i.value || 0), 0);
  // ...
  const pctMeta = meta > 0 ? Math.round((totalFaturamento / meta) * 100) : 0;
  // Drill-down mostra pctMeta = 34%
}

// DEPOIS - Usa o MESMO valor do acelerador para consistência
const handleMonetaryCardClick = (indicator: MonetaryIndicatorConfig) => {
  const items = getItemsForIndicator('venda');
  
  // Usa o mesmo valor do acelerador para consistência visual
  const realizedFromCard = getRealizedMonetaryForIndicator({ key: 'faturamento', label: 'Faturamento', format: 'currency' });
  
  // Continua calculando composição baseado nos itens (para MRR, Setup, Pontual)
  const totalFaturamentoFromItems = items.reduce((sum, i) => sum + (i.value || 0), 0);
  const totalMrr = items.reduce((sum, i) => sum + (i.mrr || 0), 0);
  const totalSetup = items.reduce((sum, i) => sum + (i.setup || 0), 0);
  const totalPontual = items.reduce((sum, i) => sum + (i.pontual || 0), 0);
  
  // ...no case 'faturamento':
  const meta = getMetaMonetaryForIndicator(indicator);
  const pctMeta = meta > 0 ? Math.round((realizedFromCard / meta) * 100) : 0; // Agora mostra 42%
  // ...
}
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Linhas 1704-1810: usar `getRealizedMonetaryForIndicator` para calcular `pctMeta` no drill-down de Faturamento |

---

### Resultado Esperado

Após a correção, o percentual exibido no drill-down será idêntico ao do acelerador:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Acelerador                    │  Drill-down (após correção)   │
├────────────────────────────────┼───────────────────────────────┤
│  R$ 256k                       │  Total: R$ 256k               │
│  42%                           │  vs Meta: 42%                 │
│  Meta: R$ 617k                 │  ...                          │
└────────────────────────────────┴───────────────────────────────┘
```

