

# Restaurar metas originais de A Vender

## Problema

O fix anterior priorizou a consistencia matematica (vendas x 17k = A Vender) mas ao fazer isso **alterou os valores de A Vender** que voce definiu. Por exemplo, A Vender de Jan passou de R$ 400.000 para R$ 408.000 (24 x 17k).

Os valores originais que voce definiu eram:
- Jan: 400.000 | Fev: 400.000 | Mar: 500.000 | Abr: 532.975 | Mai: 580.000 | Jun: 614.000

## Solucao

Reverter a logica que sobrescreve A Vender. O valor de A Vender volta a ser a fonte de verdade (meta - MRR Base), e vendas sera apenas um indicador arredondado para referencia.

### 1. Codigo - `usePlanGrowthData.ts` (linha 218)
Remover a linha que sobrescreve revenueToSell:
```
// REMOVER: revenueToSell[month] = vendasDoMes * ticketMedio;
```

### 2. Codigo - `MediaInvestmentTab.tsx` (linha ~163)
Mesma remocao da linha que sobrescreve revenueToSell.

### 3. Banco de dados - Recalcular faturamento
Restaurar os valores de faturamento do Modelo Atual para refletir as metas originais de A Vender + MRR Base correto. O MRR Base sera recalculado usando a cadeia de churn (6%) e retencao (25% das vendas arredondadas do mes anterior x 17k):

| Mes | A Vender (restaurado) | Vendas (display) | MRR Base | Faturamento |
|-----|----------------------|-----------------|----------|-------------|
| Jan | 400.000 | 24 | 725.000 | 1.125.000 |
| Fev | 400.000 | 24 | 781.500 | 1.181.500 |
| Mar | 500.000 | 29 | 836.610 | 1.336.610 |
| Abr | 532.975 | 31 | 910.533 | 1.443.508 |
| Mai | 580.000 | 34 | 988.201 | 1.568.201 |
| Jun | 614.000 | 36 | 1.072.889 | 1.686.889 |

Nota: os splits (MRR 25%, Setup 60%, Pontual 15%) serao aplicados sobre o faturamento total.

## Resultado esperado
- A Vender mostrara exatamente 400k, 400k, 500k, 532.975k, 580k, 614k
- Vendas mostrara o valor arredondado (24, 24, 29, 31, 34, 36) como referencia
- Aceita-se que vendas x 17k nao sera exatamente igual a A Vender (diferenca de arredondamento)

