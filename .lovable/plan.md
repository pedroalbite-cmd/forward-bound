

## Corrigir Valores Zerados de MRR/Setup/Pontual para O2 TAX

### Problema Identificado

Na aba **Mkt Indicadores**, quando o usuário seleciona "O2 TAX" como BU, os cards de receita (MRR, Setup, Pontual, Educação) mostram valores **zerados**, mesmo existindo dados no banco.

**Causas:**

| Causa | Local | Descrição |
|-------|-------|-----------|
| **1. Falta de integração O2 TAX** | `MarketingIndicatorsTab.tsx` | O componente só usa `useModeloAtualMetas` para receita. Quando O2 TAX está selecionado, cai no fallback da planilha (que está vazia) |
| **2. Hook incompleto** | `useO2TaxMetas.ts` | O hook não tem funções separadas para MRR, Setup, Pontual (só tem `getValueForPeriod` que soma tudo) |
| **3. Mesma lógica ausente na aba Indicadores** | `IndicatorsTab.tsx` | Se o usuário estiver na aba Indicadores com O2 TAX, os mesmos problemas podem ocorrer |

---

### Solução Proposta

**Etapa 1: Adicionar funções getMrrForPeriod, getSetupForPeriod, getPontualForPeriod ao useO2TaxMetas**

```typescript
// src/hooks/useO2TaxMetas.ts

// Get MRR value for O2 TAX in period
const getMrrForPeriod = (start?: Date, end?: Date): number => {
  if (!data?.movements || data.movements.length === 0) return 0;
  
  const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
  const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();
  
  const cardValues = new Map<string, number>();
  for (const movement of data.movements) {
    const entryTime = movement.dataEntrada.getTime();
    if (entryTime >= startTime && entryTime <= endTime) {
      if (movement.fase === 'Contrato assinado') {
        const existing = cardValues.get(movement.id);
        if (!existing || (movement.valorMRR || 0) > existing) {
          cardValues.set(movement.id, movement.valorMRR || 0);
        }
      }
    }
  }
  
  return Array.from(cardValues.values()).reduce((sum, val) => sum + val, 0);
};

// Similar para getSetupForPeriod e getPontualForPeriod
```

---

**Etapa 2: Integrar useO2TaxMetas no MarketingIndicatorsTab**

```typescript
// src/components/planning/MarketingIndicatorsTab.tsx

import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";

// No componente:
const { 
  getMrrForPeriod: getO2TaxMrr, 
  getSetupForPeriod: getO2TaxSetup, 
  getPontualForPeriod: getO2TaxPontual,
  isLoading: isLoadingO2Tax 
} = useO2TaxMetas(dateRange.from, dateRange.to);

// Calcular receita real combinando BUs
const realRevenue = useMemo(() => {
  let mrr = 0, setup = 0, pontual = 0, educacao = 0;
  
  if (selectedBUs.includes('Modelo Atual')) {
    mrr += getMrrForPeriod(dateRange.from, dateRange.to);
    setup += getSetupForPeriod(dateRange.from, dateRange.to);
    pontual += getPontualForPeriod(dateRange.from, dateRange.to);
    educacao += getEducacaoForPeriod(dateRange.from, dateRange.to);
  }
  
  if (selectedBUs.includes('O2 TAX')) {
    mrr += getO2TaxMrr(dateRange.from, dateRange.to);
    setup += getO2TaxSetup(dateRange.from, dateRange.to);
    pontual += getO2TaxPontual(dateRange.from, dateRange.to);
    // O2 TAX não tem Educação
  }
  
  // Se nenhuma BU com dados selecionada, fallback para planilha
  if (!selectedBUs.includes('Modelo Atual') && !selectedBUs.includes('O2 TAX')) {
    return data.revenue;
  }
  
  return { mrr, setup, pontual, educacao, gmv: data.revenue.gmv };
}, [dateRange, selectedBUs, ...]);
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useO2TaxMetas.ts` | Adicionar `getMrrForPeriod`, `getSetupForPeriod`, `getPontualForPeriod` |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Integrar `useO2TaxMetas` e combinar dados por BU |

---

### Fluxo de Dados Após Correção

```text
┌─────────────────────────────────────────────────────────────────┐
│                    MarketingIndicatorsTab                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtros: [Período: Janeiro] [BU: O2 TAX ✓]                     │
│                                                                  │
│           ┌───────────────────────────────────────┐              │
│           │     useO2TaxMetas                     │              │
│           │  (pipefy_cards_movements)             │              │
│           │                                       │              │
│           │  getMrrForPeriod() → R$ 12.000        │              │
│           │  getSetupForPeriod() → R$ 25.000      │              │
│           │  getPontualForPeriod() → R$ 16.888    │              │
│           └───────────────────────────────────────┘              │
│                           │                                      │
│                           ▼                                      │
│           ┌───────────────────────────────────────┐              │
│           │       RevenueMetricsCards             │              │
│           │  MRR: R$ 12k | Setup: R$ 25k | ...    │              │
│           └───────────────────────────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| MRR (O2 TAX, Jan) | R$ 0 | Valor real do banco |
| Setup (O2 TAX, Jan) | R$ 0 | Valor real do banco |
| Pontual (O2 TAX, Jan) | R$ 0 | Valor real do banco |
| Total | R$ 0 | ~R$ 54k (53.888,20) |

---

### Nota sobre Oxy Hacker e Franquia

Essas BUs usam a tabela `pipefy_cards_movements_expansao`, que também pode ter valores null para MRR/Setup/Pontual. Se necessário, podemos criar funções similares no hook `useExpansaoMetas` ou aplicar tickets fixos como fallback.

