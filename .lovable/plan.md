
## Plano: Corrigir Percentuais Padrão das Metas Monetárias

### Situação Atual vs. Desejada

| Métrica | Valor Atual | Valor Correto |
|---------|-------------|---------------|
| MRR | 60% | **25%** |
| Setup | 25% | **60%** |
| Pontual | 15% | 15% (sem mudança) |

---

### Arquivos a Modificar

| Arquivo | Linha(s) | Alteração |
|---------|----------|-----------|
| `src/hooks/useMonetaryMetas.ts` | 119-120 | Inverter MRR e Setup |
| `src/components/planning/MonetaryMetasTab.tsx` | 97-98 | Inverter MRR e Setup |
| `src/components/planning/MonetaryMetasTab.tsx` | 105 | Atualizar texto do toast |
| `src/components/planning/MonetaryMetasTab.tsx` | 141-142 | Inverter MRR e Setup |
| `src/components/planning/MonetaryMetasTab.tsx` | 331 | Atualizar texto de ajuda |
| `src/components/planning/IndicatorsTab.tsx` | 1687-1692 | Inverter percentuais MRR e Setup |

---

### Seção Técnica

**1. useMonetaryMetas.ts (linhas 119-120):**
```typescript
// ANTES
mrr: Math.round(fat * 0.6),
setup: Math.round(fat * 0.25),

// DEPOIS
mrr: Math.round(fat * 0.25),
setup: Math.round(fat * 0.6),
```

**2. MonetaryMetasTab.tsx - Função calculateFromFaturamento (linhas 97-98):**
```typescript
// ANTES
mrr: Math.round(faturamento * 0.6),
setup: Math.round(faturamento * 0.25),

// DEPOIS
mrr: Math.round(faturamento * 0.25),
setup: Math.round(faturamento * 0.6),
```

**3. MonetaryMetasTab.tsx - Toast (linha 105):**
```typescript
// ANTES
toast({ title: 'Valores calculados com base nos percentuais padrão (60/25/15)' });

// DEPOIS
toast({ title: 'Valores calculados com base nos percentuais padrão (MRR 25% / Setup 60% / Pontual 15%)' });
```

**4. MonetaryMetasTab.tsx - Import Plan Growth (linhas 141-142):**
```typescript
// ANTES
mrr: Math.round(faturamentoEstimado * 0.6),
setup: Math.round(faturamentoEstimado * 0.25),

// DEPOIS
mrr: Math.round(faturamentoEstimado * 0.25),
setup: Math.round(faturamentoEstimado * 0.6),
```

**5. MonetaryMetasTab.tsx - Texto de ajuda (linha 331):**
```typescript
// ANTES
<strong>Percentuais padrão:</strong> MRR = 60%, Setup = 25%, Pontual = 15% do Faturamento

// DEPOIS
<strong>Percentuais padrão:</strong> MRR = 25%, Setup = 60%, Pontual = 15% do Faturamento
```

**6. IndicatorsTab.tsx - Fallback de metas (linhas 1686-1692):**
```typescript
// ANTES
case 'mrr':
  // MRR = ~60% do faturamento
  return getFilteredFaturamentoMeta() * 0.6;

case 'setup':
  // Setup = ~25% do faturamento
  return getFilteredFaturamentoMeta() * 0.25;

// DEPOIS
case 'mrr':
  // MRR = ~25% do faturamento
  return getFilteredFaturamentoMeta() * 0.25;

case 'setup':
  // Setup = ~60% do faturamento
  return getFilteredFaturamentoMeta() * 0.6;
```

---

### Impacto

- **Cálculos automáticos no Admin**: Ao usar "Calcular do Faturamento", os valores serão 25% MRR, 60% Setup
- **Importação do Plan Growth**: Mesma proporção corrigida
- **Fallback nos Indicadores**: Quando não há metas customizadas, usa os percentuais corretos
- **Interface**: Textos de ajuda refletirão os valores corretos
