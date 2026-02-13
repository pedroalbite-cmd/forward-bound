

# Reverter monetary_metas do Modelo Atual (Jan-Jun)

## Problema
O campo `faturamento` armazena o faturamento TOTAL mensal (MRR Base + Incremento). Ao inserir os valores de "A Vender" (400k, 500k...) diretamente nesse campo, o calculo do Plan Growth resultou em MRR Base = 0, pois:
- `MRR Base = faturamento - valorVenderInicial (400k)`
- Com faturamento = 400k: MRR Base = 0

## Solucao
Reverter os 6 registros de Jan a Jun 2026 para os valores originais, calculados pela distribuicao trimestral (identica ao padrao de Jul-Dez que nao foi alterado).

### Valores a restaurar

| Mes | Faturamento | MRR (25%) | Setup (60%) | Pontual (15%) |
|-----|-------------|-----------|-------------|---------------|
| Jan | 1.125.000   | 281.250   | 675.000     | 168.750       |
| Fev | 1.237.500   | 309.375   | 742.500     | 185.625       |
| Mar | 1.387.500   | 346.875   | 832.500     | 208.125       |
| Abr | 1.350.000   | 337.500   | 810.000     | 202.500       |
| Mai | 1.485.000   | 371.250   | 891.000     | 222.750       |
| Jun | 1.665.000   | 416.250   | 999.000     | 249.750       |

Formula: Q1 (3.750.000) distribuido 30/33/37%, Q2 (4.500.000) distribuido 30/33/37%.

### Execucao
Uma unica operacao UPDATE na tabela `monetary_metas` para os 6 registros (bu='modelo_atual', months Jan-Jun, year=2026).

### Resultado esperado
- MRR Base volta a ser calculado corretamente: `faturamento(Jan) - 400.000 = 725.000`
- Os valores de "A Vender" (Incremento) voltam a ser derivados automaticamente pelo Plan Growth

### Nota importante
Para futuramente ajustar o "A Vender" de cada mes, a alteracao deve ser feita via Admin Panel (Metas Monetarias), que recalcula o faturamento total automaticamente, ou o campo `faturamento` deve receber o valor TOTAL (MRR Base + Incremento), nao apenas o incremento.

