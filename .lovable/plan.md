

## Remover TCV por SDR e por Closer do Modal de Vendas

### Objetivo

Remover os gráficos "TCV por Closer" e "TCV por SDR" do modal de drill-down do acelerômetro de Vendas clicável, mantendo os demais gráficos como Composição do Faturamento e os gráficos de TCV por Tier.

### Arquivo a Modificar

| Arquivo | Linhas | Mudança |
|---------|--------|---------|
| `src/components/planning/IndicatorsTab.tsx` | 1447-1467 | Remover cálculos de closerTotals e sdrTotals |
| `src/components/planning/IndicatorsTab.tsx` | 1549-1550 | Remover charts "TCV por Closer" e "TCV por SDR" |

---

### Código a Remover

**1. Cálculo do TCV por Closer (linhas ~1447-1456):**
```typescript
// 1. TCV por Closer
const closerTotals = new Map<string, number>();
items.forEach(i => {
  const closer = i.responsible || i.closer || 'Sem Closer';
  const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
  closerTotals.set(closer, (closerTotals.get(closer) || 0) + itemTCV);
});
const closerRankingData = Array.from(closerTotals.entries())
  .map(([label, value]) => ({ label: label.split(' ')[0], value }))
  .sort((a, b) => b.value - a.value);
```

**2. Cálculo do TCV por SDR (linhas ~1458-1467):**
```typescript
// 2. TCV por SDR originado
const sdrTotals = new Map<string, number>();
items.forEach(i => {
  const sdrName = i.sdr || i.responsible || 'Sem SDR';
  const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
  sdrTotals.set(sdrName, (sdrTotals.get(sdrName) || 0) + itemTCV);
});
const sdrRankingData = Array.from(sdrTotals.entries())
  .map(([label, value]) => ({ label: label.split(' ')[0], value }))
  .sort((a, b) => b.value - a.value);
```

**3. Entradas no array de charts (linhas ~1549-1550):**
```typescript
{ type: 'bar', title: 'TCV por Closer', data: closerRankingData, formatValue: formatCompactCurrency },
{ type: 'bar', title: 'TCV por SDR', data: sdrRankingData, formatValue: formatCompactCurrency },
```

---

### Resultado

O modal de drill-down de Vendas exibirá apenas:
- **Composição do Faturamento** (pizza MRR/Setup/Pontual)
- **Conversão MQL→Venda por Tier** (barras)
- **TCV por Tier - Closer** (barras, se houver dados)
- **TCV por Tier - SDR** (barras, se houver dados)

Os gráficos simples "TCV por Closer" e "TCV por SDR" serão removidos.

