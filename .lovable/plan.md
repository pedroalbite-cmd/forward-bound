
## Plano: Adicionar Coluna Total nos Drill-Downs

### Contexto

As colunas MRR, Setup e Pontual já estão sendo exibidas, mas falta a coluna **Total** que mostra a soma desses valores.

---

### Solução

Adicionar a coluna `value` (que já contém a soma de MRR + Setup + Pontual) com o label "Total" após as colunas monetárias individuais.

#### 1. Atualizar IndicatorsTab.tsx

**Arquivo:** `src/components/planning/IndicatorsTab.tsx` (linhas 811-818)

```typescript
if (indicatorKey === 'proposta' || indicatorKey === 'venda') {
  return [
    ...baseColumns,
    { key: 'mrr' as keyof DetailItem, label: 'MRR', format: columnFormatters.currency },
    { key: 'setup' as keyof DetailItem, label: 'Setup', format: columnFormatters.currency },
    { key: 'pontual' as keyof DetailItem, label: 'Pontual', format: columnFormatters.currency },
    { key: 'value' as keyof DetailItem, label: 'Total', format: columnFormatters.currency }, // ← ADICIONAR
    { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
  ];
}
```

#### 2. Atualizar ClickableFunnelChart.tsx

**Arquivo:** `src/components/planning/ClickableFunnelChart.tsx` (linhas 179-186)

```typescript
if (indicator === 'proposta' || indicator === 'venda') {
  return [
    ...baseColumns,
    { key: 'mrr' as keyof DetailItem, label: 'MRR', format: columnFormatters.currency },
    { key: 'setup' as keyof DetailItem, label: 'Setup', format: columnFormatters.currency },
    { key: 'pontual' as keyof DetailItem, label: 'Pontual', format: columnFormatters.currency },
    { key: 'value' as keyof DetailItem, label: 'Total', format: columnFormatters.currency }, // ← ADICIONAR
    { key: 'responsible' as keyof DetailItem, label: 'Responsável' },
  ];
}
```

---

### Arquivos a Modificar

| Arquivo | Linha | Ação |
|---------|-------|------|
| `src/components/planning/IndicatorsTab.tsx` | 817 | Adicionar coluna `value` com label "Total" |
| `src/components/planning/ClickableFunnelChart.tsx` | 185 | Adicionar coluna `value` com label "Total" |

---

### Resultado Esperado

| Produto | Empresa | Data | Tempo | MRR | Setup | Pontual | Total | Responsável |
|---------|---------|------|-------|-----|-------|---------|-------|-------------|
| CaaS | Empresa ABC | 15/01/2026 | 5d 2h | R$ 8.500 | R$ 2.000 | R$ 500 | R$ 11.000 | Pedro |
| O2 TAX | Empresa XYZ | 14/01/2026 | 3d 4h | R$ 15.000 | R$ 0 | R$ 0 | R$ 15.000 | Lucas |
