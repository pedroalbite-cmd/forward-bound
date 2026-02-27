

## Corrigir discrepancia entre Contratos Assinados (Funil) e Acelerometro (Faturamento)

### Problema identificado

Ha duas fontes de inconsistencia entre o valor de "Contratos Assinados" no funil consolidado (R$ 399k) e o acelerometro de "Faturamento" (R$ 539k):

### Causa 1: Calculo diferente para Oxy Hacker e Franquia

No **funil** (`ClickableFunnelChart.tsx`, linhas 179-183), os valores monetarios de venda para Oxy Hacker e Franquia usam os **valores reais do banco** (`getOxyHackerValue('venda')` e `getExpansaoValue('venda')`).

No **acelerometro** (`IndicatorsTab.tsx`, linhas 1787-1790), esses mesmos BUs usam **quantidade x ticket fixo** (`getOxyHackerQty * 54000` e `getExpansaoQty * 140000`).

Se um contrato tiver valor diferente do ticket padrao, os numeros divergem. A diferenca de ~R$ 140k sugere exatamente 1 franquia contabilizada de forma diferente.

### Causa 2: Inclusao de "Valor Educacao" no calculo

Tanto `useModeloAtualMetas.ts` (linha 245) quanto `useModeloAtualAnalytics.ts` (linha 140) calculam:

```
valor = valorMRR + valorPontual + valorEducacao + valorSetup
```

A regra de negocio diz que `valorEducacao` deve ser **excluido** do faturamento. Isso infla os valores em ambos os lugares.

### Correcoes

#### 1. `src/hooks/useModeloAtualMetas.ts`
- Linha 245: Alterar calculo de `valor` para excluir `valorEducacao`:
  `valor: valorMRR + valorPontual + valorSetup` (remover `+ valorEducacao`)
- Linha 312: Mesma correcao no bloco de merge de assinatura

#### 2. `src/hooks/useModeloAtualAnalytics.ts`
- Linha 140: Alterar calculo de `valor` para excluir `valorEducacao`:
  `const valor = valorMRR + valorPontual + valorSetup;`

#### 3. `src/components/planning/IndicatorsTab.tsx`
- Linhas 1787-1790: Substituir `qty * ticket fixo` por valores reais do banco para consistencia com o funil:
  - `getOxyHackerQty('venda') * 54000` -> `getOxyHackerValue('venda')`
  - `getExpansaoQty('venda') * 140000` -> `getExpansaoValue('venda')`
- Isso requer importar `getValueForPeriod` dos hooks `useOxyHackerMetas` e `useExpansaoMetas` (verificar se ja estao importados)

### Resultado esperado

Apos as correcoes, tanto o funil "Contratos Assinados" quanto o acelerometro "Faturamento" usarao:
- Mesma formula: `MRR + Pontual + Setup` (sem Educacao)
- Mesma fonte de dados: valores reais do banco para todos os BUs
- Valores identicos para o mesmo periodo e filtros

| Arquivo | Acao |
|---------|------|
| `src/hooks/useModeloAtualMetas.ts` | Remover valorEducacao do calculo de valor |
| `src/hooks/useModeloAtualAnalytics.ts` | Remover valorEducacao do calculo de valor |
| `src/components/planning/IndicatorsTab.tsx` | Usar valores reais do banco para Oxy Hacker e Franquia no acelerometro |

