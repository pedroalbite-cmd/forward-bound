

## Substituir DRE por Fluxo de Caixa (Cashflow) no Gráfico de Faturamento

### Problema
O código atual usa dados do DRE (competência) como "Realizado" no gráfico de faturamento. O correto é usar o **fluxo de caixa** (recebimentos reais), pois mostra quanto efetivamente entrou por mês.

### O que muda

O hook `useOxyFinance` já busca o endpoint `cashflow_chart` que retorna entradas/saídas/saldo por mês. Mas para o gráfico de faturamento, precisamos dos **recebimentos mensais** (inflows) — não do DRE.

### Alterações

**1. `src/hooks/useOxyFinance.ts`**
- Expor `cashflowByMonth: Record<MonthType, number>` — um mapa mês → total de recebimentos (inflows) extraído do `cashflowChart`
- Derivado do array `cashflowChart` que já existe, agrupando inflows por mês

**2. `src/components/planning/IndicatorsTab.tsx`**
- Trocar a lógica DRE por cashflow: em vez de somar `dreByBU[bu][month]`, usar `cashflowByMonth[month]` (total da empresa, pois o fluxo de caixa não vem separado por BU)
- Nos dois blocos (~linha 2526 e ~linha 2601): substituir `dreTotal` por `cashflowByMonth[monthName]`
- Se `cashflowByMonth[month] > 0`, usar como realizado; senão fallback para MRR+Pipefy

**3. `src/components/planning/indicators/RevenuePaceChart.tsx`**
- Atualizar badge de "DRE Contábil" para "Fluxo de Caixa (Oxy Finance)"

### Lógica
```text
Para cada mês:
  cashflow = cashflowByMonth[month]  // inflows do fluxo de caixa
  SE cashflow > 0:
    realized = cashflow * fraction
  SENÃO:
    realized = mrrBase * fraction + setupPontual  // fallback
```

### Observação
O fluxo de caixa da Oxy Finance é consolidado (não separado por BU). Quando o usuário filtra por BU específica, o fallback Pipefy será usado. O cashflow só se aplica quando todas as BUs estão selecionadas ou como total geral.

