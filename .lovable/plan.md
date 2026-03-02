

## Redesign do RevenuePaceChart: Faturamento Total + Incremento com Pace Real

### Problema atual
1. O grafico distribui os totais uniformemente entre os periodos (`faturamentoRealized / periodCount`), sem usar dados reais por dia/semana
2. Nao mostra o **faturamento total previsto** (MRR Base + Incremento) -- mostra apenas o incremento
3. O pace nao esta sendo visualizado corretamente no grafico

### O que sera adicionado

O card do RevenuePaceChart tera:
- **KPI Cards por BU**: Mostrando o incremento realizado, com % da meta e pace (mantido)
- **KPI Card TOTAL**: Alem do incremento, mostrar tambem o **Faturamento Total Previsto** (MRR Base + Incremento)
- **Grafico de barras por periodo**: Barras de "Realizado" (incremento real) e "Meta" (incremento meta) usando dados reais agrupados por dia/semana/mes
- **Linha tracejada de Pace**: Representando a meta diaria/semanal proporcional ao periodo

### Dados do Faturamento Total

O `metasPorBU` do contexto `MediaMetasContext` ja armazena o `faturamentoMeta` por mes, que para o Modelo Atual inclui MRR Base + Incremento. Para as demais BUs, o faturamentoMeta eh igual ao incremento.

No card TOTAL, sera exibido:
- **Incremento Realizado**: soma das vendas no periodo (valor atual)
- **Faturamento Total Previsto**: soma dos `faturamentoMeta` mensais do periodo de todas as BUs selecionadas (vem do `metasPorBU`)

### Dados reais por periodo no grafico

Em vez de distribuir uniformemente, usar a mesma logica dos outros graficos:
- Para cada BU, agrupar os dados de venda por dia/semana/mes usando os hooks de analytics existentes
- Usar `buildChartData` existente como referencia para gerar os dados temporais reais

### Alteracoes por arquivo

| Arquivo | Alteracao |
|---------|-----------|
| `RevenuePaceChart.tsx` | Adicionar prop `faturamentoTotal` para mostrar no card TOTAL. Melhorar label para exibir "Faturamento Previsto: R$ X" abaixo do incremento. |
| `IndicatorsTab.tsx` | 1. Calcular `faturamentoTotal` somando `metasPorBU[bu]` dos meses no periodo para cada BU selecionada. 2. Construir `paceChartData` com dados reais agrupados por periodo (usando as mesmas funcoes de agrupamento dos outros graficos). Passar como prop. |

### Layout do card TOTAL atualizado

```text
TOTAL
R$ 527k  (incremento realizado)
63% meta | Pace: 63%
[========-----] barra de progresso
Meta Incremento: R$ 842k | Pace: R$ 842k
Faturamento Previsto: R$ 4.2M (MRR Base + Incremento)
```

### Construcao do chartData com dados reais

Para cada periodo (dia/semana/mes), somar o realizado de cada BU usando:
- **Modelo Atual**: `modeloAtualAnalytics.getCardsForIndicator('venda')` agrupado pela data do card
- **O2 TAX**: `o2TaxAnalytics.getCardsForIndicator('venda')` agrupado pela data
- **Oxy Hacker/Franquia**: `getExpansaoGroupedData` / `getOxyHackerGroupedData` agrupado

A meta por periodo sera distribuida proporcionalmente (meta mensal / dias no mes) para agrupamento diario, ou somada para mensal.
