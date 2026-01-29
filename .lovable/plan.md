

## Plano: Drill-Down como Mini-Dashboard Analítico Completo

### Diagnóstico da Situação Atual

O que temos hoje:
- ✅ KPI cards simples no topo (números isolados)
- ✅ Tabela detalhada com alertas visuais
- ✅ Narrativas descritivas

**O que está faltando para ser um dashboard de verdade:**
- ❌ **Gráficos visuais** que revelam padrões e distribuições
- ❌ **Visualização de ranking** (quem está performando melhor/pior)
- ❌ **Comparativos temporais** (evolução ao longo do período)
- ❌ **Segmentação visual** (por produto, por closer, por faixa)
- ❌ **Interatividade** (filtrar ao clicar em segmentos)

---

### A Nova Experiência: Modal como Dashboard Analítico

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  "Propostas - Onde o Pipeline Está Travando?"                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 📊 12    │  │ 💰 R$2.1M│  │ 🎯 R$175k│  │ ⚠️ 4     │  │ 🔴 R$800k│                  │
│  │Propostas │  │ Pipeline │  │  Ticket  │  │Envelhecid│  │ em Risco │                  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────────────────────┐  │
│  │   📊 Distribuição por Closer    │  │              🎯 Aging das Propostas          │  │
│  │                                 │  │                                              │  │
│  │   Pedro    ████████░░  R$ 800k  │  │   0-7d   ██████████████████░░░░  6 (50%)    │  │
│  │   Daniel   █████░░░░░  R$ 600k  │  │   8-14d  ████████░░░░░░░░░░░░░░  2 (17%)    │  │
│  │   Lucas    ███░░░░░░░  R$ 350k  │  │   15-30d ██████░░░░░░░░░░░░░░░░  3 (25%)    │  │
│  │                                 │  │   30d+   ██░░░░░░░░░░░░░░░░░░░░  1 (8%) 🔴  │  │
│  └─────────────────────────────────┘  └──────────────────────────────────────────────┘  │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  📋 12 registros                                                 [ordenar por coluna]   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│  │  Empresa       │ Valor   │ MRR   │ Closer │ Dias │ Data Envio │ Pipefy            ││
│  │  ACME Corp     │ R$ 350k │ R$ 25k│ Pedro  │ 45d🔴│ 15/12/2025 │ 🔗                ││
│  │  TechCo        │ R$ 200k │ R$ 15k│ Daniel │ 32d🔴│ 28/12/2025 │ 🔗                ││
│  │  ...                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Componentes de Visualização a Criar

#### 1. `DrillDownBarChart` - Gráfico de Barras Horizontal para Rankings

Mostra distribuição por dimensão (closer, produto, faixa de faturamento):
- Barras horizontais ordenadas por valor
- Cor indicando performance (verde = acima da média, vermelho = abaixo)
- Clicável para filtrar a tabela abaixo

**Uso por indicador:**
| Indicador | Dimensão Principal | Métrica |
|-----------|-------------------|---------|
| MQL | Faixa Faturamento | Quantidade |
| RM | Closer | Quantidade |
| RR | Closer | Taxa Show |
| Proposta | Closer | Valor Pipeline |
| Venda | Closer | Valor Total |
| SLA | SDR | SLA Médio |
| Faturamento | Closer | Valor |
| MRR | Closer | Valor MRR |

#### 2. `DrillDownProgressBars` - Barras de Distribuição/Aging

Mostra distribuição em faixas (aging, SLA ranges, faixas de valor):
- Barras segmentadas com cores (verde/amarelo/vermelho)
- Percentual e quantidade em cada faixa
- Visual imediato de onde estão os problemas

**Uso por indicador:**
| Indicador | Distribuição |
|-----------|-------------|
| Proposta | Aging (0-7d, 8-14d, 15-30d, 30d+) |
| SLA | Tempo (< 30m, 30m-1h, 1h-2h, > 2h) |
| MQL | Tempo até Qualificar (1-3d, 4-7d, 8-14d, 14d+) |
| Venda | Ciclo de Venda (< 30d, 30-60d, 60-90d, > 90d) |

#### 3. `DrillDownPieChart` - Gráfico de Pizza para Composição

Mostra composição percentual:
- Segmentos clicáveis para filtrar
- Legenda com valores absolutos

**Uso por indicador:**
| Indicador | Composição |
|-----------|-----------|
| Faturamento | MRR vs Setup vs Pontual |
| MQL | Por Produto (CaaS, O2 TAX, etc.) |
| Venda | Por Produto |

---

### Configuração por Indicador

#### MQL - "De Onde Vêm Nossos Melhores Leads?"

| Seção | Visualização |
|-------|--------------|
| KPIs | Total, % Premium, Tempo Médio, Top SDR |
| Gráfico 1 | **Barras**: Distribuição por Faixa Faturamento |
| Gráfico 2 | **Progress**: Tempo até Qualificar |
| Tabela | Lista completa |

#### RM - "Estamos Convertendo MQLs em Reuniões?"

| Seção | Visualização |
|-------|--------------|
| KPIs | Total, Taxa MQL→RM, Tempo Médio, Top Closer |
| Gráfico 1 | **Barras**: Ranking de Closers (quantidade) |
| Gráfico 2 | **Progress**: Tempo como MQL antes de agendar |
| Tabela | Lista completa |

#### RR - "Quem Apareceu nas Reuniões?"

| Seção | Visualização |
|-------|--------------|
| KPIs | Realizadas, Taxa Show, No-Shows, Potencial |
| Gráfico 1 | **Barras**: Ranking de Closers (taxa show) |
| Gráfico 2 | **Progress**: Tempo entre agendar e realizar |
| Tabela | Lista completa |

#### Proposta - "Onde o Pipeline Está Travando?"

| Seção | Visualização |
|-------|--------------|
| KPIs | Total, Pipeline, Ticket Médio, Envelhecidas, em Risco |
| Gráfico 1 | **Barras**: Pipeline por Closer (valor R$) |
| Gráfico 2 | **Progress**: Aging das Propostas (cores de alerta) |
| Tabela | Lista ordenada por aging |

#### Venda - "O Que Fechamos e Como?"

| Seção | Visualização |
|-------|--------------|
| KPIs | Contratos, Total, % MRR, % Setup, Top Closer |
| Gráfico 1 | **Barras**: Ranking de Closers (valor R$) |
| Gráfico 2 | **Pizza**: Composição (MRR/Setup/Pontual) |
| Tabela | Lista ordenada por valor |

#### SLA - "Estamos Respondendo Rápido?"

| Seção | Visualização |
|-------|--------------|
| KPIs | Leads, SLA Médio, % Meta, Mediana, Outliers |
| Gráfico 1 | **Barras**: SLA Médio por SDR |
| Gráfico 2 | **Progress**: Distribuição de SLA (faixas de tempo) |
| Tabela | Lista ordenada por SLA (piores primeiro) |

#### Faturamento - "De Onde Veio o Dinheiro?"

| Seção | Visualização |
|-------|--------------|
| KPIs | Total, % MRR, % Setup, % Pontual, vs Meta |
| Gráfico 1 | **Barras**: Faturamento por Closer |
| Gráfico 2 | **Pizza**: Composição MRR/Setup/Pontual |
| Tabela | Lista ordenada por valor |

#### MRR, Setup, Pontual

| Seção | Visualização |
|-------|--------------|
| KPIs | Contratos, Total, ARR/Média, % do Fat., Maior |
| Gráfico 1 | **Barras**: Ranking por Closer |
| Gráfico 2 | **Progress**: Concentração (top 3 clientes vs resto) |
| Tabela | Lista ordenada por valor |

---

### Seção Técnica

#### Novos Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/planning/indicators/DrillDownBarChart.tsx` | Gráfico de barras horizontais para rankings |
| `src/components/planning/indicators/DrillDownDistribution.tsx` | Barras de distribuição/aging com cores |
| `src/components/planning/indicators/DrillDownPieChart.tsx` | Gráfico de pizza para composição |
| `src/components/planning/indicators/DrillDownCharts.tsx` | Container que orquestra os gráficos por indicador |

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `DetailSheet.tsx` | Adicionar prop `charts` com configuração de gráficos, renderizar área de gráficos |
| `IndicatorsTab.tsx` | Configurar gráficos específicos para cada indicador nos handlers |

#### Interface de Configuração de Gráficos

```typescript
interface ChartConfig {
  type: 'bar' | 'distribution' | 'pie';
  title: string;
  data: ChartDataItem[];
}

interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
  highlight?: 'success' | 'warning' | 'danger' | 'neutral';
}

interface DetailSheetProps {
  // ... existing props ...
  charts?: ChartConfig[];
}
```

#### Exemplo de Configuração para Proposta

```typescript
case 'proposta': {
  // ... cálculos existentes ...
  
  // Chart 1: Pipeline por Closer
  const closerTotals = new Map<string, number>();
  items.forEach(i => {
    const closer = i.responsible || 'Sem Closer';
    closerTotals.set(closer, (closerTotals.get(closer) || 0) + (i.value || 0));
  });
  const pipelineByCloser: ChartDataItem[] = Array.from(closerTotals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  
  // Chart 2: Aging Distribution
  const agingBuckets = [
    { label: '0-7 dias', count: itemsWithAging.filter(i => (i.diasEmProposta || 0) <= 7).length, highlight: 'success' },
    { label: '8-14 dias', count: itemsWithAging.filter(i => (i.diasEmProposta || 0) > 7 && (i.diasEmProposta || 0) <= 14).length, highlight: 'neutral' },
    { label: '15-30 dias', count: itemsWithAging.filter(i => (i.diasEmProposta || 0) > 14 && (i.diasEmProposta || 0) <= 30).length, highlight: 'warning' },
    { label: '30+ dias', count: itemsWithAging.filter(i => (i.diasEmProposta || 0) > 30).length, highlight: 'danger' },
  ];
  
  const charts: ChartConfig[] = [
    { type: 'bar', title: 'Pipeline por Closer', data: pipelineByCloser },
    { type: 'distribution', title: 'Aging das Propostas', data: agingBuckets.map(b => ({ label: b.label, value: b.count, highlight: b.highlight })) },
  ];
  
  setDetailSheetCharts(charts);
  // ... resto do código ...
}
```

#### Componente DrillDownBarChart

```typescript
interface DrillDownBarChartProps {
  title: string;
  data: { label: string; value: number; highlight?: string }[];
  formatValue?: (value: number) => string;
}

export function DrillDownBarChart({ title, data, formatValue = String }: DrillDownBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="space-y-2">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-20 truncate">{item.label}</span>
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded transition-all",
                  item.highlight === 'success' ? 'bg-green-500' :
                  item.highlight === 'danger' ? 'bg-red-500' :
                  item.highlight === 'warning' ? 'bg-amber-500' :
                  'bg-primary'
                )}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium w-24 text-right">{formatValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Componente DrillDownDistribution

```typescript
interface DrillDownDistributionProps {
  title: string;
  data: { label: string; value: number; highlight?: string }[];
}

export function DrillDownDistribution({ title, data }: DrillDownDistributionProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="space-y-2">
        {data.map((item) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20">{item.label}</span>
              <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-l",
                    item.highlight === 'success' ? 'bg-green-500' :
                    item.highlight === 'danger' ? 'bg-red-500' :
                    item.highlight === 'warning' ? 'bg-amber-500' :
                    'bg-blue-500'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm w-20 text-right">
                {item.value} ({Math.round(pct)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Resultado Final

Cada drill-down agora será um **mini-dashboard analítico** completo com:

1. **KPI Cards** - Métricas-chave destacadas visualmente
2. **Gráfico de Ranking** - Quem está performando melhor/pior
3. **Gráfico de Distribuição** - Onde estão os problemas (aging, SLA, etc.)
4. **Tabela Detalhada** - Lista completa para análise granular

Isso transforma o clique no acelerômetro de uma simples lista para uma **experiência analítica completa** que responde perguntas de negócio instantaneamente.

