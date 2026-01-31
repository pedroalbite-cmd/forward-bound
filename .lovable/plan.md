

## Plano: Adicionar TCV (Total Contract Value) ao Drill-Down de Vendas

### Contexto

O usuário precisa visualizar o **TCV - Total Contract Value** dentro do drill-down do acelerômetro/funil de Vendas (Contratos Assinados). O TCV representa a visão futura de faturamento total dos contratos, considerando que o MRR é sempre multiplicado por 12 meses.

**Fórmula do TCV:**
```
TCV = (MRR × 12) + Setup + Pontual
```

Atualmente, o drill-down de Vendas mostra apenas a lista de contratos sem KPIs ou gráficos analíticos.

---

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/ClickableFunnelChart.tsx` | Criar mini-dashboard com TCV e métricas adicionais para o drill-down de Vendas |

---

### Visual Proposta

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Contratos Assinados - Análise de Valor                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐│
│  │ 📋      │ │ 💵      │ │ 🔁      │ │ ⚡      │ │ 📊 TCV          ││
│  │ 12      │ │ R$240k  │ │ R$85k   │ │ R$45k   │ │ R$ 1.3M         ││
│  │ Vendas  │ │ Setup   │ │ MRR     │ │ Pontual │ │ (MRR×12+Setup+P)││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘│
│                                                                      │
│  ┌─ Gráficos ───────────────────────────────────────────────────────┐│
│  │ [Vendas por Closer]              [Distribuição por Produto]      ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─ Tabela de Contratos ────────────────────────────────────────────┐│
│  │ Produto | Empresa | Data | MRR | Setup | Pontual | TCV | Closer  ││
│  └──────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

### Seção Técnica

**1. Criar função `buildVendaMiniDashboard` (linhas ~350):**

```typescript
const buildVendaMiniDashboard = () => {
  const items = getItemsForIndicator('venda');
  
  // Calcular métricas totais
  const totalMRR = items.reduce((sum, i) => sum + (i.mrr || 0), 0);
  const totalSetup = items.reduce((sum, i) => sum + (i.setup || 0), 0);
  const totalPontual = items.reduce((sum, i) => sum + (i.pontual || 0), 0);
  
  // TCV = (MRR × 12) + Setup + Pontual
  const tcv = (totalMRR * 12) + totalSetup + totalPontual;
  
  const ticketMedio = items.length > 0 ? tcv / items.length : 0;
  
  // KPIs
  const kpis: KpiItem[] = [
    { icon: '📋', value: items.length, label: 'Vendas', highlight: 'neutral' },
    { icon: '💵', value: formatCompactCurrency(totalSetup), label: 'Setup', highlight: 'neutral' },
    { icon: '🔁', value: formatCompactCurrency(totalMRR), label: 'MRR', highlight: 'neutral' },
    { icon: '⚡', value: formatCompactCurrency(totalPontual), label: 'Pontual', highlight: 'neutral' },
    { icon: '📊', value: formatCompactCurrency(tcv), label: 'TCV', highlight: 'success' },
  ];
  
  // Charts - Vendas por Closer
  const closerTotals = new Map<string, number>();
  items.forEach(i => {
    const closer = i.responsible || i.closer || 'Sem Closer';
    const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
    closerTotals.set(closer, (closerTotals.get(closer) || 0) + itemTCV);
  });
  const vendasByCloserData = Array.from(closerTotals.entries())
    .map(([label, value]) => ({ label: label.split(' ')[0], value }))
    .sort((a, b) => b.value - a.value);
  
  // Charts - Distribuição por Produto
  const productTotals = new Map<string, number>();
  items.forEach(i => {
    const product = i.product || 'Outros';
    const itemTCV = ((i.mrr || 0) * 12) + (i.setup || 0) + (i.pontual || 0);
    productTotals.set(product, (productTotals.get(product) || 0) + itemTCV);
  });
  const vendasByProductData = Array.from(productTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const charts: ChartConfig[] = [
    { type: 'bar', title: 'TCV por Closer', data: vendasByCloserData, formatValue: formatCompactCurrency },
    { type: 'pie', title: 'TCV por Produto', data: vendasByProductData, formatValue: formatCompactCurrency },
  ];
  
  // Adicionar TCV calculado a cada item para exibição na tabela
  const itemsWithTCV = items.map(item => ({
    ...item,
    // Usamos o campo 'value' para armazenar o TCV do item
    value: ((item.mrr || 0) * 12) + (item.setup || 0) + (item.pontual || 0),
  }));
  
  setSheetKpis(kpis);
  setSheetCharts(charts);
  setSheetTitle('Contratos Assinados - Análise de Valor');
  setSheetDescription(
    `${items.length} contratos | TCV: ${formatCompactCurrency(tcv)} | ` +
    `MRR: ${formatCompactCurrency(totalMRR)} | Setup: ${formatCompactCurrency(totalSetup)} | ` +
    `Pontual: ${formatCompactCurrency(totalPontual)} | Ticket médio TCV: ${formatCompactCurrency(ticketMedio)}`
  );
  
  // Ajustar colunas para incluir TCV
  setSheetColumns([
    { key: 'product', label: 'Produto', format: columnFormatters.product },
    { key: 'company', label: 'Empresa' },
    { key: 'dataAssinatura', label: 'Data Assinatura', format: columnFormatters.date },
    { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
    { key: 'setup', label: 'Setup', format: columnFormatters.currency },
    { key: 'pontual', label: 'Pontual', format: columnFormatters.currency },
    { key: 'value', label: 'TCV', format: columnFormatters.currency },
    { key: 'sdr', label: 'SDR' },
    { key: 'responsible', label: 'Closer' },
  ]);
  setSheetItems(itemsWithTCV.sort((a, b) => (b.value || 0) - (a.value || 0)));
  setSheetOpen(true);
};
```

**2. Modificar `handleMonetaryClick` para usar o mini-dashboard de vendas (linhas 374-393):**

```typescript
const handleMonetaryClick = (type: 'proposta' | 'venda', value: number) => {
  // Se for proposta, usar mini-dashboard de proposta
  if (type === 'proposta') {
    buildPropostaMiniDashboard();
    return;
  }
  
  // Se for venda, usar mini-dashboard de venda com TCV
  if (type === 'venda') {
    buildVendaMiniDashboard();
    return;
  }
};
```

**3. Modificar `handleStageClick` para usar mini-dashboard quando stage é 'venda' (linhas 350-372):**

```typescript
const handleStageClick = (stage: FunnelStage) => {
  if (stage.value === 0) return;
  
  // Se for proposta, usar mini-dashboard de proposta
  if (stage.indicator === 'proposta') {
    buildPropostaMiniDashboard();
    return;
  }
  
  // Se for venda, usar mini-dashboard de venda com TCV
  if (stage.indicator === 'venda') {
    buildVendaMiniDashboard();
    return;
  }
  
  // Para outros indicadores, manter comportamento atual
  // ...
};
```

---

### Fórmula do TCV Explicada

| Componente | Descrição | Cálculo |
|------------|-----------|---------|
| MRR | Receita Recorrente Mensal | Valor × 12 meses |
| Setup | Taxa única de implementação | Valor integral |
| Pontual | Receitas pontuais | Valor integral |
| **TCV** | **Total Contract Value** | **(MRR × 12) + Setup + Pontual** |

**Exemplo:**
- MRR: R$ 5.000/mês → R$ 60.000 (anualizado)
- Setup: R$ 15.000
- Pontual: R$ 2.000
- **TCV = R$ 77.000**

---

### Impacto

1. **Novo KPI de TCV**: Visão clara do valor total de contratos considerando 12 meses de MRR
2. **Análise por Closer**: Gráfico de barras mostrando TCV por vendedor
3. **Análise por Produto**: Gráfico de pizza mostrando TCV por BU (CaaS, O2 TAX, etc.)
4. **Tabela enriquecida**: Coluna TCV por contrato, ordenada por maior valor
5. **Consistência**: Mesma experiência do mini-dashboard de Propostas, agora em Vendas

