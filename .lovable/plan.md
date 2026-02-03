

## Corrigir Mapeamento de Tiers de Faturamento

### Problema

O tier "R$ 5M - 10M" (mapeado de "Entre R$ 5 milhões e R$ 10 milhões") foi incluído no código mas **não existe** no banco de dados. Por isso está aparecendo com 0 leads.

### Solução

Remover o tier inexistente e ajustar o mapeamento para refletir apenas os 7 tiers que realmente existem no banco.

### Tiers Reais do Banco (7 categorias)

| # | Valor no Banco | Label para Exibição |
|---|----------------|---------------------|
| 1 | Ainda não faturamos | Ainda não fatura |
| 2 | Menos de R$ 100 mil | < R$ 100k |
| 3 | Entre R$ 200 mil e R$ 350 mil | R$ 200k - 350k |
| 4 | Entre R$ 350 mil e R$ 500 mil | R$ 350k - 500k |
| 5 | Entre R$ 500 mil e R$ 1 milhão | R$ 500k - 1M |
| 6 | Entre R$ 1 milhão e R$ 5 milhões | R$ 1M - 5M |
| 7 | Acima de R$ 5 milhões | > R$ 5M |

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/indicators/FunnelConversionByTierWidget.tsx` | Remover tier inexistente |

---

### Alterações

**1. Remover do `TIER_NORMALIZATION`:**
```typescript
// REMOVER ESTA LINHA:
'Entre R$ 5 milhões e R$ 10 milhões': 'R$ 5M - 10M',
```

**2. Atualizar `TIER_ORDER` (7 tiers):**
```typescript
const TIER_ORDER = [
  'Ainda não fatura',
  '< R$ 100k',
  'R$ 200k - 350k',
  'R$ 350k - 500k',
  'R$ 500k - 1M',
  'R$ 1M - 5M',
  '> R$ 5M',
];
```

**3. Atualizar `TIER_COLORS` (7 cores):**
```typescript
const TIER_COLORS: Record<string, string> = {
  'Ainda não fatura': 'hsl(var(--chart-5))',
  '< R$ 100k': 'hsl(var(--chart-4))',
  'R$ 200k - 350k': 'hsl(var(--chart-3))',
  'R$ 350k - 500k': 'hsl(210, 70%, 50%)',
  'R$ 500k - 1M': 'hsl(var(--chart-2))',
  'R$ 1M - 5M': 'hsl(270, 70%, 50%)',
  '> R$ 5M': 'hsl(var(--chart-1))',
};
```

---

### Nota

Se houver outros valores no banco que não estão mapeados (ex: "Entre R$ 100 mil e R$ 200 mil"), precisarei adicioná-los. Por favor, confirme os valores exatos que existem no Pipefy.

