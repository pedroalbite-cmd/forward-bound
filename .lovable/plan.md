
## Plano: Corrigir Lookup de Metas de Faturamento no Gráfico

### Problema Identificado

O sistema não está puxando as metas de faturamento porque há uma **inconsistência de case** (maiúsculas/minúsculas) entre as chaves:

| Local | Formato | Exemplo |
|-------|---------|---------|
| `usePlanGrowthData.ts` (armazenamento) | Primeira letra maiúscula | `"Jan"`, `"Fev"`, `"Mar"` |
| `RevenueChartComparison.tsx` (leitura) | Minúsculo (date-fns + ptBR) | `"jan"`, `"fev"`, `"mar"` |

Quando o código faz `metas["jan"]` mas a chave real é `"Jan"`, retorna `undefined`, e com `|| 0` a meta fica zerada.

---

### Solução

Capitalizar a primeira letra do mês formatado antes de usar como chave de lookup:

```typescript
// Antes (falha):
const monthName = format(monthDate, 'MMM', { locale: ptBR }); // "jan"
const monthMeta = metas[monthName] || 0; // metas["jan"] = undefined

// Depois (correto):
const monthNameRaw = format(monthDate, 'MMM', { locale: ptBR }); // "jan"
const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1); // "Jan"
const monthMeta = metas[monthName] || 0; // metas["Jan"] = valor correto
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/RevenueChartComparison.tsx` | Capitalizar `monthName` em `calcularMetaDoPeriodo()` (linha 82) e em `calcBUMeta()` (linha 268) |
| `src/components/planning/RevenueBreakdownChart.tsx` | Capitalizar `monthName` em `calcularMetaDoPeriodo()` (linha 151) |

---

### Código da Correção

#### `RevenueChartComparison.tsx` - Função `calcularMetaDoPeriodo`
```typescript
// Linha 82 - Capitalizar primeira letra
const monthNameRaw = format(monthDate, 'MMM', { locale: ptBR });
const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);
const monthMeta = metas[monthName] || 0;
```

#### `RevenueChartComparison.tsx` - Função `calcBUMeta`
```typescript
// Linha 268 - Capitalizar primeira letra
const monthNameRaw = format(monthDate, 'MMM', { locale: ptBR });
const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);
const monthMeta = metas[monthName] || 0;
```

#### `RevenueBreakdownChart.tsx` - Função `calcularMetaDoPeriodo`
```typescript
// Linha 151 - Capitalizar primeira letra
const monthNameRaw = format(monthDate, 'MMM', { locale: ptBR });
const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);
const monthMeta = metas[monthName] || 0;
```

---

### Resultado Esperado

Após a correção:

1. As metas de faturamento serão exibidas corretamente para todas as BUs
2. Os gráficos mostrarão a linha/barra de meta com valores corretos
3. Os KPI cards do Dashboard Compacto (Opção 5) exibirão os percentuais de atingimento de meta corretamente
4. As metas pro-rata funcionarão corretamente para períodos parciais do mês
