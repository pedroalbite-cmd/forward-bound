

# Ajustar "A Vender" do Modelo Atual (Jan-Jun 2026)

## Como funciona o calculo

O campo `faturamento` no banco representa o **faturamento TOTAL** do mes (MRR Base + Incremento). O sistema calcula o "A Vender" dinamicamente:

```text
MRR Base(Jan) = faturamento(Jan) - 400.000 (valor inicial fixo)
MRR Base(Fev) = MRR Base(Jan) * 0.94 + vendas(Jan) * 17.000 * 0.25
A Vender(mes) = faturamento(mes) - MRR Base(mes)
```

Portanto, para obter os valores desejados de "A Vender", precisamos calcular o `faturamento` correto para cada mes (faturamento = MRR Base + A Vender desejado).

## Calculo sequencial

Simulando a cadeia de MRR Base com churn de 6% e retencao de 25%:

| Mes | MRR Base calculado | A Vender desejado | Faturamento necessario |
|-----|-------------------|-------------------|----------------------|
| Jan | 725.000           | 400.000           | 1.125.000 (manter)   |
| Fev | 781.500           | 400.000           | 1.181.500            |
| Mar | 834.610           | 500.000           | 1.334.610            |
| Abr | 909.533           | 532.975           | 1.442.508            |
| Mai | 988.205           | 580.000           | 1.568.205            |
| Jun | 1.073.913         | 614.000           | 1.687.913            |

## Valores a gravar no banco

Para cada mes, o faturamento sera dividido em MRR (25%), Setup (60%) e Pontual (15%):

| Mes | Faturamento | MRR     | Setup     | Pontual |
|-----|-------------|---------|-----------|---------|
| Jan | 1.125.000   | 281.250 | 675.000   | 168.750 |
| Fev | 1.181.500   | 295.375 | 708.900   | 177.225 |
| Mar | 1.334.610   | 333.653 | 800.766   | 200.192 |
| Abr | 1.442.508   | 360.627 | 865.505   | 216.376 |
| Mai | 1.568.205   | 392.051 | 940.923   | 235.231 |
| Jun | 1.687.913   | 421.978 | 1.012.748 | 253.187 |

## Execucao

Uma operacao UPDATE na tabela `monetary_metas` para os 6 registros (bu='modelo_atual', Jan-Jun, year=2026). Janeiro permanece inalterado (ja esta com 1.125.000).

## Resultado esperado

O Plan Growth exibira os valores de "A Vender" solicitados: 400k, 400k, 500k, 532.975, 580k e 614k.

