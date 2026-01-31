

## Plano: Adicionar Mini-Dashboard ao Drill-Down de "Proposta Enviada" do Funil

### Contexto

Atualmente, o componente `ClickableFunnelChart.tsx` tem dois pontos de clique para "Proposta Enviada":

1. **Card monetário no topo** (R$ valor) → `handleMonetaryClick('proposta', propostaValue)` → Abre DetailSheet **SEM** KPIs/gráficos
2. **Barra do funil** (quantidade) → `handleStageClick(stage)` → Abre DetailSheet **SEM** KPIs/gráficos

Enquanto isso, o acelerômetro de "Propostas Enviadas" no `IndicatorsTab.tsx` abre um DetailSheet **COM** mini-dashboard (KPIs + gráficos):
- 📊 Propostas | 💰 Pipeline | 🎯 Ticket Médio | ⚠️ Envelhecidas | 🔴 em Risco
- Gráficos: Pipeline por Closer + Aging das Propostas

O usuário quer que o clique no funil tenha o **mesmo mini-dashboard**.

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/ClickableFunnelChart.tsx` | Adicionar lógica de KPIs/gráficos ao drill-down de proposta |

---

### Seção Técnica

**1. Adicionar imports necessários (linhas 1-15):**
```typescript
import { KpiItem } from "./indicators/KpiCard";
import { ChartConfig } from "./indicators/DrillDownCharts";
```

**2. Adicionar estados para KPIs e Charts (linhas 36-41):**
```typescript
const [sheetKpis, setSheetKpis] = useState<KpiItem[]>([]);
const [sheetCharts, setSheetCharts] = useState<ChartConfig[]>([]);
```

**3. Criar helper para formatar currency compacto:**
```typescript
const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${Math.round(value)}`;
};
```

**4. Modificar `handleMonetaryClick` para adicionar KPIs/gráficos quando é "proposta" (linhas 288-300):**
```typescript
const handleMonetaryClick = (type: 'proposta' | 'venda', value: number) => {
  const indicator = type as IndicatorType;
  const items = getItemsForIndicator(indicator);
  const columns = getColumnsForIndicator(indicator);
  const title = type === 'proposta' ? 'Propostas Enviadas' : 'Contratos Assinados';
  
  if (type === 'proposta') {
    // Mini-dashboard igual ao acelerômetro do IndicatorsTab
    const now = new Date();
    const itemsWithAging = items.map(item => {
      const entryDate = item.date ? new Date(item.date) : now;
      const diasEmProposta = Math.floor((now.getTime() - entryDate.getTime()) / 86400000);
      return { ...item, diasEmProposta };
    });
    
    const pipeline = items.reduce((sum, i) => sum + (i.value || 0), 0);
    const ticketMedio = items.length > 0 ? pipeline / items.length : 0;
    const propostasAntigas = itemsWithAging.filter(i => (i.diasEmProposta || 0) > 14);
    const valorEmRisco = propostasAntigas.reduce((sum, i) => sum + (i.value || 0), 0);
    
    // KPIs
    const kpis: KpiItem[] = [
      { icon: '📊', value: items.length, label: 'Propostas', highlight: 'neutral' },
      { icon: '💰', value: formatCompactCurrency(pipeline), label: 'Pipeline', highlight: 'neutral' },
      { icon: '🎯', value: formatCompactCurrency(ticketMedio), label: 'Ticket Médio', highlight: 'neutral' },
      { icon: '⚠️', value: propostasAntigas.length, label: 'Envelhecidas', highlight: propostasAntigas.length > 0 ? 'warning' : 'success' },
      { icon: '🔴', value: formatCompactCurrency(valorEmRisco), label: 'em Risco', highlight: valorEmRisco > 0 ? 'danger' : 'success' },
    ];
    
    // Charts
    const closerTotals = new Map<string, number>();
    itemsWithAging.forEach(i => {
      const closer = i.responsible || i.closer || 'Sem Closer';
      closerTotals.set(closer, (closerTotals.get(closer) || 0) + (i.value || 0));
    });
    const pipelineByCloserData = Array.from(closerTotals.entries())
      .map(([label, value]) => ({ label: label.split(' ')[0], value }))
      .sort((a, b) => b.value - a.value);
    
    const agingDistribution = [
      { label: '0-7 dias', value: itemsWithAging.filter(i => (i.diasEmProposta || 0) <= 7).length, highlight: 'success' as const },
      { label: '8-14 dias', value: itemsWithAging.filter(i => (i.diasEmProposta || 0) > 7 && (i.diasEmProposta || 0) <= 14).length, highlight: 'neutral' as const },
      { label: '15-30 dias', value: itemsWithAging.filter(i => (i.diasEmProposta || 0) > 14 && (i.diasEmProposta || 0) <= 30).length, highlight: 'warning' as const },
      { label: '30+ dias', value: itemsWithAging.filter(i => (i.diasEmProposta || 0) > 30).length, highlight: 'danger' as const },
    ];
    
    const charts: ChartConfig[] = [
      { type: 'bar', title: 'Pipeline por Closer', data: pipelineByCloserData, formatValue: formatCompactCurrency },
      { type: 'distribution', title: 'Aging das Propostas', data: agingDistribution },
    ];
    
    setSheetKpis(kpis);
    setSheetCharts(charts);
    setSheetTitle('Propostas - Onde o Pipeline Está Travando?');
    setSheetDescription(
      `${items.length} propostas | Pipeline: ${formatCompactCurrency(pipeline)} | Ticket médio: ${formatCompactCurrency(ticketMedio)}` +
      (propostasAntigas.length > 0 
        ? ` | ⚠️ ${propostasAntigas.length} com mais de 14 dias (${formatCompactCurrency(valorEmRisco)} em risco)` 
        : ' | ✅ Nenhuma envelhecida')
    );
    setSheetColumns([
      { key: 'product', label: 'Produto', format: columnFormatters.product },
      { key: 'company', label: 'Empresa' },
      { key: 'value', label: 'Valor Total', format: columnFormatters.currency },
      { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
      { key: 'responsible', label: 'Closer' },
      { key: 'diasEmProposta', label: 'Dias em Proposta', format: columnFormatters.agingWithAlert },
      { key: 'date', label: 'Data Envio', format: columnFormatters.date },
    ]);
    setSheetItems(itemsWithAging.sort((a, b) => (b.diasEmProposta || 0) - (a.diasEmProposta || 0)));
    setSheetOpen(true);
    return;
  }
  
  // Para venda, manter comportamento atual (sem mini-dashboard por enquanto)
  setSheetKpis([]);
  setSheetCharts([]);
  setSheetTitle(title);
  setSheetDescription(`Valor total: ${formatCurrency(value)}`);
  setSheetItems(items);
  setSheetColumns(columns);
  setSheetOpen(true);
};
```

**5. Atualizar `handleStageClick` para usar mesma lógica quando stage é "proposta" (linhas 271-285):**
```typescript
const handleStageClick = (stage: FunnelStage) => {
  if (stage.value === 0) return;
  
  // Se for proposta, usar a mesma lógica do handleMonetaryClick
  if (stage.indicator === 'proposta') {
    const propostaValueCalc = // calcular valor atual
    handleMonetaryClick('proposta', propostaValueCalc);
    return;
  }
  
  // Para outros indicadores, manter comportamento atual
  const items = getItemsForIndicator(stage.indicator);
  const columns = getColumnsForIndicator(stage.indicator);
  
  setSheetKpis([]);
  setSheetCharts([]);
  setSheetTitle(`${stage.name}`);
  setSheetDescription(`${formatNumber(stage.value)} registros no período selecionado`);
  setSheetItems(items);
  setSheetColumns(columns);
  setSheetOpen(true);
};
```

**6. Atualizar o componente DetailSheet para receber e exibir kpis/charts (linha ~360-375):**
```typescript
<DetailSheet
  open={sheetOpen}
  onOpenChange={setSheetOpen}
  title={sheetTitle}
  description={sheetDescription}
  items={sheetItems}
  columns={sheetColumns}
  kpis={sheetKpis}       // NOVO
  charts={sheetCharts}   // NOVO
/>
```

---

### Resultado Final

Ao clicar em "Proposta Enviada" no funil (seja no card monetário ou na barra):
1. Abre o DetailSheet com:
   - **Título**: "Propostas - Onde o Pipeline Está Travando?"
   - **KPIs**: 📊 Propostas | 💰 Pipeline | 🎯 Ticket Médio | ⚠️ Envelhecidas | 🔴 em Risco
   - **Gráficos**: Pipeline por Closer + Aging das Propostas
   - **Tabela**: Ordenada por dias em proposta (mais antigas primeiro)

