

## Plano: Corrigir Coluna SDR no Drill-down de MQL

### Problema Identificado

No drill-down de MQL, a coluna "SDR" está mostrando o **Closer** em vez do **SDR correto**.

**Causa raiz**: Na linha 1144 do `IndicatorsTab.tsx`, a coluna está mapeada para o campo `responsible`:
```typescript
{ key: 'responsible', label: 'SDR' },
```

Porém, no hook `useModeloAtualAnalytics.ts` (linha 246), o campo `responsible` prioriza o **Closer**:
```typescript
responsible: card.closer || card.responsavel || undefined, // Prioritize closer for display
```

Enquanto o campo correto de SDR é `sdr` (linha 253):
```typescript
sdr: card.sdr,
```

---

### Solução

Alterar a coluna da tabela no case 'mql' para usar o campo `sdr` em vez de `responsible`.

---

### Seção Técnica

**Arquivo:** `src/components/planning/IndicatorsTab.tsx`

**Linha 1144:**
```typescript
// ANTES
{ key: 'responsible', label: 'SDR' },

// DEPOIS
{ key: 'sdr', label: 'SDR' },
```

**Também atualizar a linha 1096** que calcula o Top SDR:
```typescript
// ANTES
const topSDR = findTopPerformer(items, 'responsible');

// DEPOIS
const topSDR = findTopPerformer(items, 'sdr');
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Linhas 1096 e 1144: trocar `'responsible'` por `'sdr'` |

---

### Obs: Remoção de "Dias até MQL"

Conforme solicitado anteriormente, também removerei:
1. O cálculo de `itemsWithCalcs` com `diasAteQualificar`
2. O KPI "Tempo Médio"
3. O gráfico "Tempo até Qualificar"
4. A coluna "Dias até MQL"
5. O texto "Tempo médio: Xd" da descrição

---

### Resultado Final do Drill-down de MQL

```text
┌─────────────────────────────────────────────────────────────────┐
│  MQL - De Onde Vêm Nossos Melhores Leads?                       │
│  45 MQLs captados | 28% faixa premium (>R$50k) | Top SDR: Amanda │
├─────────────────────────────────────────────────────────────────┤
│  KPIs: 📊 45 Total | 💎 28% Premium | 🏆 Amanda (15)            │
├─────────────────────────────────────────────────────────────────┤
│  [Gráfico]                                                       │
│  Por Faixa de Faturamento                                        │
│  ████ 20-50k (18)                                                │
│  ███ >50k (12)                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Tabela: Produto | Empresa | Faixa | SDR (correto!) | Data      │
└─────────────────────────────────────────────────────────────────┘
```

