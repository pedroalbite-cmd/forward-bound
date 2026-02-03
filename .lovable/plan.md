
## Consolidar Gráficos de Faturamento: Opção 1 + Dashboard Opção 5

### Objetivo

Simplificar a visualização de faturamento mantendo apenas:
1. **Opção 1: Barras Agrupadas** - Para comparação lado a lado por período
2. **Dashboard da Opção 5** - Cards KPI com sparklines + gráfico consolidado

### Arquivos a Deletar

| Arquivo | Motivo |
|---------|--------|
| `src/components/planning/revenue-charts/RevenueChartMultiLine.tsx` | Opção 2 - será removida |
| `src/components/planning/revenue-charts/RevenueChartStackedArea.tsx` | Opção 3 - será removida |
| `src/components/planning/RevenueBreakdownChart.tsx` | "Faturamento por Período" original - substituído pelas novas opções |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/revenue-charts/index.ts` | Remover exports das opções 2 e 3 |
| `src/components/planning/RevenueChartComparison.tsx` | Remover imports e renderização das opções 2 e 3, atualizar texto do header |
| `src/components/planning/IndicatorsTab.tsx` | Remover import e uso do `RevenueBreakdownChart` |

---

### Detalhes Técnicos

**1. Atualizar `revenue-charts/index.ts`:**

Antes:
```typescript
export { RevenueChartGroupedBars } from './RevenueChartGroupedBars';
export { RevenueChartMultiLine } from './RevenueChartMultiLine';
export { RevenueChartStackedArea } from './RevenueChartStackedArea';
export { RevenueChartDashboard } from './RevenueChartDashboard';
```

Depois:
```typescript
export { RevenueChartGroupedBars } from './RevenueChartGroupedBars';
export { RevenueChartDashboard } from './RevenueChartDashboard';
```

---

**2. Atualizar `RevenueChartComparison.tsx`:**

- Remover imports de `RevenueChartMultiLine` e `RevenueChartStackedArea`
- Remover renderização das opções 2 e 3
- Atualizar título para "Faturamento por Período" (remover texto sobre "comparação")
- Manter apenas `RevenueChartGroupedBars` e `RevenueChartDashboard`

---

**3. Atualizar `IndicatorsTab.tsx`:**

- Remover import do `RevenueBreakdownChart`
- Remover a seção `{/* Revenue Breakdown Chart */}` (linhas ~2408-2415)
- O `RevenueChartComparison` já exibe os gráficos necessários

---

**4. Atualizar títulos dos componentes mantidos:**

- `RevenueChartGroupedBars.tsx`: Atualizar título de "Opção 1: Barras Agrupadas" para "Faturamento por Período (Detalhado)"
- `RevenueChartDashboard.tsx`: Atualizar título de "Opção 5: Dashboard Compacto (Recomendado)" para "Resumo de Faturamento"

---

### Resultado Final

A aba Indicadores terá apenas dois gráficos de faturamento:

```text
┌─────────────────────────────────────────────────┐
│  Faturamento por Período (Detalhado)            │
│  ┌───┬───┬───┬───┐                              │
│  │MA │TAX│OXY│FRQ│  ← Barras agrupadas por BU   │
│  └───┴───┴───┴───┘                              │
│  Jan  Fev  Mar  Abr                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Resumo de Faturamento                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌─────┐           │
│  │ MA │ │TAX │ │OXY │ │FRQ │ │TOTAL│           │
│  │___ │ │___ │ │___ │ │___ │ │____ │           │
│  │95% │ │80% │ │120%│ │60% │ │92%  │           │
│  └────┘ └────┘ └────┘ └────┘ └─────┘           │
│  ┌─────────────────────────────────────┐       │
│  │ Gráfico empilhado consolidado       │       │
│  └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```
