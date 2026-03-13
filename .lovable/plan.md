

## Problema: Gráfico mostra linha reta porque distribui o total mensal uniformemente

O código atual calcula o realizado diário assim:
```
periodRealized = cashflowByMonth["Mar"] * (1/31)  // mesmo valor todo dia
```

Isso gera uma reta. O correto é usar os dados reais da tabela `daily_revenue` para cada dia específico.

## Alterações

### 1. `src/components/planning/IndicatorsTab.tsx`

**Destructure `dailyRevenue` do hook:**
- Linha 421: trocar `{ cashflowByMonth, isLoading: isLoadingDre }` por `{ cashflowByMonth, dailyRevenue, isLoading: isLoadingDre }`

**Criar um mapa de lookup `dailyRevenueMap`** (dia → valor):
```typescript
const dailyRevenueMap = useMemo(() => {
  const map: Record<string, number> = {};
  for (const row of dailyRevenue) {
    map[row.date] = row.total_inflows;
  }
  return map;
}, [dailyRevenue]);
```

**No bloco de construção do chart (linhas ~2598-2615):**
Em vez de `cashflowTotalPeriod * fraction`, somar os valores reais da `dailyRevenueMap` para os dias do período:

```typescript
// Para cada dia no overlap period, somar o valor real daquele dia
const overlapDays = eachDayOfInterval({ start: overlapStart, end: overlapEnd });
let periodDailyTotal = 0;
for (const day of overlapDays) {
  const key = format(day, 'yyyy-MM-dd');
  periodDailyTotal += dailyRevenueMap[key] || 0;
}

if (periodDailyTotal > 0 || hasDailyData) {
  periodRealized += periodDailyTotal;
} else {
  // fallback existente (MRR + setup/pontual)
}
```

**No bloco do header (linhas ~2526-2540):**
Mesma lógica — somar valores diários reais para o período em vez de `cashflowByMonth * fraction`.

### 2. Nenhuma mudança no hook `useOxyFinance.ts`
O `dailyRevenue` já é exposto corretamente com `date` e `total_inflows`.

### Resultado
O gráfico acumulado mostrará uma curva irregular refletindo os dias com mais ou menos recebimentos, em vez de uma reta.

