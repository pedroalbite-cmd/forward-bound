

# Alinhar Vendas x Ticket Medio no Modelo Atual

## Problema atual

O "A Vender" e a quantidade de "Vendas" estao inconsistentes. Exemplo: A Vender = R$ 400.000 com 24 vendas, mas 24 x R$ 17.000 = R$ 408.000 (nao R$ 400.000). Isso acontece porque o sistema usa `Math.ceil(aVender / ticketMedio)` para calcular vendas, criando arredondamentos.

## Solucao proposta

Tornar "Vendas" o valor principal e derivar "A Vender" a partir dele:

1. Calcular vendas = `Math.round(aVender / 17.000)` para cada mes
2. Ajustar faturamento = MRR Base + (vendas x 17.000) para garantir consistencia
3. Atualizar os campos `vendas` e `ticket_medio` no banco de dados

### Calculo mes a mes

Usando ticket medio = R$ 17.000 e os valores de A Vender desejados:

| Mes | A Vender original | Vendas (arredondado) | A Vender ajustado (vendas x 17k) | MRR Base | Faturamento final |
|-----|-------------------|---------------------|----------------------------------|----------|-------------------|
| Jan | 400.000 | 24 | 408.000 | 725.000 | 1.133.000 |
| Fev | 400.000 | 24 | 408.000 | ~782.720 | ~1.190.720 |
| Mar | 500.000 | 29 | 493.000 | ~837.557 | ~1.330.557 |
| Abr | 532.975 | 31 | 527.000 | ~910.505 | ~1.437.505 |
| Mai | 580.000 | 34 | 578.000 | ~988.175 | ~1.566.175 |
| Jun | 614.000 | 36 | 612.000 | ~1.073.605 | ~1.685.605 |

Nota: Os valores de MRR Base precisam ser recalculados sequencialmente porque cada mes depende das vendas do mes anterior (retencao de 25%).

## Alternativa

Se preferir manter os valores de "A Vender" exatos (400k, 400k, 500k, etc.), a quantidade de vendas ficara com decimais (ex: 23,53 vendas), o que nao faz sentido operacionalmente.

## Execucao tecnica

1. Recalcular a cadeia MRR Base com os valores de vendas arredondados (churn 6%, retencao 25%, ticket 17k)
2. Atualizar na tabela `monetary_metas`: campos `faturamento`, `mrr`, `setup`, `pontual`, `vendas` e `ticket_medio` para Jan-Jun 2026 (bu = 'modelo_atual')
3. O `usePlanGrowthData` ira automaticamente refletir os novos valores no Plan Growth

