

## Exibir os 8 Tiers de Faturamento Separadamente

### Problema Atual

O widget agrupa os 8 valores do banco de dados em apenas 4 categorias:
- **Atual**: 4 tiers agregados (Até R$ 50k, R$ 50k - 200k, R$ 200k - 1M, Acima de 1M)
- **Desejado**: 8 tiers separados conforme existem no banco

### Os 8 Tiers do Banco (em ordem crescente)

| # | Tier Original | Label para Exibição |
|---|---------------|---------------------|
| 1 | Ainda não faturamos | Ainda não fatura |
| 2 | Menos de R$ 100 mil | < R$ 100k |
| 3 | Entre R$ 200 mil e R$ 350 mil | R$ 200k - 350k |
| 4 | Entre R$ 350 mil e R$ 500 mil | R$ 350k - 500k |
| 5 | Entre R$ 500 mil e R$ 1 milhão | R$ 500k - 1M |
| 6 | Entre R$ 1 milhão e R$ 5 milhões | R$ 1M - 5M |
| 7 | Entre R$ 5 milhões e R$ 10 milhões | R$ 5M - 10M |
| 8 | Acima de R$ 5 milhões | > R$ 5M |

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/indicators/FunnelConversionByTierWidget.tsx` | Refatorar normalização para 8 tiers distintos |

---

### Alterações Técnicas

**1. Novo mapeamento `TIER_NORMALIZATION`**

Mapear todas as variantes do banco para 8 categorias padronizadas:

```typescript
const TIER_NORMALIZATION: Record<string, string> = {
  // Tier 1: Ainda não fatura
  'Ainda não faturamos': 'Ainda não fatura',
  
  // Tier 2: Menos de R$ 100k
  'Menos de R$ 100 mil': '< R$ 100k',
  
  // Tier 3: R$ 200k - 350k
  'Entre R$ 200 mil e R$ 350 mil': 'R$ 200k - 350k',
  
  // Tier 4: R$ 350k - 500k
  'Entre R$ 350 mil e R$ 500 mil': 'R$ 350k - 500k',
  
  // Tier 5: R$ 500k - 1M
  'Entre R$ 500 mil e R$ 1 milhão': 'R$ 500k - 1M',
  
  // Tier 6: R$ 1M - 5M
  'Entre R$ 1 milhão e R$ 5 milhões': 'R$ 1M - 5M',
  
  // Tier 7: R$ 5M - 10M
  'Entre R$ 5 milhões e R$ 10 milhões': 'R$ 5M - 10M',
  
  // Tier 8: Acima de R$ 5M
  'Acima de R$ 5 milhões': '> R$ 5M',
};
```

**2. Novo `TIER_ORDER` com 8 tiers**

```typescript
const TIER_ORDER = [
  'Ainda não fatura',
  '< R$ 100k',
  'R$ 200k - 350k',
  'R$ 350k - 500k',
  'R$ 500k - 1M',
  'R$ 1M - 5M',
  'R$ 5M - 10M',
  '> R$ 5M',
];
```

**3. Novas cores para 8 tiers**

```typescript
const TIER_COLORS: Record<string, string> = {
  'Ainda não fatura': 'hsl(var(--chart-5))',
  '< R$ 100k': 'hsl(var(--chart-4))',
  'R$ 200k - 350k': 'hsl(var(--chart-3))',
  'R$ 350k - 500k': 'hsl(210, 70%, 50%)',
  'R$ 500k - 1M': 'hsl(var(--chart-2))',
  'R$ 1M - 5M': 'hsl(270, 70%, 50%)',
  'R$ 5M - 10M': 'hsl(var(--chart-1))',
  '> R$ 5M': 'hsl(330, 70%, 50%)',
};
```

**4. Simplificar função `normalizeTier`**

Remover a lógica de fallback complexa e usar apenas o mapeamento direto:

```typescript
const normalizeTier = (revenueRange?: string): string => {
  if (!revenueRange) return 'Não informado';
  
  const normalized = TIER_NORMALIZATION[revenueRange];
  if (normalized) return normalized;
  
  // Tentar match case-insensitive
  const lowerRange = revenueRange.toLowerCase().trim();
  for (const [key, value] of Object.entries(TIER_NORMALIZATION)) {
    if (key.toLowerCase() === lowerRange) return value;
  }
  
  return 'Não informado';
};
```

---

### Resultado Visual

**Tabela**: 8 linhas de dados (uma para cada tier)

**Gráfico de barras**: 8 barras por etapa de conversão, cada uma com cor distinta

**Tooltip/Legenda**: Mostrará os 8 tiers separadamente

---

### Impacto

- Maior granularidade na análise de conversão por faturamento
- Visibilidade de como empresas de diferentes portes convertem
- Identificação mais precisa de gargalos por segmento

