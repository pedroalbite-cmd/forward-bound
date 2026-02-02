

## Adicionar TCV por Tier de Faturamento (Closer/SDR) nos Drill-Downs de Vendas

### Objetivo

Adicionar dois novos gráficos que mostrem a distribuição de TCV por tier de faturamento, separados por Closer e por SDR, em **dois lugares**:
1. **Funil do Período** (ClickableFunnelChart) - ao clicar em "Contrato Assinado"
2. **Radial Cards** (IndicatorsTab) - ao clicar no acelerador de "Vendas"

Isso permitirá analisar em quais faixas de cliente cada closer/SDR está performando melhor.

---

### Localização das Mudanças

| Arquivo | Função/Seção | Linhas |
|---------|--------------|--------|
| `src/components/planning/ClickableFunnelChart.tsx` | `buildVendaMiniDashboard()` | 351-427 |
| `src/components/planning/IndicatorsTab.tsx` | `case 'venda':` | 1472-1482 |

---

### Visual Proposto

Após os gráficos existentes (TCV por Closer, TCV por SDR/Produto, etc.), adicionar:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Contratos Assinados - Análise de Valor                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────────┐   │
│  │   TCV por Closer   │  │  TCV por Produto   │  │  Conversão por Tier  │   │
│  └────────────────────┘  └────────────────────┘  └──────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    TCV por Tier - Closer (NOVO)                       │  │
│  │                                                                       │  │
│  │  Pedro - Até R$ 50k      ▓▓░░░░░░░░░░  R$ 80k                        │  │
│  │  Pedro - R$ 50k-200k     ▓▓▓▓▓░░░░░░░  R$ 150k                       │  │
│  │  Daniel - Até R$ 50k     ▓▓▓░░░░░░░░░  R$ 95k                        │  │
│  │  Daniel - R$ 200k-1M     ▓▓▓▓▓▓▓▓░░░░  R$ 320k                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     TCV por Tier - SDR (NOVO)                         │  │
│  │                                                                       │  │
│  │  João - R$ 50k-200k      ▓▓▓▓░░░░░░░░  R$ 180k                       │  │
│  │  João - R$ 200k-1M       ▓▓▓▓▓▓░░░░░░  R$ 280k                       │  │
│  │  Maria - Até R$ 50k      ▓▓░░░░░░░░░░  R$ 65k                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Lógica de Cálculo (igual para ambos os arquivos)

```typescript
// TCV por Closer + Tier de Faturamento
const closerTierTotals = new Map<string, number>();
items.forEach(i => {
  const closer = (i.responsible || i.closer || 'Sem Closer').split(' ')[0];
  const tier = i.revenueRange || 'Não informado';
  if (tier === 'Não informado') return;
  
  const key = `${closer} - ${tier}`;
  const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
  closerTierTotals.set(key, (closerTierTotals.get(key) || 0) + itemTCV);
});

const closerTierData = Array.from(closerTierTotals.entries())
  .map(([label, value]) => ({ label, value }))
  .sort((a, b) => b.value - a.value);

// TCV por SDR + Tier de Faturamento
const sdrTierTotals = new Map<string, number>();
items.forEach(i => {
  const sdr = (i.sdr || 'Sem SDR').split(' ')[0];
  const tier = i.revenueRange || 'Não informado';
  if (tier === 'Não informado') return;
  
  const key = `${sdr} - ${tier}`;
  const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
  sdrTierTotals.set(key, (sdrTierTotals.get(key) || 0) + itemTCV);
});

const sdrTierData = Array.from(sdrTierTotals.entries())
  .map(([label, value]) => ({ label, value }))
  .sort((a, b) => b.value - a.value);
```

---

### Implementação - Arquivo 1: ClickableFunnelChart

**Modificar `buildVendaMiniDashboard()` (linhas 372-397):**

Adicionar cálculo de tier por closer/SDR e novos gráficos ao array `charts`:

```typescript
// Charts - TCV por Closer (existente)
const closerTotals = new Map<string, number>();
...

// Charts - TCV por Produto (existente)
const productTotals = new Map<string, number>();
...

// NOVO: TCV por Closer + Tier
const closerTierTotals = new Map<string, number>();
items.forEach(i => {
  const closer = (i.responsible || i.closer || 'Sem Closer').split(' ')[0];
  const tier = i.revenueRange || 'Não informado';
  if (tier === 'Não informado') return;
  const key = `${closer} - ${tier}`;
  const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
  closerTierTotals.set(key, (closerTierTotals.get(key) || 0) + itemTCV);
});
const closerTierData = Array.from(closerTierTotals.entries())
  .map(([label, value]) => ({ label, value }))
  .sort((a, b) => b.value - a.value);

// NOVO: TCV por SDR + Tier
const sdrTierTotals = new Map<string, number>();
items.forEach(i => {
  const sdr = (i.sdr || 'Sem SDR').split(' ')[0];
  const tier = i.revenueRange || 'Não informado';
  if (tier === 'Não informado') return;
  const key = `${sdr} - ${tier}`;
  const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
  sdrTierTotals.set(key, (sdrTierTotals.get(key) || 0) + itemTCV);
});
const sdrTierData = Array.from(sdrTierTotals.entries())
  .map(([label, value]) => ({ label, value }))
  .sort((a, b) => b.value - a.value);

const charts: ChartConfig[] = [
  { type: 'bar', title: 'TCV por Closer', data: tcvByCloserData, formatValue: formatCompactCurrency },
  { type: 'pie', title: 'TCV por Produto', data: tcvByProductData, formatValue: formatCompactCurrency },
  // NOVOS:
  ...(closerTierData.length > 0 ? [{ 
    type: 'bar' as const, 
    title: 'TCV por Tier - Closer', 
    data: closerTierData, 
    formatValue: formatCompactCurrency 
  }] : []),
  ...(sdrTierData.length > 0 ? [{ 
    type: 'bar' as const, 
    title: 'TCV por Tier - SDR', 
    data: sdrTierData, 
    formatValue: formatCompactCurrency 
  }] : []),
];
```

---

### Implementação - Arquivo 2: IndicatorsTab

**Modificar `case 'venda':` (após linha 1470, antes de `const charts`):**

Adicionar os mesmos cálculos e gráficos:

```typescript
// 5. TCV por Closer + Tier de Faturamento (NOVO)
const closerTierTotals = new Map<string, number>();
items.forEach(i => {
  const closer = (i.responsible || i.closer || 'Sem Closer').split(' ')[0];
  const tier = i.revenueRange || 'Não informado';
  if (tier === 'Não informado') return;
  const key = `${closer} - ${tier}`;
  const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
  closerTierTotals.set(key, (closerTierTotals.get(key) || 0) + itemTCV);
});
const closerTierData = Array.from(closerTierTotals.entries())
  .map(([label, value]) => ({ label, value }))
  .sort((a, b) => b.value - a.value);

// 6. TCV por SDR + Tier de Faturamento (NOVO)
const sdrTierTotals = new Map<string, number>();
items.forEach(i => {
  const sdr = (i.sdr || 'Sem SDR').split(' ')[0];
  const tier = i.revenueRange || 'Não informado';
  if (tier === 'Não informado') return;
  const key = `${sdr} - ${tier}`;
  const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
  sdrTierTotals.set(key, (sdrTierTotals.get(key) || 0) + itemTCV);
});
const sdrTierData = Array.from(sdrTierTotals.entries())
  .map(([label, value]) => ({ label, value }))
  .sort((a, b) => b.value - a.value);

const charts: ChartConfig[] = [
  { type: 'bar', title: 'TCV por Closer', data: closerRankingData, formatValue: formatCompactCurrency },
  { type: 'bar', title: 'TCV por SDR', data: sdrRankingData, formatValue: formatCompactCurrency },
  { type: 'pie', title: 'Composição do Faturamento', data: compositionData, formatValue: formatCompactCurrency },
  ...(conversionByTierData.length > 0 ? [{ ... }] : []),
  // NOVOS:
  ...(closerTierData.length > 0 ? [{ 
    type: 'bar' as const, 
    title: 'TCV por Tier - Closer', 
    data: closerTierData, 
    formatValue: formatCompactCurrency 
  }] : []),
  ...(sdrTierData.length > 0 ? [{ 
    type: 'bar' as const, 
    title: 'TCV por Tier - SDR', 
    data: sdrTierData, 
    formatValue: formatCompactCurrency 
  }] : []),
];
```

---

### Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `ClickableFunnelChart.tsx` | Adicionar 2 gráficos em `buildVendaMiniDashboard()` |
| `IndicatorsTab.tsx` | Adicionar 2 gráficos no `case 'venda':` |

---

### Insights de Negócio

Os novos gráficos permitirão:
- Ver em quais faixas de faturamento cada closer está performando melhor
- Identificar especialização natural do time (closers focados em enterprise vs SMB)
- Comparar SDRs por qualidade de leads gerados em cada tier
- Validar estratégias de segmentação comercial

---

### Riscos

Nenhum risco identificado:
- Os gráficos só aparecem se houver dados válidos (`revenueRange` preenchido)
- Usa os mesmos dados já carregados
- Não afeta a lógica existente, apenas adiciona novos gráficos ao final

