

## Redesign do RevenuePaceChart no estilo dos graficos do final da pagina

### Objetivo
Redesenhar o componente `RevenuePaceChart` para seguir o mesmo estilo visual do `RevenueChartGroupedBars` (graficos do final da pagina), incluindo:
- KPI cards por BU com sparklines e progress bars
- Grafico de barras com recharts mostrando realizado vs meta
- Linha de referencia do pace esperado
- Badge de status (acima/abaixo do pace)

### Alteracoes necessarias

#### 1. Expandir as props do RevenuePaceChart

O componente precisa receber dados por BU (nao apenas totais), para poder exibir cards individuais como o grafico do final da pagina:

```text
Props atuais: realized, meta, paceExpected, isLoading
Props novas: + selectedBUs, totalsByBU, metasByBU, paceByBU
```

#### 2. Redesenhar o RevenuePaceChart

O novo layout sera:

```text
Card "Incremento de Faturamento"
  |
  +-- Header com titulo + badge de status (Acima/Abaixo do pace)
  |
  +-- KPI Cards Row (igual ao RevenueChartGroupedBars):
  |     - Um card por BU selecionada com:
  |       - Valor realizado
  |       - Mini barra de progresso (realized/meta)
  |       - % da meta
  |     - Card TOTAL com destaque + pace %
  |
  +-- Grafico de barras (recharts BarChart):
  |     - Duas barras por periodo: "Realizado" e "Meta"
  |     - Linha de referencia tracejada no nivel do pace esperado
  |     - Eixo X: periodos (dias/semanas/meses conforme agrupamento)
  |     - Eixo Y: valores em R$
  |
  +-- Legenda: Realizado | Meta | Pace
```

#### 3. Atualizar IndicatorsTab.tsx

Passar os dados adicionais por BU para o componente:
- Calcular `realizedByBU` usando `getRealizedMonetaryForIndicator` para cada BU
- Calcular `metaByBU` usando `getMetaMonetaryForIndicator` para cada BU  
- Calcular `paceByBU` como `metaByBU * paceFraction`
- Passar `selectedBUs` para o componente

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/planning/indicators/RevenuePaceChart.tsx` | Redesign completo seguindo estilo do RevenueChartGroupedBars: KPI cards por BU, grafico de barras recharts com realized vs meta e pace reference line |
| `src/components/planning/IndicatorsTab.tsx` | Passar dados por BU (totals, metas, pace) e selectedBUs para o RevenuePaceChart |

### Detalhes visuais

- Mesmas cores por BU: Modelo Atual (#3b82f6), O2 TAX (#f59e0b), Oxy Hacker (#8b5cf6), Franquia (#22c55e)
- Mesmos componentes: recharts BarChart, Progress bar, Card com border
- Grafico mostra barra "Realizado" (cor da BU ou primary) ao lado de barra "Meta" (cinza/muted)
- ReferenceLine tracejada no valor do pace esperado
- Badge de status mantido no header (verde/amarelo/vermelho)
