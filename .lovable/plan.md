
# Fix: Meta de Faturamento 408k vs 400k (erro de arredondamento)

## Problema

No hook `useConsolidatedMetas.ts`, a meta de faturamento do Plan Growth e calculada como:
```
vendas * ticket_medio = 24 * 17.000 = 408.000
```
Mas `vendas` ja foi arredondado com `Math.ceil(400.000 / 17.000) = Math.ceil(23.53) = 24`. O valor correto deveria ser R$ 400.000 (o incremento exato calculado no Plan Growth).

## Causa raiz

O `FunnelDataItem` no contexto nao armazena o valor financeiro original — so armazena `vendas` (quantidade arredondada). Quando o `useConsolidatedMetas` tenta reconstruir o faturamento multiplicando `vendas * ticket`, o arredondamento causa a discrepancia.

## Solucao

### 1. `src/contexts/MediaMetasContext.tsx`
Adicionar campo `faturamento` ao `FunnelDataItem`:
```typescript
export interface FunnelDataItem {
  month: string;
  leads: number;
  mqls: number;
  rms: number;
  rrs: number;
  propostas: number;
  vendas: number;
  investimento: number;
  faturamento?: number; // valor financeiro exato (incremento)
}
```

### 2. `src/hooks/usePlanGrowthData.ts`
Ao publicar funnelData no contexto, incluir o valor de faturamento exato:
- Para Modelo Atual: usar `faturamentoVender` (incremento)
- Para outras BUs: usar o valor mensal direto (o2TaxMonthly, oxyHackerMonthly, franquiaMonthly)

### 3. `src/hooks/useConsolidatedMetas.ts`
Alterar `getPlanGrowthMeta` para usar o campo `faturamento` do funnelData quando disponivel, em vez de recalcular via `vendas * ticket`:

```
Antes:  const faturamento = (monthData.vendas || 0) * BU_TICKETS[bu];
Depois: const faturamento = monthData.faturamento ?? ((monthData.vendas || 0) * BU_TICKETS[bu]);
```

## Resultado esperado

- Indicadores Fev Modelo Atual: Meta = R$ 400.000 (exato, igual ao Plan Growth)
- MRR = R$ 100.000 (25% de 400k)
- Setup = R$ 240.000 (60% de 400k)
- Pontual = R$ 60.000 (15% de 400k)
