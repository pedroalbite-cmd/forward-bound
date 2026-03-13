

## Integrar Faturamento DRE (Oxy Finance) no Gráfico de Faturamento

### Problema Atual
O gráfico "Faturamento" abaixo dos acelerometros calcula o realizado como:
- `MRR Base (tabela mrr_base_monthly)` + `Setup + Pontual (cards do Pipefy)`

Isso é uma estimativa. O faturamento contábil real vem da API Oxy Finance (DRE), que já temos integrada via `useOxyFinance`.

### Solução
Para meses fechados onde temos dado DRE da Oxy Finance, usar o valor contábil real no lugar da soma MRR+Setup+Pontual. Para o mês corrente ou meses sem dado DRE, manter o cálculo atual como fallback.

### Alterações

**`src/components/planning/IndicatorsTab.tsx`**
- Importar `useOxyFinance`
- No bloco de cálculo do gráfico de faturamento (~linha 2505-2540), para cada mês:
  - Somar `dreByBU[bu][monthName]` de todas as BUs selecionadas
  - Se o total DRE > 0 para aquele mês, usar como `periodRealized` em vez de `mrrBase + setup + pontual`
  - Caso contrário, manter cálculo atual
- Aplicar a mesma lógica no bloco de chart data (~linha 2572-2598)

**`src/components/planning/indicators/RevenuePaceChart.tsx`**
- Adicionar indicador visual (badge ou legenda) quando os dados vêm do DRE contábil vs estimativa Pipefy

### Lógica Resumida
```text
Para cada mês no período:
  dreTotal = soma de dreByBU[bu][month] para BUs selecionadas
  SE dreTotal > 0:
    realized = dreTotal * fraction  (faturamento contábil)
  SENÃO:
    realized = mrrBase * fraction + setupPontual  (fallback Pipefy)
```

