

## Consolidar Gráficos de Faturamento em Um Único Componente

### Objetivo

Criar um único card de faturamento que combine:
- **Parte Superior**: Cards KPI com sparklines (do RevenueChartDashboard)
- **Parte Inferior**: Gráfico de barras agrupadas (do RevenueChartGroupedBars)

### Componente Final

```text
┌─────────────────────────────────────────────────────────────┐
│  Faturamento por Período                                    │
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │
│  │  MA    │ │  TAX   │ │  OXY   │ │  FRQ   │ │  TOTAL   │  │
│  │ R$200k │ │ R$50k  │ │ R$80k  │ │ R$70k  │ │  R$400k  │  │
│  │ ~~~    │ │ ~~~    │ │ ~~~    │ │ ~~~    │ │  ~~~     │  │
│  │ 95%    │ │ 80%    │ │ 120%   │ │ 60%    │ │  100%    │  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │    ██ ██ ██ ██                                      │   │
│  │    ██ ██ ██ ██    ██ ██                             │   │
│  │    ██ ██ ██ ██    ██ ██    ██ ██                    │   │
│  │    ─────────────────────────────── Meta média       │   │
│  │    Jan    Fev    Mar    Abr                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  [MA] [TAX] [OXY] [FRQ]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

### Alterações Técnicas

| Arquivo | Ação |
|---------|------|
| `src/components/planning/revenue-charts/RevenueChartGroupedBars.tsx` | Modificar para incluir os KPI cards com sparklines do dashboard |
| `src/components/planning/revenue-charts/RevenueChartDashboard.tsx` | Deletar (será absorvido pelo GroupedBars) |
| `src/components/planning/revenue-charts/index.ts` | Remover export do Dashboard |
| `src/components/planning/RevenueChartComparison.tsx` | Renderizar apenas o RevenueChartGroupedBars |

---

### Código do Componente Unificado

O `RevenueChartGroupedBars.tsx` será atualizado para:

1. Receber `metasPorBU` como prop adicional
2. Adicionar a seção de KPI cards com sparklines antes do gráfico
3. Manter o gráfico de barras agrupadas existente

**Nova estrutura:**
```typescript
export function RevenueChartGroupedBars({ 
  startDate, endDate, selectedBUs, chartData, totals, metasPorBU
}) {
  // Calcular metas por BU
  const buMetas = useMemo(() => { ... });
  
  // Extrair dados de sparkline
  const sparklineData = useMemo(() => { ... });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento por Período</CardTitle>
      </CardHeader>
      <CardContent>
        {/* KPI Cards Row - do Dashboard */}
        <div className="flex gap-3 flex-wrap mb-4">
          {selectedBUs.map(bu => <BUKpiCard ... />)}
          <TotalCard ... />
        </div>
        
        {/* Gráfico de Barras Agrupadas - existente */}
        <div className="h-80">
          <BarChart ... />
        </div>
        
        {/* Legenda */}
        <Legend ... />
      </CardContent>
    </Card>
  );
}
```

---

### Componentes Internos a Mover

Do `RevenueChartDashboard.tsx` para `RevenueChartGroupedBars.tsx`:

1. **BUKpiCard** - Card individual por BU com sparkline
2. **Total Card** - Card destacado com total geral
3. Lógica de cálculo de `buMetas` e `sparklineData`

**Remover do Dashboard:**
- O `ComposedChart` com barras empilhadas (linhas 244-296)
- A legenda final (linhas 298-309)

---

### Resultado Final

- **1 único componente** ao invés de 2
- **Interface mais limpa** sem duplicação de informação
- **Melhor UX** com KPIs resumidos + detalhamento por período no mesmo card

