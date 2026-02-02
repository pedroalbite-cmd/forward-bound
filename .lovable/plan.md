

## Adicionar Análise de Conversão por Tier de Faturamento na Aba Vendas

### Objetivo

Adicionar um gráfico comparativo no drill-down de "Vendas" que mostre a taxa de conversão do funil (MQL → Venda) segmentada por faixa de faturamento do cliente. Isso permitirá validar a hipótese de que clientes maiores convertem mais.

---

### Localização da Mudança

O drill-down de Vendas fica em `src/components/planning/IndicatorsTab.tsx`, no `case 'venda':` (linhas 1361-1456). Atualmente ele exibe:
- TCV por Closer
- TCV por SDR
- Composição do Faturamento (Pie)

Vamos adicionar um quarto gráfico: **"Conversão por Tier"**

---

### Lógica de Cálculo

Para cada faixa de faturamento, calcular:

```text
Taxa de Conversão = (Vendas na Faixa / MQLs na Faixa) × 100
```

**Faixas de faturamento disponíveis no sistema:**
- Até R$ 50k
- R$ 50k - 200k
- R$ 200k - 1M
- Acima de 1M

---

### Implementação Técnica

**1. Obter MQLs e Vendas com faixa de faturamento:**

```typescript
// Dentro do case 'venda':

// Obter MQLs do período para comparação
const mqlItems = getItemsForIndicator('mql');

// Agrupar MQLs por faixa de faturamento
const mqlsByTier = new Map<string, number>();
mqlItems.forEach(i => {
  const tier = i.revenueRange || 'Não informado';
  mqlsByTier.set(tier, (mqlsByTier.get(tier) || 0) + 1);
});

// Agrupar Vendas por faixa de faturamento
const vendasByTier = new Map<string, number>();
items.forEach(i => {
  const tier = i.revenueRange || 'Não informado';
  vendasByTier.set(tier, (vendasByTier.get(tier) || 0) + 1);
});

// Calcular taxa de conversão por tier
const allTiers = new Set([...mqlsByTier.keys(), ...vendasByTier.keys()]);
const conversionByTierData = Array.from(allTiers)
  .filter(tier => tier !== 'Não informado') // Excluir não informados
  .map(tier => {
    const mqls = mqlsByTier.get(tier) || 0;
    const vendas = vendasByTier.get(tier) || 0;
    const conversionRate = mqls > 0 ? (vendas / mqls) * 100 : 0;
    
    // Ordenar por faturamento (do menor para o maior)
    const tierOrder = 
      tier.includes('Até') ? 1 :
      tier.includes('50k - 200k') ? 2 :
      tier.includes('200k') ? 3 :
      tier.includes('Acima') || tier.includes('1M') ? 4 : 5;
    
    return {
      label: tier,
      value: conversionRate,
      highlight: conversionRate >= 10 ? 'success' as const : 
                 conversionRate >= 5 ? 'neutral' as const : 
                 'warning' as const,
      order: tierOrder,
    };
  })
  .sort((a, b) => a.order - b.order);
```

**2. Adicionar o gráfico aos charts existentes:**

```typescript
const charts: ChartConfig[] = [
  { type: 'bar', title: 'TCV por Closer', data: closerRankingData, formatValue: formatCompactCurrency },
  { type: 'bar', title: 'TCV por SDR', data: sdrRankingData, formatValue: formatCompactCurrency },
  { type: 'pie', title: 'Composição do Faturamento', data: compositionData, formatValue: formatCompactCurrency },
  // NOVO GRÁFICO:
  { 
    type: 'bar', 
    title: 'Conversão MQL→Venda por Tier', 
    data: conversionByTierData, 
    formatValue: (v: number) => `${v.toFixed(1)}%` 
  },
];
```

---

### Arquivo a Modificar

| Arquivo | Linhas | Ação |
|---------|--------|------|
| `src/components/planning/IndicatorsTab.tsx` | 1361-1432 | Adicionar cálculo de conversão por tier e novo gráfico no case 'venda' |

---

### Resultado Visual

O drill-down de Vendas passará a exibir 4 gráficos:

```text
┌────────────────────────────────────────────────────────────────┐
│                    Vendas - Análise de Valor (TCV)             │
├────────────────────────────────────────────────────────────────┤
│  KPIs: 📝 12 Contratos | 💵 R$ 45k Setup | 🔁 R$ 38k MRR | ... │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ TCV por Closer  │  │  TCV por SDR    │  │  Composição    │  │
│  │ ▓▓▓▓▓▓ R$ 120k  │  │ ▓▓▓▓ R$ 80k     │  │   (Pie Chart)  │  │
│  │ ▓▓▓▓ R$ 85k     │  │ ▓▓▓ R$ 65k      │  │  MRR 45%       │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │           Conversão MQL→Venda por Tier (NOVO)              ││
│  │                                                            ││
│  │  Até R$ 50k      ▓▓▓░░░░░░░░░░░░  3.2%                    ││
│  │  R$ 50k - 200k   ▓▓▓▓▓▓░░░░░░░░  6.5%                     ││
│  │  R$ 200k - 1M    ▓▓▓▓▓▓▓▓▓░░░░░  9.8%                     ││
│  │  Acima de 1M     ▓▓▓▓▓▓▓▓▓▓▓▓░  15.2%   ← Maior conversão ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Insight de Negócio

O gráfico permitirá visualizar claramente:
- **Clientes maiores (Acima de 1M)** tendem a ter maior taxa de conversão
- Isso valida a estratégia de focar em leads de maior faturamento
- Permite comparar eficiência do funil entre segmentos

---

### Alternativas Consideradas

1. **Gráfico separado em outro widget**: Rejeitado pois fragmenta a análise de vendas
2. **Tabela em vez de gráfico de barras**: Rejeitado pois o gráfico visual é mais impactante
3. **Adicionar na aba Segmentação**: O usuário pediu especificamente no campo Vendas

