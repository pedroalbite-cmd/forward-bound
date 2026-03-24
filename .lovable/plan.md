

## Corrigir Meta do Gráfico de Faturamento: usar "Meta" total, não "A Vender"

### Problema
O gráfico RevenuePaceChart está usando `getConsolidatedMeta(bu, month, 'faturamento')` que retorna `monthData.faturamento` do contexto. Esse valor é populado como `faturamentoVender` (A Vender / incremento), não como a Meta total. Para Março do Modelo Atual, mostra ~R$500k em vez de R$1.334.000.

### Cadeia do problema
1. `usePlanGrowthData.ts` linha 453: `faturamento: Math.round(d.faturamentoVender)` ← publica o "A Vender"
2. O campo `faturamentoMeta` (= MRR Base + A Vender) existe no cálculo mas nunca é publicado no contexto
3. `useConsolidatedMetas` linha 75: `case 'faturamento': return faturamento` ← retorna o "A Vender"

### Alterações — somente no gráfico de Faturamento

**Não vamos alterar** `useConsolidatedMetas` nem o contexto (para não quebrar acelerômetros e outros componentes que usam `faturamento` como "A Vender").

**Arquivo 1: `src/contexts/MediaMetasContext.tsx`**
- Adicionar `faturamentoMeta?: number` ao `FunnelDataItem`

**Arquivo 2: `src/hooks/usePlanGrowthData.ts`**
- Na linha 453, adicionar campo: `faturamentoMeta: Math.round(d.faturamentoMeta)`
- Fazer o mesmo para o2Tax, oxyHacker e franquia (para essas BUs, faturamentoMeta = faturamento pois não têm MRR base)

**Arquivo 3: `src/components/planning/IndicatorsTab.tsx`**
- Somente no bloco do RevenuePaceChart (linhas ~2580-2662), em vez de chamar `getConsolidatedMeta(bu, month, 'faturamento')`, ler diretamente `funnelData[buKey].find(d => d.month === monthName)?.faturamentoMeta`
- Aplicar nas 2 ocorrências (totalMeta no header e periodMeta no gráfico)

### Resultado
- O gráfico de Faturamento mostrará R$1.334.000 (Meta total) em vez de R$500k (A Vender)
- Acelerômetros e demais componentes continuam inalterados

