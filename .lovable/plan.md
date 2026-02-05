
# Plano: Restaurar Metas Corretas do Modelo Atual

## Resumo do Problema
Os valores de "Meta" (coluna `faturamento`) para o Modelo Atual foram incorretamente alterados no banco de dados. Alguém inseriu os valores de "A Vender" (receita incremental) em vez da "Meta Total" (MRR Base + A Vender).

## O Que Está Errado

| Mes | Valor Atual (Errado) | Valor Correto |
|-----|---------------------|---------------|
| Jan | R$ 400.000 | R$ 1.125.000 |
| Fev | R$ 556.000 | R$ 1.237.500 |
| Mar | R$ 738.890 | R$ 1.387.500 |
| Abr | R$ 773.614 | R$ 1.350.000 |
| Mai | R$ 871.337 | R$ 1.485.000 |
| Jun | R$ 1.011.457 | R$ 1.665.000 |
| Jul | R$ 1.093.855 | R$ 1.800.000 |
| Ago | R$ 1.224.579 | R$ 1.980.000 |
| Set | R$ 1.407.116 | R$ 2.220.000 |
| Out | R$ 1.523.169 | R$ 2.640.000 |
| Nov | R$ 1.701.969 | R$ 2.960.000 |
| Dez | R$ 2.041.593 | R$ 2.400.000 |

## Impacto Atual

Com os valores errados:
- **MRR Base Janeiro**: Aparece como R$ 0 (deveria ser ~R$ 700k)
- **Calculo de Vendas**: Numero de vendas necessarias esta subdimensionado
- **Metas de Funil**: MQLs, RMs, RRs, Propostas estao todos incorretos

## Solucao Proposta

Executar uma migracao SQL para restaurar os valores corretos na tabela `monetary_metas`:

```text
UPDATE monetary_metas 
SET faturamento = CASE month
  WHEN 'Jan' THEN 1125000
  WHEN 'Fev' THEN 1237500
  WHEN 'Mar' THEN 1387500
  WHEN 'Abr' THEN 1350000
  WHEN 'Mai' THEN 1485000
  WHEN 'Jun' THEN 1665000
  WHEN 'Jul' THEN 1800000
  WHEN 'Ago' THEN 1980000
  WHEN 'Set' THEN 2220000
  WHEN 'Out' THEN 2640000
  WHEN 'Nov' THEN 2960000
  WHEN 'Dez' THEN 2400000
END
WHERE bu = 'modelo_atual' AND year = 2026;
```

## Resultado Esperado Apos Correcao

| Mes | Meta | MRR Base | A Vender | Vendas |
|-----|------|----------|----------|--------|
| Jan | R$ 1.125.000 | ~R$ 700.000 | ~R$ 425.000 | ~25 |
| Fev | R$ 1.237.500 | ~R$ 764.000 | ~R$ 473.500 | ~28 |
| ... | (valores corretos calculados dinamicamente) | ... | ... | ... |

## Notas Tecnicas

A logica de calculo do MRR Base utiliza a formula:
- **Janeiro**: `MRR Base = Meta - Valor A Vender Inicial (R$ 400k)`
- **Demais meses**: `MRR Base = MRR Anterior * (1 - 6% churn) + 25% retencao vendas anteriores`

Com as metas corrigidas, o sistema recalculara automaticamente todos os indicadores do funil.
