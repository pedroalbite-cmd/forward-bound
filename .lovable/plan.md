

## Plano: Adicionar Gráfico de Faturamento e Remover Análises Detalhadas

### Objetivo

1. Criar um novo gráfico de barras empilhadas mostrando a evolução temporal de **Faturamento Total, MRR, Setup e Pontual**
2. Posicionar este gráfico abaixo do gráfico de Vendas/Funil existente
3. Remover a seção "Análises Detalhadas" (AnalyticsSection)

---

### Novo Componente: `RevenueBreakdownChart.tsx`

Criar um novo componente para exibir a evolução temporal de faturamento com suas componentes:

| Métrica | Descrição | Cor Proposta |
|---------|-----------|--------------|
| Faturamento Total | Soma de MRR + Setup + Pontual | Verde (#22c55e) |
| MRR Incremento | Receita Recorrente Mensal | Azul (#3b82f6) |
| Setup Incremento | Valor de Implantação | Laranja (#f97316) |
| Pontual Incremento | Receitas não recorrentes | Roxo (#8b5cf6) |

**Estrutura do componente:**

```typescript
// src/components/planning/RevenueBreakdownChart.tsx

interface RevenueBreakdownChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  selectedBUs?: BUType[];
  selectedClosers?: string[];
}

export function RevenueBreakdownChart({ ... }: RevenueBreakdownChartProps) {
  // Usar dados do hook useModeloAtualMetas:
  // - getMrrForPeriod
  // - getSetupForPeriod
  // - getPontualForPeriod
  
  // Construir dados do gráfico agrupados (diário/semanal/mensal)
  // baseado no período selecionado
  
  // Layout: Card com 4 barras empilhadas por período
  // Legenda: Faturamento, MRR, Setup, Pontual
  
  return (
    <Card className="bg-card border-2 border-green-500">
      <CardHeader>
        <CardTitle>Faturamento por Período</CardTitle>
        {/* Legenda com as 4 métricas */}
      </CardHeader>
      <CardContent>
        <BarChart data={chartData}>
          <Bar dataKey="mrr" stackId="revenue" fill="#3b82f6" name="MRR" />
          <Bar dataKey="setup" stackId="revenue" fill="#f97316" name="Setup" />
          <Bar dataKey="pontual" stackId="revenue" fill="#8b5cf6" name="Pontual" />
        </BarChart>
      </CardContent>
    </Card>
  );
}
```

---

### Fonte de Dados

Os valores virão do hook `useModeloAtualMetas`:

```typescript
// Valores já disponíveis:
const { getMrrForPeriod, getSetupForPeriod, getPontualForPeriod } = useModeloAtualMetas(startDate, endDate);

// Para gráfico temporal, precisamos adicionar funções de agrupamento:
// getGroupedMonetaryData(type, startDate, endDate, grouping)
```

**Extensão necessária no hook:**

Adicionar função `getGroupedMonetaryData` que retorna arrays de MRR, Setup e Pontual agrupados por dia/semana/mês, similar ao `getGroupedData` existente para quantidades.

---

### Modificações no `IndicatorsTab.tsx`

**1. Adicionar import do novo componente:**

```typescript
import { RevenueBreakdownChart } from "./RevenueBreakdownChart";
```

**2. Remover import do AnalyticsSection:**

```typescript
// REMOVER:
import { AnalyticsSection } from "./indicators/AnalyticsSection";
```

**3. Adicionar o gráfico após a seção de charts existente (linha ~1133):**

```tsx
{/* Charts Section with View Mode Toggle */}
<div className="space-y-4">
  {/* ... gráficos existentes de indicadores ... */}
</div>

{/* NOVO: Revenue Breakdown Chart */}
<RevenueBreakdownChart 
  startDate={startDate} 
  endDate={endDate} 
  selectedBU={selectedBU} 
  selectedBUs={selectedBUs}
  selectedClosers={selectedClosers}
/>

{/* REMOVER Analytics Section */}
{/* <AnalyticsSection buKey={selectedBU} startDate={startDate} endDate={endDate} /> */}
```

---

### Design Visual do Gráfico

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Faturamento por Período                                                │
│                                                                         │
│  Total: R$ 850k    MRR: R$ 510k    Setup: R$ 213k    Pontual: R$ 127k  │
│                                                                         │
│  ■ MRR   ■ Setup   ■ Pontual                                           │
│                                                                         │
│     ┌───┐         ┌───┐         ┌───┐         ┌───┐                    │
│  200k│███│      150k│███│      180k│███│      120k│███│                  │
│     │███│         │███│         │███│         │███│                    │
│     │░░░│         │░░░│         │░░░│         │░░░│                    │
│     │░░░│         │░░░│         │░░░│         │░░░│                    │
│     │▒▒▒│         │▒▒▒│         │▒▒▒│         │▒▒▒│                    │
│     └───┘         └───┘         └───┘         └───┘                    │
│      Jan           Fev           Mar           Abr                      │
└─────────────────────────────────────────────────────────────────────────┘

Legenda: ███ = MRR (azul)   ░░░ = Setup (laranja)   ▒▒▒ = Pontual (roxo)
```

---

### Resumo de Modificações

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/planning/RevenueBreakdownChart.tsx` | Criar | Novo componente de gráfico de faturamento |
| `src/hooks/useModeloAtualMetas.ts` | Modificar | Adicionar funções para agrupar dados monetários por período |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Importar novo componente, remover AnalyticsSection |

---

### Funcionalidades do Gráfico

1. **Agrupamento dinâmico**: Diário (≤31 dias), Semanal (32-90 dias), Mensal (>90 dias)
2. **Filtros respeitados**: BUs selecionadas, Closers selecionados, período de datas
3. **Valores empilhados**: MRR + Setup + Pontual formando o Faturamento Total visual
4. **Header com totais**: Exibe os totais de cada componente no período
5. **Drill-down (opcional)**: Clique na barra para ver os cards de venda correspondentes

---

### Detalhes Técnicos

#### Extensão do Hook `useModeloAtualMetas.ts`

```typescript
// Nova função para agrupar dados monetários
const getGroupedMonetaryData = (
  start: Date, 
  end: Date, 
  grouping: ChartGrouping
): { mrr: number[]; setup: number[]; pontual: number[] } => {
  // Similar a getGroupedData, mas retorna valores monetários
  // agrupados por dia/semana/mês
};
```

#### Integração com Filtro de Closer

Quando há filtro de closer ativo, o gráfico deve:
1. Filtrar cards de venda por closer
2. Somar MRR/Setup/Pontual apenas dos cards filtrados
3. Respeitar a mesma lógica já implementada nos acelerômetros monetários

