

## Correção: Interpretar "25" como 2026 na Planilha

### Problema

A planilha **"Indicadores 26"** contém dados de **2026**, mas as colunas estão rotuladas incorretamente como "January/25", "February/25", etc.

| Coluna na Planilha | Rótulo Errado | Interpretação Correta |
|--------------------|---------------|----------------------|
| B | January/25 | Janeiro 2026 |
| C | February/25 | Fevereiro 2026 |
| ... | ... | ... |
| M | December/25 | Dezembro 2026 |

### Solução

Alterar a função `getMonthIndicesForPeriod` na Edge Function para tratar as colunas B-M como dados de 2026.

---

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/read-marketing-sheet/index.ts` | Corrigir mapeamento de ano nas colunas |

---

### Código Corrigido

```typescript
function getMonthIndicesForPeriod(startDate: string, endDate: string): number[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const indices: number[] = [];
  
  // IMPORTANTE: A planilha "Indicadores 26" tem rótulos errados (25 = 2025)
  // mas os dados são de 2026. Colunas B-M = Jan-Dec 2026
  const startMonth = start.getMonth(); // 0-11
  const endMonth = end.getMonth(); // 0-11
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  
  for (let year = startYear; year <= endYear; year++) {
    const fromMonth = year === startYear ? startMonth : 0;
    const toMonth = year === endYear ? endMonth : 11;
    
    for (let month = fromMonth; month <= toMonth; month++) {
      // Colunas B-M (índices 1-12) = dados de 2026
      // Ignorar anos diferentes de 2026 por enquanto
      if (year === 2026) {
        indices.push(month + 1); // +1 porque coluna A é o label
      }
    }
  }
  
  return indices;
}
```

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Janeiro 2026 → índice 13 → R$ 0 | Janeiro 2026 → índice 1 → R$ 142.683,76 |
| Fevereiro 2026 → índice 14 → R$ 0 | Fevereiro 2026 → índice 2 → dados reais |

---

### Impacto

A aba "Mkt Indicadores" passará a exibir corretamente os dados da planilha quando o período selecionado for 2026.

