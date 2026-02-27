

## Alinhar MQL do Funil do Periodo com o Acelerometro

### Problema

No modo Consolidado, o `PeriodFunnelChart` usa `getMqlsQtyForPeriod()` (dados de Google Sheets) para contar MQLs do Modelo Atual, enquanto o acelerometro usa contagem real de cards do Pipefy (`modeloAtualAnalytics.getCardsForIndicator('mql')`). Isso causa divergencia de 2 unidades (579 vs 577).

O `ClickableFunnelChart` ja esta correto -- usa `getFilteredModeloAtualQty('mql')` que conta cards do Pipefy.

### Alteracao

**Arquivo: `src/components/planning/PeriodFunnelChart.tsx` (linha 51)**

Substituir `getMqlsQtyForPeriod(startDate, endDate)` por `getModeloAtualQty('mql', startDate, endDate)` no branch consolidado:

```
// Antes:
mql: getMqlsQtyForPeriod(startDate, endDate) + getO2TaxQty('mql', ...) + ...

// Depois:
mql: getModeloAtualQty('mql', startDate, endDate) + getO2TaxQty('mql', ...) + ...
```

Isso alinha a fonte de dados com o acelerometro: ambos usam cards reais do Pipefy filtrados por data de criacao e faixa de faturamento qualificada.

O import de `useSheetMetas` pode ser removido se nao for mais utilizado em nenhum outro lugar do componente.

| Arquivo | Linha | Acao |
|---------|-------|------|
| `PeriodFunnelChart.tsx` | 51 | Trocar `getMqlsQtyForPeriod` por `getModeloAtualQty('mql')` |
| `PeriodFunnelChart.tsx` | 2,29 | Remover import/uso de `useSheetMetas` se nao mais necessario |

