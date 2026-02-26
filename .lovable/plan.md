

# Bug: MRR, Setup e Pontual nao filtram por Closer

## Problema

No `useConsolidatedMetas.ts` (linha 215), o filtro de closer so e aplicado quando `indicatorKey === 'faturamento'`. Para MRR, Setup e Pontual, o codigo cai na linha 220 que chama `getMetaForPeriod` sem nenhum ajuste de closer — mostrando 100% da meta da BU.

## Solucao

Estender a logica de filtro de closer para MRR, Setup e Pontual. Como essas metricas sao derivadas do faturamento (25%, 60%, 15%), a abordagem e:

1. Quando houver filtro de closer ativo para qualquer metrica monetaria (mrr, setup, pontual), calcular primeiro o faturamento filtrado pelo closer
2. Aplicar os percentuais padrao (25%, 60%, 15%) sobre o faturamento ja filtrado

## Arquivo alterado

**`src/hooks/useConsolidatedMetas.ts`** — funcao `getMetaMonetaryForPeriod` (linhas 202-221)

Substituir a condicao `if (indicatorKey === 'faturamento' && ...)` por uma que trate todas as metricas monetarias quando o closer filter estiver ativo:

```typescript
const getMetaMonetaryForPeriod = (
  indicatorKey: ConsolidatedMetricType | 'sla',
  bus: BuType[],
  startDate: Date,
  endDate: Date,
  closerFilter?: string[],
  getFilteredMeta?: (value: number, bu: string, month: string, closers: string[]) => number
): number => {
  if (indicatorKey === 'sla') return 30;

  // Com filtro de closer ativo, ajustar TODAS as métricas monetárias
  if (closerFilter && closerFilter.length > 0 && getFilteredMeta) {
    const filteredFaturamento = getFilteredFaturamentoMeta(bus, startDate, endDate, closerFilter, getFilteredMeta);
    
    switch (indicatorKey) {
      case 'faturamento': return filteredFaturamento;
      case 'mrr': return Math.round(filteredFaturamento * 0.25);
      case 'setup': return Math.round(filteredFaturamento * 0.60);
      case 'pontual': return Math.round(filteredFaturamento * 0.15);
    }
  }

  return getMetaForPeriod(bus, startDate, endDate, indicatorKey);
};
```

Isso garante que ao selecionar um closer, MRR/Setup/Pontual reflitam a proporcao correta da meta filtrada, nao da BU inteira.

