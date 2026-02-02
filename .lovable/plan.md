

## Integrar Receita do Mkt Indicadores com Dados do Modelo Atual

### Resumo

A seção de "Receita" na aba **Mkt Indicadores** atualmente usa dados da planilha Google Sheets. O usuário quer que os valores de MRR, Setup, Pontual e Educação venham dos dados reais de vendas do **Modelo Atual** (tabela `pipefy_moviment_cfos`), respeitando os filtros de período e BU selecionados.

---

### Arquitetura Atual

```text
MarketingIndicatorsTab
    │
    ├── useMarketingIndicators (dados da planilha)
    │       └── data.revenue: { mrr, setup, pontual, educacao, gmv }
    │
    └── RevenueMetricsCards
            └── Exibe cards com valores da planilha
```

### Arquitetura Proposta

```text
MarketingIndicatorsTab
    │
    ├── useMarketingIndicators (dados de mídia da planilha)
    │
    ├── useModeloAtualMetas (dados de vendas do Pipefy) ← NOVO
    │       └── getMrrForPeriod, getSetupForPeriod, getPontualForPeriod, getEducacaoForPeriod
    │
    └── RevenueMetricsCards
            └── Exibe cards com valores do Modelo Atual
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useModeloAtualMetas.ts` | Adicionar `getEducacaoForPeriod` |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Integrar `useModeloAtualMetas` e passar dados reais |

---

### Detalhes Técnicos

**1. useModeloAtualMetas.ts - Adicionar função getEducacaoForPeriod**

```typescript
// Get Educação value for a specific period (sum of valorEducacao from 'Contrato assinado' phase cards)
const getEducacaoForPeriod = (start?: Date, end?: Date): number => {
  if (movements.length === 0) return 0;

  const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
  const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();

  const cardValues = new Map<string, number>();
  for (const movement of movements) {
    const moveTime = movement.dataEntrada.getTime();
    if (moveTime >= startTime && moveTime <= endTime) {
      const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
      if (moveIndicator === 'venda') {
        const existing = cardValues.get(movement.id);
        if (!existing || movement.valorEducacao > existing) {
          cardValues.set(movement.id, movement.valorEducacao);
        }
      }
    }
  }

  let total = 0;
  cardValues.forEach((value) => {
    total += value;
  });
  return total;
};
```

E adicionar ao retorno do hook:
```typescript
return {
  // ... existing exports
  getEducacaoForPeriod,
};
```

---

**2. MarketingIndicatorsTab.tsx - Integrar dados do Modelo Atual**

Adicionar import e uso do hook:

```typescript
import { useModeloAtualMetas } from "@/hooks/useModeloAtualMetas";

// Dentro do componente:
const { 
  getMrrForPeriod, 
  getSetupForPeriod, 
  getPontualForPeriod,
  getEducacaoForPeriod,
  isLoading: isLoadingModeloAtual 
} = useModeloAtualMetas(dateRange.from, dateRange.to);

// Calcular receita real com base no período selecionado
const realRevenue = useMemo(() => {
  // Só calcula quando "Modelo Atual" está selecionado
  if (!selectedBUs.includes('Modelo Atual')) {
    return data.revenue; // Fallback para dados da planilha
  }
  
  return {
    mrr: getMrrForPeriod(dateRange.from, dateRange.to),
    setup: getSetupForPeriod(dateRange.from, dateRange.to),
    pontual: getPontualForPeriod(dateRange.from, dateRange.to),
    educacao: getEducacaoForPeriod(dateRange.from, dateRange.to),
    gmv: data.revenue.gmv, // GMV continua vindo da planilha (não é do Pipefy)
  };
}, [dateRange, selectedBUs, getMrrForPeriod, getSetupForPeriod, getPontualForPeriod, getEducacaoForPeriod, data.revenue]);
```

Atualizar o componente RevenueMetricsCards para usar `realRevenue`:

```tsx
<RevenueMetricsCards
  revenue={realRevenue}
  goals={goals.revenue}
/>
```

---

### Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────────┐
│                    MarketingIndicatorsTab                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtros: [Período] [BU: Modelo Atual]                          │
│                                                                  │
│           ┌───────────────────────────────────────┐              │
│           │     useModeloAtualMetas               │              │
│           │  (pipefy_moviment_cfos)               │              │
│           │                                       │              │
│           │  getMrrForPeriod(from, to) → 85.000   │              │
│           │  getSetupForPeriod(from, to) → 12.000 │              │
│           │  getPontualForPeriod(from, to) → 8.500│              │
│           │  getEducacaoForPeriod(from, to) → 3.200│             │
│           └───────────────────────────────────────┘              │
│                           │                                      │
│                           ▼                                      │
│           ┌───────────────────────────────────────┐              │
│           │       RevenueMetricsCards             │              │
│           │                                       │              │
│           │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │              │
│           │  │ MRR │ │Setup│ │Pont.│ │Educ.│ ... │              │
│           │  │ 85k │ │ 12k │ │8.5k │ │3.2k │     │              │
│           │  └─────┘ └─────┘ └─────┘ └─────┘     │              │
│           └───────────────────────────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Comportamento por Filtro de BU

| BU Selecionada | Fonte de Dados |
|----------------|----------------|
| Modelo Atual | `pipefy_moviment_cfos` (dados reais) |
| O2 TAX | Planilha (dados de mídia) |
| Oxy Hacker | Planilha (dados de mídia) |
| Franquia | Planilha (dados de mídia) |
| Múltiplas BUs | Soma ponderada (Modelo Atual real + outras da planilha) |

---

### Nota sobre GMV

O **GMV** (Gross Merchandise Value) não está disponível na tabela `pipefy_moviment_cfos` — é um indicador de e-commerce que continua sendo lido da planilha de marketing.

---

### Resultado Esperado

Após a implementação:
1. Os cards de receita (MRR, Setup, Pontual, Educação) exibirão valores reais do Pipefy quando "Modelo Atual" estiver selecionado
2. Os valores respeitarão o filtro de período (data inicial e final)
3. O loading state combinará os dois hooks
4. GMV continua vindo da planilha de marketing

