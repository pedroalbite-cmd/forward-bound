

## Transformar RevenuePaceChart em grafico de Pace Acumulado (Area Chart)

### Objetivo
Substituir o grafico de barras atual por um **grafico de area acumulado** identico ao grafico de MQLs mostrado na referencia:
- Linha "Meta Acumulada" (verde solido)
- Area "Realizado Acumulado" (verde com preenchimento)
- Eixo X: dias do periodo (1, 2, 3... 28, 1, 2)
- KPIs no header: Faturamento Total e Meta Total

### Layout final

```text
Card "Faturamento"
  |
  +-- Header esquerdo: "Faturamento" + Badge "Acumulado" + seta
  |-- Header direito: "Faturamento: R$ X    Meta: R$ Y"
  |
  +-- Legenda: "Meta Acumulada" (linha) + "Realizado Acumulado" (area)
  |
  +-- Area Chart (ComposedChart com Area + Line):
  |     - Area preenchida verde = Realizado acumulado dia a dia
  |     - Linha verde = Meta acumulada dia a dia
  |     - Eixo X = dias do periodo
  |     - Eixo Y = valores em R$
```

### Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `RevenuePaceChart.tsx` | Redesign completo: trocar BarChart por ComposedChart com Area (realizado acumulado) + Line (meta acumulada). Remover KPI card interno e usar header com totais no estilo do IndicatorChartSection. Usar mesmo gradiente e cores dos graficos existentes. Manter badge de status e Collapsible. |
| `IndicatorsTab.tsx` | Alterar `paceChartData` para ser **cumulativo**: cada ponto soma todos os dias anteriores. Cada entrada tera `{ label: "1", "2"..., realizado: acumuladoAteAqui, meta: metaAcumuladaAteAqui }`. Os valores incluem MRR Base pro-rata acumulado + incremento acumulado. |

### Detalhes tecnicos

**chartData cumulativo no IndicatorsTab:**
- Para cada dia do periodo, calcular:
  - `metaAcumulada[i] = metaAcumulada[i-1] + metaDoDia` (MRR Base pro-rata/dia + meta incremento/dia)
  - `realizadoAcumulado[i] = realizadoAcumulado[i-1] + realizadoDoDia` (MRR Base pro-rata/dia + vendas reais do dia)
- Label do eixo X: numero do dia do mes (1, 2, 3... 28, 1, 2)

**RevenuePaceChart redesenhado:**
- Usar `ComposedChart` com `Area` (realizado) + `Line` (meta) - mesmo padrao do `IndicatorChartSection`
- Gradiente verde para area preenchida
- Header com totais (Faturamento: R$ X | Meta: R$ Y) no lado direito
- Badge "Acumulado" ao lado do titulo
- Collapsible para expandir/recolher
- Remover o card KPI interno (realizado/meta/pace/atingimento) - os totais vao direto no header
- Tooltip formatado em R$
