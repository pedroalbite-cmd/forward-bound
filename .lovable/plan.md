

# Corrigir inconsistencia Vendas x A Vender no Plan Growth

## Problema

O fix anterior (Math.round + ajuste de revenueToSell) foi aplicado apenas no arquivo `usePlanGrowthData.ts`, mas a tabela do Plan Growth que voce ve na tela e renderizada pelo `MediaInvestmentTab.tsx`, que tem suas proprias copias das funcoes `calculateMrrAndRevenueToSell` e `calculateReverseFunnel` - e essas copias nao foram atualizadas.

Por isso, a tela continua mostrando valores inconsistentes (ex: A Vender = 400.000 com 24 vendas, mas 24 x 17k = 408.000).

## Solucao

Aplicar as mesmas correcoes no `MediaInvestmentTab.tsx`:

### 1. Funcao `calculateMrrAndRevenueToSell` (linha 163-165)
- Trocar `aVender / ticketMedio` por `Math.round(aVender / ticketMedio)`
- Recalcular `revenueToSell[month] = vendasDoMes * ticketMedio` para garantir consistencia

### 2. Funcao `calculateReverseFunnel` (linha 217)
- Alterar calculo de `faturamentoMeta` para usar `mrrBaseAtual + faturamentoVender` quando MRR chain esta disponivel (mesmo ajuste feito no hook)

## Resultado esperado
A tabela do Plan Growth mostrara Vendas x A Vender perfeitamente alinhados: vendas * 17.000 = A Vender para cada mes.

