

## Plano: Corrigir Labels Truncados no Gráfico de Faixa de Faturamento

### Problema Identificado

No componente `DrillDownBarChart.tsx`, os labels estão limitados a 96px de largura (`w-24`) e são truncados:

```
"Entre R$ 1 ..."  → deveria ser "Entre R$ 1 milhão e R$ 5 milhões"
"Entre R$ 50..." → deveria ser "Entre R$ 50 mil e R$ 200 mil"
```

### Solução

Aumentar a largura mínima dos labels para acomodar textos maiores, especialmente as faixas de faturamento.

---

### Arquivo a Modificar

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/components/planning/indicators/DrillDownBarChart.tsx` | 33 | Aumentar largura do label de `w-24` para `w-44` |

---

### Seção Técnica

**DrillDownBarChart.tsx (linha 33):**
```typescript
// ANTES
<span className="text-sm text-muted-foreground w-24 truncate" title={item.label}>

// DEPOIS
<span className="text-sm text-muted-foreground w-44 truncate" title={item.label}>
```

A mudança de `w-24` (96px) para `w-44` (176px) permite exibir labels como:
- "Entre R$ 1 milhão e R$ 5 milhões"
- "Entre R$ 50 mil e R$ 200 mil"
- "Acima de R$ 5 milhões"

O `truncate` continua como fallback para casos extremos, e o `title={item.label}` mostra o texto completo no hover.

---

### Alternativa Considerada

Usar `min-w-fit` para largura automática, mas isso poderia quebrar o layout em casos com labels muito longos. A largura fixa maior (`w-44`) é mais segura e previsível.

