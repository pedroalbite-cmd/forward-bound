

## Usar MRR Base Real de Marco (R$ 756.521,10)

### Problema
O MRR Base atual eh **projetado** usando formula de churn 6%/mes + retencao 25% a partir de um valor inicial de R$ 700k. O valor real de marco eh R$ 756.521,10 e precisa ser usado no lugar da projecao.

### Solucao

Adicionar um mapa de **MRR Base real** (valores conhecidos) no `usePlanGrowthData.ts` que sobrescreve o valor projetado quando disponivel. Isso garante que o grafico de Faturamento no Indicadores mostre o MRR Base correto.

### Alteracao

| Arquivo | O que muda |
|---------|-----------|
| `src/hooks/usePlanGrowthData.ts` | Adicionar mapa `realMrrBase` com os valores reais conhecidos. Apos calcular `mrrDynamic`, sobrescrever `mrrPorMes` com valores reais quando existirem. Isso propaga automaticamente para `faturamentoMeta` (MRR Base + Incremento) e para o `metasPorBU` no contexto. |

### Detalhe tecnico

No `usePlanGrowthData.ts`, apos o calculo do `mrrDynamic`:

```typescript
// Valores reais de MRR Base conhecidos (sobrescrevem projecao)
const realMrrBase: Record<string, number> = {
  Jan: 700000,   // valor inicial
  Fev: 700000,   // atualizar quando souber
  Mar: 756521.10,
};

// Aplicar override nos valores projetados
Object.entries(realMrrBase).forEach(([month, value]) => {
  mrrDynamic.mrrPorMes[month] = value;
  // Recalcular revenueToSell com o MRR real
  const meta = metasMensaisModeloAtual[month] || 0;
  mrrDynamic.revenueToSell[month] = Math.max(0, meta - value);
});
```

Isso faz com que:
- O `faturamentoMeta` para Marco = 756.521,10 + meta de incremento de marco
- O grafico de Faturamento acumulado no Indicadores use o MRR Base real
- Todos os calculos downstream (vendas necessarias, funil reverso) reflitam o valor correto

