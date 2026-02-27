

## Alinhar valores monetarios do funil com o acelerometro

### Problema

O acelerometro (gauge) calcula Oxy Hacker e Franquia como `quantidade * ticket fixo` (54k e 140k), mas o funil usa `getValueForPeriod` que le campos do Pipefy que podem estar vazios. Resultado: valores divergem (ex: 539k no gauge vs 399k no funil).

### Alteracoes

#### 1. `src/components/planning/ClickableFunnelChart.tsx` (linhas 173-183)

Substituir `getOxyHackerValue` e `getExpansaoValue` por calculo baseado em quantidade:

- `getOxyHackerValue('proposta')` -> `getOxyHackerQty('proposta') * 54000`
- `getExpansaoValue('proposta')` -> `getExpansaoQty('proposta') * 140000`
- `getOxyHackerValue('venda')` -> `getOxyHackerQty('venda') * 54000`
- `getExpansaoValue('venda')` -> `getExpansaoQty('venda') * 140000`

#### 2. `src/components/planning/PeriodFunnelChart.tsx` (linhas 99-117)

Mesma substituicao para `propostaValue` e `vendaValue` em todos os branches (consolidado, expansao, oxy_hacker).

### Logica alinhada

Segue exatamente o padrao do acelerometro em `IndicatorsTab.tsx` (linhas 1785-1791):
- Modelo Atual e O2 TAX: usam valores reais do Pipefy (`getValue`)
- Oxy Hacker: `qty * R$ 54.000`
- Franquia: `qty * R$ 140.000`

| Arquivo | Linhas | Acao |
|---------|--------|------|
| `ClickableFunnelChart.tsx` | 173-183 | Trocar getValue por qty*ticket para Oxy Hacker e Franquia |
| `PeriodFunnelChart.tsx` | 99-117 | Mesma correcao |

