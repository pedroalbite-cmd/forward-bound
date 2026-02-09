

# Corrigir meta de Faturamento no acelerometro

## Problema confirmado

O arquivo `useConsolidatedMetas.ts` **nao foi modificado** na tentativa anterior - o codigo continua identico ao original.

O banco `monetary_metas` tem para Fev modelo_atual:
- `faturamento`: R$ 1.237.500 (meta **total** do mes)
- `mrr`: R$ 139.000, `setup`: R$ 333.600, `pontual`: R$ 83.400

O acelerometro "Faturamento" deveria mostrar o **Incremento** (A Vender), mas `getConsolidatedMeta` retorna R$ 1.237.500 do banco diretamente.

Para 9 dias: pro-rata = 1.237.500 * 9/28 = ~R$ 398k (o que aparece no screenshot).
Para mes inteiro: retorna R$ 1.237.500 (o "milhao" que o usuario ve).

## Solucao

### Arquivo: `src/hooks/useConsolidatedMetas.ts`

**Mudanca 1 - `getConsolidatedMeta` (linhas 92-111)**:
Para `modelo_atual` + `faturamento`, pular o DB e usar Plan Growth (que calcula Incremento = vendas * ticket, onde vendas vem do `revenueToSell`).

```typescript
const getConsolidatedMeta = (
  bu: BuType,
  month: MonthType,
  metric: ConsolidatedMetricType
): ConsolidatedMetaResult => {
  // Para modelo_atual + faturamento, usar Plan Growth (que calcula Incremento = Total - MRR Base)
  // O DB armazena o faturamento TOTAL, mas o acelerometro precisa do INCREMENTO
  const skipDbForFaturamento = bu === 'modelo_atual' && metric === 'faturamento';

  if (!skipDbForFaturamento) {
    const dbValue = getMeta(bu, month, metric as MetricType);
    if (dbValue > 0) {
      return { value: dbValue, source: 'database' };
    }
  }

  const planGrowthValue = getPlanGrowthMeta(bu, month, metric);
  if (planGrowthValue > 0) {
    return { value: planGrowthValue, source: 'plan_growth' };
  }

  return { value: 0, source: 'calculated' };
};
```

**Mudanca 2 - `getFilteredFaturamentoMeta` (linhas 153-182)**:
Adicionar pro-rata por dias (igual a `getMetaForPeriod`).

```typescript
const getFilteredFaturamentoMeta = (
  bus: BuType[],
  startDate: Date,
  endDate: Date,
  closerFilter?: string[],
  getFilteredMeta?: (...) => number
): number => {
  const monthsInPeriod = eachMonthOfInterval({ start: startDate, end: endDate });
  let total = 0;

  for (const monthDate of monthsInPeriod) {
    const monthName = MONTH_NAMES[getMonth(monthDate)];
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const overlapStart = startDate > monthStart ? startDate : monthStart;
    const overlapEnd = endDate < monthEnd ? endDate : monthEnd;
    if (overlapStart > overlapEnd) continue;

    const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const fraction = daysInMonth > 0 ? overlapDays / daysInMonth : 0;

    bus.forEach(bu => {
      let faturamento = getConsolidatedMeta(bu, monthName, 'faturamento').value;

      if (bu === 'modelo_atual' && closerFilter?.length > 0 && getFilteredMeta) {
        const vendas = faturamento / BU_TICKETS[bu];
        const filteredVendas = getFilteredMeta(vendas, bu, monthName, closerFilter);
        faturamento = filteredVendas * BU_TICKETS[bu];
      }

      total += faturamento * fraction;
    });
  }

  return Math.round(total);
};
```

## Resultado esperado

- Fev 1-9 Modelo Atual: Faturamento de ~R$ 398k para ~R$ 129k (incremento pro-rata)
- Fev inteiro Modelo Atual: Faturamento de ~R$ 1.2M para ~R$ 400k (incremento correto)
- MRR (R$ 45k), Setup (R$ 107k), Pontual (R$ 27k): sem alteracao (valores do DB ja sao corretos)
