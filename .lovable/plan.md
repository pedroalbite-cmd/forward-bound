
## Comparativo de Análise de Conversão de Funil por Tier de Faturamento

### Objetivo

Adicionar uma nova seção na aba **Indicadores** que exiba um comparativo visual da taxa de conversão em cada etapa do funil (Leads → MQL → RM → RR → Proposta → Venda) segmentado por **tier de faturamento** do cliente.

Esta análise responde à pergunta estratégica: **"Em quais faixas de faturamento temos melhor conversão em cada etapa do funil?"**

---

### Visualização Proposta

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Comparativo de Conversão por Tier de Faturamento                        │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ┌─────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │   Tier      │ Lead→MQL │ MQL→RM   │ RM→RR    │ RR→Prop  │ Prop→Venda│  │
│  ├─────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤  │
│  │ Até R$ 50k  │  85% ■■■ │  32% ■■  │  75% ■■■ │  40% ■■  │  12% ■   │  │
│  │ R$ 50k-200k │  78% ■■■ │  45% ■■■ │  82% ■■■ │  55% ■■■ │  18% ■■  │  │
│  │ R$ 200k-1M  │  72% ■■■ │  52% ■■■ │  88% ■■■ │  62% ■■■ │  22% ■■■ │  │
│  │ Acima de 1M │  65% ■■  │  48% ■■■ │  90% ■■■ │  70% ■■■ │  28% ■■■ │  │
│  └─────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                                          │
│  [Gráfico de Barras Agrupadas - Conversão por Etapa e Tier]              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │     Lead→MQL      MQL→RM       RM→RR       RR→Prop    Prop→Venda   │ │
│  │  ████ ████ ██   ██ ███ ████   ███ ███ ██  ██ ███ ██   ██ ███ ██    │ │
│  │  ████ ████ ██   ██ ███ ████   ███ ███ ██  ██ ███ ██   ██ ███ ██    │ │
│  │  ████ ████ ██   ██ ███ ████   ███ ███ ██  ██ ███ ██   ██ ███ ██    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Legenda: ■ Até R$50k  ■ R$50k-200k  ■ R$200k-1M  ■ Acima de 1M          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/planning/indicators/FunnelConversionByTierWidget.tsx` | **Criar** | Novo widget com tabela + gráfico de barras agrupadas |
| `src/components/planning/IndicatorsTab.tsx` | **Modificar** | Adicionar widget após o RevenueChartComparison |

---

### Estrutura de Dados

O widget utilizará os dados já disponíveis nos hooks existentes:

```typescript
interface TierConversionData {
  tier: string;           // "Até R$ 50k", "R$ 50k - 200k", etc.
  leadToMql: number;      // % de conversão Lead→MQL
  mqlToRm: number;        // % de conversão MQL→RM
  rmToRr: number;         // % de conversão RM→RR
  rrToProposta: number;   // % de conversão RR→Proposta
  propostaToVenda: number;// % de conversão Proposta→Venda
  // Contagens absolutas para tooltip
  leads: number;
  mqls: number;
  rms: number;
  rrs: number;
  propostas: number;
  vendas: number;
}
```

---

### Lógica de Cálculo

O widget precisa:

1. **Obter todos os cards** de cada indicador (Leads, MQL, RM, RR, Proposta, Venda) usando `getItemsForIndicator()`
2. **Agrupar por tier** usando o campo `revenueRange` de cada item
3. **Calcular taxa de conversão** entre etapas consecutivas:

```typescript
// Exemplo de cálculo
const leadsByTier = groupByTier(getItemsForIndicator('leads'));
const mqlsByTier = groupByTier(getItemsForIndicator('mql'));
const rmsByTier = groupByTier(getItemsForIndicator('rm'));
// ...

const conversionData = tiers.map(tier => ({
  tier,
  leadToMql: (mqlsByTier[tier] / leadsByTier[tier]) * 100,
  mqlToRm: (rmsByTier[tier] / mqlsByTier[tier]) * 100,
  // ...continuação
}));
```

---

### Componentes Visuais

O widget incluirá:

1. **Tabela de Conversão** - Visão matricial tier × etapa
2. **Gráfico de Barras Agrupadas** - Comparativo visual usando Recharts
3. **Destaque de Gargalos** - Células vermelhas/amarelas para baixa conversão
4. **Drill-down** - Clique em célula abre detalhes dos cards daquele tier/etapa

---

### Normalização de Tiers

Os dados do Pipefy têm várias nomenclaturas para faixas de faturamento. O widget normalizará para 4 tiers principais:

```typescript
const TIER_NORMALIZATION: Record<string, string> = {
  'Até R$ 50.000': 'Até R$ 50k',
  'Até R$ 50 mil': 'Até R$ 50k',
  'Até R$ 50k': 'Até R$ 50k',
  // ... outras variantes
  
  'Entre R$ 50.000 e R$ 200.000': 'R$ 50k - 200k',
  'R$ 50k - 200k': 'R$ 50k - 200k',
  // ...
  
  'Entre R$ 200.000 e R$ 1.000.000': 'R$ 200k - 1M',
  'R$ 200k - 1M': 'R$ 200k - 1M',
  // ...
  
  'Acima de R$ 1.000.000': 'Acima de 1M',
  'Acima de 1M': 'Acima de 1M',
  'Entre R$ 1 milhão e R$ 5 milhões': 'Acima de 1M',
  // ...
};
```

---

### Implementação Técnica

```typescript
// FunnelConversionByTierWidget.tsx (estrutura simplificada)

interface FunnelConversionByTierWidgetProps {
  startDate: Date;
  endDate: Date;
  selectedBUs: string[];
  selectedClosers: string[];
  getItemsForIndicator: (indicator: IndicatorType) => DetailItem[];
}

export function FunnelConversionByTierWidget(props) {
  // 1. Buscar itens de cada etapa
  const leads = props.getItemsForIndicator('leads');
  const mqls = props.getItemsForIndicator('mql');
  const rms = props.getItemsForIndicator('rm');
  const rrs = props.getItemsForIndicator('rr');
  const propostas = props.getItemsForIndicator('proposta');
  const vendas = props.getItemsForIndicator('venda');
  
  // 2. Agrupar por tier normalizado
  const groupByTier = (items: DetailItem[]) => {
    const groups = new Map<string, DetailItem[]>();
    items.forEach(item => {
      const tier = normalizeTier(item.revenueRange);
      if (!groups.has(tier)) groups.set(tier, []);
      groups.get(tier)!.push(item);
    });
    return groups;
  };
  
  // 3. Calcular conversões
  const conversionData = useMemo(() => {
    const leadsByTier = groupByTier(leads);
    const mqlsByTier = groupByTier(mqls);
    // ... mais agrupamentos
    
    return TIER_ORDER.map(tier => ({
      tier,
      leads: leadsByTier.get(tier)?.length || 0,
      mqls: mqlsByTier.get(tier)?.length || 0,
      leadToMql: calcConversion(leadsByTier.get(tier), mqlsByTier.get(tier)),
      // ... mais conversões
    }));
  }, [leads, mqls, rms, rrs, propostas, vendas]);
  
  // 4. Renderizar tabela + gráfico
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversão de Funil por Tier de Faturamento</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabela de conversões */}
        <ConversionTable data={conversionData} />
        
        {/* Gráfico de barras agrupadas */}
        <ConversionChart data={conversionData} />
      </CardContent>
    </Card>
  );
}
```

---

### Integração no IndicatorsTab

O widget será adicionado após o `RevenueChartComparison`:

```typescript
// IndicatorsTab.tsx (trecho de modificação)

// Após linha ~2381
<RevenueChartComparison ... />

{/* NOVO: Comparativo de Conversão por Tier */}
<FunnelConversionByTierWidget
  startDate={startDate}
  endDate={endDate}
  selectedBUs={selectedBUs}
  selectedClosers={selectedClosers}
  getItemsForIndicator={getItemsForIndicator}
/>
```

---

### Cores e Destaque Visual

| Taxa de Conversão | Cor | Significado |
|------------------|-----|-------------|
| ≥ 70% | Verde | Excelente |
| 40% - 69% | Amarelo | Atenção |
| < 40% | Vermelho | Gargalo |

---

### Funcionalidades Extras

1. **Tooltip detalhado** - Ao passar mouse sobre célula, mostra números absolutos
2. **Click para drill-down** - Abre DetailSheet com lista de cards filtrada
3. **Responsividade** - Tabela com scroll horizontal em mobile
4. **Collapsible** - Seção pode ser expandida/recolhida como os gráficos existentes

---

### Resultado Esperado

O gestor poderá visualizar rapidamente:
- Em qual tier há maior conversão final (MQL→Venda)
- Onde estão os gargalos por tier (ex: tier premium converte bem no início mas perde em Proposta→Venda)
- Comparar eficiência do funil entre diferentes portes de clientes
