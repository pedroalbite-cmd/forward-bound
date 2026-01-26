
## Plano: Aplicar Filtro de Closers nos Gráficos

### Objetivo

Fazer com que os gráficos de barras (Leads e MQLs) e o Funil do Período também respondam ao filtro de Closers, assim como os acelerômetros já fazem.

---

### Componentes Afetados

| Componente | Arquivo | Função |
|------------|---------|--------|
| Qtd Leads | `src/components/planning/LeadsStackedChart.tsx` | Gráfico de barras laranja |
| Qtd MQLs | `src/components/planning/LeadsMqlsStackedChart.tsx` | Gráfico de barras roxo |
| Funil do Período | `src/components/planning/ClickableFunnelChart.tsx` | Funil visual com 6 etapas |

---

### Abordagem

Passar o filtro de closers como prop para os três componentes e, quando closers estiverem selecionados, filtrar os cards do Modelo Atual pelo campo `responsavel` antes de calcular totais e dados do gráfico.

---

### Mudanças Técnicas

#### 1. IndicatorsTab.tsx (linha ~707-710)

Passar `selectedClosers` como prop para os três componentes:

```typescript
// Antes
<LeadsMqlsStackedChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} />
<LeadsStackedChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} />
<ClickableFunnelChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} />

// Depois
<LeadsMqlsStackedChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedClosers={selectedClosers} />
<LeadsStackedChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedClosers={selectedClosers} />
<ClickableFunnelChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedClosers={selectedClosers} />
```

#### 2. LeadsStackedChart.tsx

**Interface (linha ~18-22):**
```typescript
interface LeadsStackedChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  selectedClosers?: string[];  // Nova prop
}
```

**Lógica de filtragem:**
Quando `selectedClosers` tiver valores e a BU for Modelo Atual ou Consolidado, usar o hook `useModeloAtualAnalytics` para obter os cards filtrados por `responsavel`, ao invés de usar `getModeloAtualGroupedData` diretamente.

**Cálculo do `totalRealized` (linha ~158-168):**
```typescript
// Quando filtro ativo para Modelo Atual
if (selectedClosers?.length > 0 && (useModeloAtual || useConsolidado)) {
  const cards = modeloAtualAnalytics.getCardsForIndicator('leads');
  const filteredCards = cards.filter(c => selectedClosers.includes(c.responsavel || ''));
  totalRealized = filteredCards.length + (useConsolidado ? outrosRealizados : 0);
}
```

#### 3. LeadsMqlsStackedChart.tsx

Mesma lógica do LeadsStackedChart:
- Adicionar `selectedClosers?: string[]` na interface
- Filtrar cards do Modelo Atual quando closers selecionados

#### 4. ClickableFunnelChart.tsx

**Interface (linha ~16-20):**
```typescript
interface ClickableFunnelChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  selectedClosers?: string[];  // Nova prop
}
```

**Cálculo dos totais (linha ~65-100):**
Quando closers estiverem selecionados, calcular cada etapa do funil filtrando cards por `responsavel`:

```typescript
const getFilteredQty = (indicator: IndicatorType): number => {
  if (selectedClosers?.length && (selectedBU === 'modelo_atual' || selectedBU === 'all')) {
    const cards = modeloAtualAnalytics.getCardsForIndicator(indicator);
    const filtered = cards.filter(c => selectedClosers.includes(c.responsavel || ''));
    // Para consolidado, somar outras BUs sem filtro
    const outrosBUs = selectedBU === 'all' 
      ? getO2TaxQty(indicator) + getOxyHackerQty(indicator) + getExpansaoQty(indicator) 
      : 0;
    return filtered.length + outrosBUs;
  }
  return getModeloAtualQty(indicator);
};
```

---

### Comportamento Esperado

| Cenário | Resultado |
|---------|-----------|
| Sem filtro de closers | Mostra todos os dados (comportamento atual) |
| Pedro selecionado | Gráficos mostram apenas cards onde `responsavel = "Pedro Albite"` |
| Daniel selecionado | Gráficos mostram apenas cards onde `responsavel = "Daniel Trindade"` |
| Ambos selecionados | Mostra a soma dos dois (equivalente a sem filtro para Modelo Atual) |
| O2 TAX / Franquia / Oxy Hacker | Filtro não se aplica (não têm closers CFO) |

---

### Resumo de Arquivos

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/components/planning/IndicatorsTab.tsx` | Passar prop `selectedClosers` |
| `src/components/planning/LeadsStackedChart.tsx` | Receber prop e aplicar filtro |
| `src/components/planning/LeadsMqlsStackedChart.tsx` | Receber prop e aplicar filtro |
| `src/components/planning/ClickableFunnelChart.tsx` | Receber prop e aplicar filtro |
