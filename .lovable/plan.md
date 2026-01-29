

## Plano: Remover SDR do Drill-down de MQL

### O Que Será Removido

| Elemento | Localização | Ação |
|----------|-------------|------|
| Cálculo `topSDR` | Linha 1086 | Remover |
| KPI "Top SDR" | Linha 1092 | Remover |
| Texto "Top SDR: ..." na descrição | Linha 1114 | Remover |
| Coluna "SDR" na tabela | Linha 1122 | Remover |

---

### Seção Técnica

**Arquivo:** `src/components/planning/IndicatorsTab.tsx`

**1. Remover cálculo do topSDR (linha 1086):**
```typescript
// REMOVER esta linha
const topSDR = findTopPerformer(items, 'sdr');
```

**2. Remover KPI "Top SDR" (linha 1092):**
```typescript
// ANTES
const kpis: KpiItem[] = [
  { icon: '📊', value: items.length, label: 'Total MQLs', highlight: 'neutral' },
  { icon: '💎', value: `${premiumPct}%`, label: 'Premium', highlight: ... },
  { icon: '🏆', value: topSDR.name.split(' ')[0], label: `Top (${topSDR.count})`, highlight: 'neutral' },
];

// DEPOIS
const kpis: KpiItem[] = [
  { icon: '📊', value: items.length, label: 'Total MQLs', highlight: 'neutral' },
  { icon: '💎', value: `${premiumPct}%`, label: 'Premium', highlight: ... },
];
```

**3. Atualizar descrição (linha 1113-1114):**
```typescript
// ANTES
`${items.length} MQLs captados | ${premiumPct}% faixa premium (>R$50k) | Top SDR: ${topSDR.name} (${topSDR.count})`

// DEPOIS
`${items.length} MQLs captados | ${premiumPct}% faixa premium (>R$50k)`
```

**4. Remover coluna SDR da tabela (linha 1122):**
```typescript
// ANTES
setDetailSheetColumns([
  { key: 'product', label: 'Produto', format: columnFormatters.product },
  { key: 'company', label: 'Empresa' },
  { key: 'revenueRange', label: 'Faixa Faturamento', format: columnFormatters.revenueRange },
  { key: 'sdr', label: 'SDR' },
  { key: 'date', label: 'Data', format: columnFormatters.date },
]);

// DEPOIS
setDetailSheetColumns([
  { key: 'product', label: 'Produto', format: columnFormatters.product },
  { key: 'company', label: 'Empresa' },
  { key: 'revenueRange', label: 'Faixa Faturamento', format: columnFormatters.revenueRange },
  { key: 'date', label: 'Data', format: columnFormatters.date },
]);
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Remover 4 elementos relacionados ao SDR no case 'mql' (linhas 1086, 1092, 1114, 1122) |

---

### Resultado Final do Drill-down de MQL

```text
┌─────────────────────────────────────────────────────────────────┐
│  MQL - De Onde Vêm Nossos Melhores Leads?                       │
│  45 MQLs captados | 28% faixa premium (>R$50k)                   │
├─────────────────────────────────────────────────────────────────┤
│  KPIs: 📊 45 Total | 💎 28% Premium                             │
├─────────────────────────────────────────────────────────────────┤
│  [Gráfico]                                                       │
│  Por Faixa de Faturamento                                        │
│  ████ 20-50k (18)                                                │
│  ███ >50k (12)                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Tabela: Produto | Empresa | Faixa | Data                        │
└─────────────────────────────────────────────────────────────────┘
```

