

## Plano: Renomear para Incremento de Faturamento e Auto-preencher Métricas

### Mudanças Solicitadas

| Item | Antes | Depois |
|------|-------|--------|
| Nome da métrica | "Faturamento" | "Incremento de Faturamento" |
| Comportamento ao digitar | Manual para cada campo | Ao digitar incremento, preenche MRR/Setup/Pontual automaticamente |

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useMonetaryMetas.ts` | Atualizar label de 'Faturamento' para 'Incremento' |
| `src/components/planning/MonetaryMetasTab.tsx` | Modificar `updateLocalValue` para auto-calcular ao alterar faturamento |

---

### Seção Técnica

**1. useMonetaryMetas.ts - Atualizar METRIC_LABELS (linha 43):**
```typescript
// ANTES
export const METRIC_LABELS: Record<MetricType, string> = {
  faturamento: 'Faturamento',
  mrr: 'MRR',
  setup: 'Setup',
  pontual: 'Pontual',
};

// DEPOIS
export const METRIC_LABELS: Record<MetricType, string> = {
  faturamento: 'Incremento',
  mrr: 'MRR',
  setup: 'Setup',
  pontual: 'Pontual',
};
```

**2. MonetaryMetasTab.tsx - Modificar updateLocalValue (linhas 70-80):**
```typescript
// ANTES - atualiza apenas a métrica informada
const updateLocalValue = (bu: string, month: string, metric: MetricType, value: number) => {
  const key = `${bu}-${month}`;
  setLocalMetas(prev => ({
    ...prev,
    [key]: {
      ...prev[key] || { faturamento: 0, mrr: 0, setup: 0, pontual: 0 },
      [metric]: value,
    },
  }));
  setHasChanges(true);
};

// DEPOIS - se for faturamento, calcula os outros automaticamente
const updateLocalValue = (bu: string, month: string, metric: MetricType, value: number) => {
  const key = `${bu}-${month}`;
  
  if (metric === 'faturamento') {
    // Auto-preenche MRR (25%), Setup (60%), Pontual (15%)
    setLocalMetas(prev => ({
      ...prev,
      [key]: {
        faturamento: value,
        mrr: Math.round(value * 0.25),
        setup: Math.round(value * 0.6),
        pontual: Math.round(value * 0.15),
      },
    }));
  } else {
    // Para outras métricas, atualiza apenas o campo específico
    setLocalMetas(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || { faturamento: 0, mrr: 0, setup: 0, pontual: 0 },
        [metric]: value,
      },
    }));
  }
  setHasChanges(true);
};
```

**3. MonetaryMetasTab.tsx - Atualizar textos de ajuda (linhas 206-207):**
```typescript
// ANTES
Configure as metas de Faturamento, MRR, Setup e Pontual

// DEPOIS
Configure as metas de Incremento de Faturamento, MRR, Setup e Pontual
```

**4. MonetaryMetasTab.tsx - Atualizar CardDescription (linha 326):**
```typescript
// ANTES
Os valores definidos aqui serão usados como metas nos indicadores de Faturamento, MRR, Setup e Pontual.

// DEPOIS
Os valores definidos aqui serão usados como metas nos indicadores. Ao preencher o Incremento, MRR/Setup/Pontual são calculados automaticamente.
```

**5. MonetaryMetasTab.tsx - Atualizar texto de dica (linhas 331-335):**
```typescript
// ANTES
<strong>Percentuais padrão:</strong> MRR = 25%, Setup = 60%, Pontual = 15% do Faturamento
<strong>Dica:</strong> Preencha o Faturamento primeiro e clique em "Calcular % Padrão"

// DEPOIS
<strong>Percentuais padrão:</strong> MRR = 25%, Setup = 60%, Pontual = 15% do Incremento
<strong>Dica:</strong> Ao preencher o Incremento, os demais campos são calculados automaticamente. Você pode ajustar manualmente depois.
```

**6. MonetaryMetasTab.tsx - Remover botão "Calcular % Padrão" (opcional):**
Com o preenchimento automático, o botão pode ser removido ou mantido para recalcular em lote.

---

### Comportamento Final

1. Usuário digita **100.000** no campo Incremento de Janeiro
2. Sistema preenche automaticamente:
   - MRR: **25.000** (25%)
   - Setup: **60.000** (60%)
   - Pontual: **15.000** (15%)
3. Usuário pode ajustar valores individuais de MRR/Setup/Pontual se necessário
4. Alterações em MRR/Setup/Pontual **não** recalculam o Incremento

---

### Impacto

- **Admin**: Interface mostra "Incremento" em vez de "Faturamento"
- **Indicadores**: Continuam funcionando normalmente (usam o mesmo campo `faturamento` no banco)
- **UX**: Menos cliques - não precisa mais clicar em "Calcular % Padrão"

