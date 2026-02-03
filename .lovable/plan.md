

## Investigação: Discrepância de Faturamento O2 TAX (87k vs 54k)

### Problema Identificado

Ao filtrar apenas O2 TAX em Janeiro de 2026:
- **Gráfico "Faturamento por Período"**: Exibe R$ 87k
- **Acelerômetro (Card Faturamento)**: Exibe R$ 54k

### Causa Raiz (2 fatores)

| Fator | Faturamento por Período | Acelerômetro |
|-------|------------------------|--------------|
| **Fases contadas** | `'Ganho'` OU `'Contrato assinado'` | Apenas `'Contrato assinado'` |
| **Fallback s/ valor** | R$ 15.000 por card | R$ 0 (sem fallback) |

---

### Detalhamento Técnico

**1. Filtro de fases diferente:**

No `RevenueChartComparison.tsx` (linha 119):
```typescript
// Inclui DUAS fases como "venda ganha"
const isWonPhase = (fase: string) => fase === 'Ganho' || fase === 'Contrato assinado';
const o2SalesMovements = o2TaxMetas.movements.filter(m => isWonPhase(m.fase));
```

No `useO2TaxMetas.ts` (linha 155-159), usado pelo Acelerômetro:
```typescript
// Inclui APENAS uma fase
if (indicator === 'venda') {
  if (movement.fase === 'Contrato assinado') {
    shouldCount = true;
  }
}
```

**2. Fallback de valor diferente:**

No `RevenueChartComparison.tsx` (linhas 96-102):
```typescript
const getO2TaxCardValue = (movement: any): number => {
  const sum = mrr + setup + pontual;
  return sum === 0 ? DEFAULT_TICKETS.o2_tax : sum;  // Fallback R$ 15.000
};
```

No `useO2TaxMetas.ts` (linhas 173-177):
```typescript
// Soma direta, sem fallback
const pontual = movement.valorPontual || 0;
const setup = movement.valorSetup || 0;
const mrr = movement.valorMRR || 0;
cardValues.set(movement.id, pontual + setup + mrr);  // Se 0, fica 0
```

---

### Correção Proposta

**Opção A: Alinhar ambos para usar APENAS `'Contrato assinado'`** (recomendado)

Justificativa: A memória `sales-phase-universal-definition` define que "a contagem de vendas em todas as Unidades de Negócio é disparada pela entrada do card na fase 'Contrato assinado'" e "A fase 'Ganho' foi descontinuada".

**Arquivo:** `src/components/planning/RevenueChartComparison.tsx`

Alterar linha 119:
```typescript
// ANTES
const isWonPhase = (fase: string) => fase === 'Ganho' || fase === 'Contrato assinado';

// DEPOIS
const isWonPhase = (fase: string) => fase === 'Contrato assinado';
```

**Opção B: Alinhar o fallback de valor**

Também aplicar o fallback de R$ 15k no hook `useO2TaxMetas.ts` para garantir que cards sem valores monetários preenchidos tenham um valor mínimo.

**Arquivo:** `src/hooks/useO2TaxMetas.ts`

Alterar linhas 172-177:
```typescript
// ANTES
if (shouldCount && !cardValues.has(movement.id)) {
  const pontual = movement.valorPontual || 0;
  const setup = movement.valorSetup || 0;
  const mrr = movement.valorMRR || 0;
  cardValues.set(movement.id, pontual + setup + mrr);
}

// DEPOIS (com fallback)
if (shouldCount && !cardValues.has(movement.id)) {
  const pontual = movement.valorPontual || 0;
  const setup = movement.valorSetup || 0;
  const mrr = movement.valorMRR || 0;
  const sum = pontual + setup + mrr;
  cardValues.set(movement.id, sum === 0 ? 15000 : sum);  // Fallback R$ 15k
}
```

---

### Resultado Esperado

Após aplicar a Opção A + B:
- Ambos os componentes exibirão o **mesmo valor de faturamento O2 TAX**
- O valor será baseado apenas em cards que entraram na fase `'Contrato assinado'`
- Cards sem valores monetários receberão fallback de R$ 15k em ambos os lugares

