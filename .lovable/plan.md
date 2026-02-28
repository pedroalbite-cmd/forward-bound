

## Adicionar Franquia e Oxy Hacker ao gauge "Pontual" no acelerometro

### Problema identificado
No `IndicatorsTab.tsx`, a funcao `getRealizedMonetaryForIndicator` no `case 'pontual'` (linhas 1865-1885) so soma valores de **Modelo Atual** e **O2 TAX**. Nao inclui **Franquia** nem **Oxy Hacker**, mesmo que a taxa de franquia dessas BUs seja essencialmente um valor pontual.

Por isso o valor de R$ 105k (card Silvio Filho) aparece apenas no drill-down, mas nao no gauge "Pontual" principal.

### Analise dos demais arquivos
Verifiquei todos os arquivos que usam tickets fixos (140k/54k):

| Arquivo | Status | Motivo |
|---------|--------|--------|
| `useExpansaoMetas.ts` | OK | Ja usa taxaFranquia com fallback |
| `useOxyHackerMetas.ts` | OK | Ja usa taxaFranquia com fallback |
| `useExpansaoAnalytics.ts` | OK | `getExpansaoCardValue` ja usa taxaFranquia com fallback (linhas 105-114) |
| `RevenueChartComparison.tsx` | OK | `getExpansaoCardValue` ja usa logica correta (linhas 105-114) |
| `PeriodFunnelChart.tsx` | OK | Ja usa `getExpansaoValue`/`getOxyHackerValue` |
| `ClickableFunnelChart.tsx` | OK | Ja usa `getExpansaoValue`/`getOxyHackerValue` |
| `useConsolidatedMetas.ts` | OK (metas) | Tickets fixos sao para metas de planejamento, nao realizado |
| `MonthlyRevenueTab.tsx` | OK (metas) | Projecao de faturamento mensal planejado |
| `MediaInvestmentTab.tsx` | OK (metas) | Planejamento de investimento |
| `usePlanGrowthData.ts` | OK (metas) | Dados de crescimento planejado |
| **IndicatorsTab.tsx case 'pontual'** | **PROBLEMA** | **Nao inclui Franquia nem Oxy Hacker** |

### Alteracao necessaria

**Arquivo:** `src/components/planning/IndicatorsTab.tsx` (linhas 1880-1885)

Adicionar Franquia e Oxy Hacker ao `case 'pontual'`, usando `getExpansaoValue('venda')` e `getOxyHackerValue('venda')` que ja retornam o valor real da taxa de franquia com fallback correto.

```text
case 'pontual': {
  let total = 0;
  
  // Modelo Atual pontual
  if (includesModeloAtual) {
    // ... logica existente (closer filter)
    total += getPontualForPeriod(startDate, endDate);
  }
  
  // O2 TAX Pontual
  if (includesO2Tax) {
    total += getO2TaxPontual(startDate, endDate);
  }
  
+ // Franquia: Taxa de franquia = valor pontual
+ if (includesFranquia) {
+   total += getExpansaoValue('venda', startDate, endDate);
+ }
+ 
+ // Oxy Hacker: Taxa = valor pontual  
+ if (includesOxyHacker) {
+   total += getOxyHackerValue('venda', startDate, endDate);
+ }
  
  return total;
}
```

### Resultado
- O gauge "Pontual" passa a incluir R$ 105k do card Silvio Filho e quaisquer outros cards de Franquia/Oxy Hacker com contrato assinado
- Valor fica consistente entre o gauge e o drill-down
- Apenas 1 arquivo precisa ser alterado

