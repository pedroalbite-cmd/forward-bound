

## Badge "excluídos" deve respeitar BU selecionada

### Problema
O badge "80 excluídos" no acelerômetro de MQL usa sempre `modeloAtualAnalytics.getExcludedMqlCount`, independente de qual BU está selecionada. Resultado: aparece "80 excluídos" mesmo quando o usuário seleciona O2 TAX ou Oxy Hacker (que não têm lógica de exclusão de MQL).

### Solução

**`src/components/planning/IndicatorsTab.tsx`** — tornar o badge dinâmico:
- Mostrar o badge de excluídos **apenas quando Modelo Atual está nas BUs selecionadas** (`includesModeloAtual`)
- Se apenas O2 TAX, Oxy Hacker ou Franquia estiverem selecionadas, o badge não aparece (essas BUs não têm conceito de MQL excluído)

### Alteração

Linha ~2462, trocar:
```typescript
badge={indicator.key === 'mql' && modeloAtualAnalytics.getExcludedMqlCount > 0
  ? `${modeloAtualAnalytics.getExcludedMqlCount} excluídos`
  : undefined}
```

Por:
```typescript
badge={indicator.key === 'mql' && includesModeloAtual && modeloAtualAnalytics.getExcludedMqlCount > 0
  ? `${modeloAtualAnalytics.getExcludedMqlCount} excluídos`
  : undefined}
```

### Resultado
- BU Modelo Atual selecionada → badge mostra "X excluídos" (valor real calculado)
- Consolidado (todas BUs) → badge mostra "X excluídos" (pois inclui Modelo Atual)
- Apenas O2 TAX / Oxy Hacker / Franquia → sem badge (não se aplica)

### Arquivo alterado
1. `src/components/planning/IndicatorsTab.tsx` — 1 linha alterada

