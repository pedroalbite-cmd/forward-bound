

# Atualizar "A Vender" do Modelo Atual (Jan-Jun 2026)

## Situacao atual no banco
Os valores foram revertidos e estao nos originais. Precisamos atualizar Fev-Jun para que o Plan Growth exiba os valores de "A Vender" desejados.

## O que sera feito
Atualizar 5 registros na tabela `monetary_metas` (bu = 'modelo_atual', year = 2026). Janeiro ja esta correto com faturamento = 1.125.000.

### Valores a gravar

| Mes | Faturamento | MRR (25%) | Setup (60%) | Pontual (15%) | A Vender resultante |
|-----|-------------|-----------|-------------|---------------|-------------------|
| Jan | 1.125.000 (manter) | 281.250 | 675.000 | 168.750 | 400.000 |
| Fev | 1.181.500 | 295.375 | 708.900 | 177.225 | 400.000 |
| Mar | 1.334.610 | 333.653 | 800.766 | 200.192 | 500.000 |
| Abr | 1.442.508 | 360.627 | 865.505 | 216.376 | 532.975 |
| Mai | 1.568.205 | 392.051 | 940.923 | 235.231 | 580.000 |
| Jun | 1.687.913 | 421.978 | 1.012.748 | 253.187 | 614.000 |

## Execucao
5 comandos UPDATE na tabela `monetary_metas` para Fev, Mar, Abr, Mai e Jun (bu='modelo_atual', year=2026).

## Resultado esperado
O Plan Growth exibira os valores de "A Vender": 400k, 400k, 500k, 532.975, 580k e 614k para o Modelo Atual.

