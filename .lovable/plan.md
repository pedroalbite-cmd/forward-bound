

## Plano: Atualizar Colunas do Drill-Down do Funil

### Alterações Solicitadas

| Remover | Adicionar |
|---------|-----------|
| `phase` (Fase) | `mrr` (MRR) |
| `duration` (Tempo na Fase) | `setup` (Setup) |
| | `pontual` (Pontual) |
| | `value` (Total) |

---

### Arquivo a Modificar

**`src/components/planning/ClickableFunnelChart.tsx`**

#### Antes (linhas 169-195):
```typescript
const getColumnsForIndicator = (indicator: IndicatorType) => {
  const baseColumns = [
    { key: 'product', label: 'Produto', format: columnFormatters.product },
    { key: 'name', label: 'Título' },
    { key: 'company', label: 'Empresa/Contato' },
    { key: 'phase', label: 'Fase', format: columnFormatters.phase },        // ← REMOVER
    { key: 'date', label: 'Data', format: columnFormatters.date },
    { key: 'duration', label: 'Tempo na Fase', format: columnFormatters.duration }, // ← REMOVER
  ];

  if (indicator === 'proposta' || indicator === 'venda') {
    return [...baseColumns, mrr, setup, pontual, value, responsible];
  }

  return [...baseColumns, revenueRange, responsible];
};
```

#### Depois:
```typescript
const getColumnsForIndicator = (indicator: IndicatorType) => {
  // Colunas base para todos os indicadores (sem Fase e Tempo na Fase)
  const baseColumns = [
    { key: 'product', label: 'Produto', format: columnFormatters.product },
    { key: 'name', label: 'Título' },
    { key: 'company', label: 'Empresa/Contato' },
    { key: 'date', label: 'Data', format: columnFormatters.date },
  ];

  // Colunas monetárias (agora para TODOS os indicadores)
  const monetaryColumns = [
    { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
    { key: 'setup', label: 'Setup', format: columnFormatters.currency },
    { key: 'pontual', label: 'Pontual', format: columnFormatters.currency },
    { key: 'value', label: 'Total', format: columnFormatters.currency },
  ];

  return [
    ...baseColumns,
    ...monetaryColumns,
    { key: 'responsible', label: 'Responsável' },
  ];
};
```

---

### Resultado Visual

A tabela de drill-down para qualquer etapa do funil (Leads, MQL, RM, RR, Proposta, Venda) exibirá:

| Produto | Título | Empresa/Contato | Data | MRR | Setup | Pontual | Total | Responsável | Pipefy |
|---------|--------|-----------------|------|-----|-------|---------|-------|-------------|--------|
| CaaS | Card XYZ | Empresa ABC | 15/01/2026 | R$ 5.000 | R$ 2.000 | R$ 1.000 | R$ 8.000 | Pedro | 🔗 |

---

### Observação

Para indicadores que não possuem valores monetários (como Leads, MQL, RM, RR), as colunas MRR, Setup, Pontual e Total exibirão "-" quando os dados não estiverem disponíveis, graças ao formatter `columnFormatters.currency` que já trata valores nulos.

