

## Plano: Integrar Porcentagens de Closer nas Metas da Aba Indicadores

### Objetivo

Quando um closer específico (Pedro ou Daniel) for selecionado no filtro da aba Indicadores, as metas (não apenas o realizado) também devem ser filtradas proporcionalmente com base nas porcentagens configuradas no Admin.

---

### Como Funciona Atualmente

1. **Realizado:** Já está filtrado por closer - quando seleciona Pedro, só mostra cards onde `Closer responsável = 'Pedro Albite'`
2. **Meta:** NÃO está filtrada - mostra a meta total independente do closer selecionado

### Como Deve Funcionar Após Implementação

| Cenário | Meta Exibida |
|---------|--------------|
| Nenhum closer selecionado | Meta total (100%) |
| Pedro Albite selecionado | Meta × (% do Pedro naquele mês/BU) |
| Daniel Trindade selecionado | Meta × (% do Daniel naquele mês/BU) |
| Ambos selecionados | Meta total (soma das %) |

**Exemplo:**
- Meta de Janeiro para Modelo Atual = 100 MQLs
- Pedro tem 60% configurado para Janeiro
- Usuário filtra por Pedro → Meta exibida = 60 MQLs

---

### Arquitetura da Solução

```text
┌────────────────────────────────────────────────────────────────────┐
│                    Fluxo de Cálculo de Meta                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   1. Buscar meta base do funnelData (Plan Growth)                  │
│      └─► calcularMetaDoPeriodo(funnelData.modeloAtual, 'mql', ...)│
│          Resultado: 100 MQLs                                       │
│                                                                    │
│   2. Aplicar filtro de closer (se ativo)                           │
│      └─► getFilteredMeta(100, 'modelo_atual', 'Jan', ['Pedro'])   │
│          ├── Busca % do Pedro para modelo_atual/Jan: 60%          │
│          └── Resultado: 100 × 0.60 = 60 MQLs                      │
│                                                                    │
│   3. Exibir no RadialProgressCard                                  │
│      └─► Meta: 60 (não mais 100)                                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Mudanças por Arquivo

#### 1. `src/components/planning/IndicatorsTab.tsx`

**Modificações:**

| Seção | Mudança |
|-------|---------|
| Imports | Adicionar import do `useCloserMetas` |
| Hooks | Chamar `useCloserMetas()` para ter acesso às porcentagens |
| `getMetaForIndicator()` | Aplicar `getFilteredMeta()` após calcular a meta base |
| `buildChartData()` | Aplicar filtro de closer nas metas mensais dos gráficos |
| `calcularMetaDoPeriodo()` | Modificar para aplicar porcentagem por mês antes de somar |

**Código - Import e Hook:**
```typescript
import { useCloserMetas } from "@/hooks/useCloserMetas";

// Inside IndicatorsTab component:
const { getFilteredMeta, getPercentage, metas: closerMetas } = useCloserMetas(currentYear);
```

**Código - getMetaForIndicator (linhas 313-332):**
```typescript
const getMetaForIndicator = (indicator: IndicatorConfig) => {
  if (!funnelData) return Math.round(indicator.annualMeta * periodFraction);
  
  let total = 0;
  
  // For each BU, calculate meta and apply closer filter if active
  if (includesModeloAtual && funnelData.modeloAtual) {
    const buMeta = calcularMetaDoPeriodoComCloser(
      funnelData.modeloAtual, 
      indicator.key, 
      startDate, 
      endDate,
      'modelo_atual',
      selectedClosers
    );
    total += buMeta;
  }
  // ... similar for o2_tax, oxy_hacker, franquia
  
  return total > 0 ? total : Math.round(indicator.annualMeta * periodFraction);
};
```

**Código - Nova função calcularMetaDoPeriodoComCloser:**
```typescript
const calcularMetaDoPeriodoComCloser = (
  funnelItems: FunnelDataItem[] | undefined,
  indicatorKey: IndicatorType,
  start: Date,
  end: Date,
  bu: string,
  selectedClosers: string[]
): number => {
  if (!funnelItems || funnelItems.length === 0) return 0;
  
  // Se não há filtro de closer, usa cálculo normal
  if (selectedClosers.length === 0) {
    return calcularMetaDoPeriodo(funnelItems, indicatorKey, start, end);
  }
  
  const getItemValue = (item: FunnelDataItem): number => {
    switch (indicatorKey) {
      case 'mql': return item.mqls;
      case 'rm': return item.rms;
      case 'rr': return item.rrs;
      case 'proposta': return item.propostas;
      case 'venda': return item.vendas;
      default: return 0;
    }
  };

  const monthsInPeriod = eachMonthOfInterval({ start, end });
  let total = 0;

  for (const monthDate of monthsInPeriod) {
    const monthName = monthNames[getMonth(monthDate)];
    const item = funnelItems.find(f => f.month === monthName);
    if (!item) continue;

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const overlapStart = start > monthStart ? start : monthStart;
    const overlapEnd = end < monthEnd ? end : monthEnd;

    if (overlapStart > overlapEnd) continue;

    const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const fraction = daysInMonth > 0 ? overlapDays / daysInMonth : 0;

    // Get base meta for this month
    const baseMeta = getItemValue(item) * fraction;
    
    // Apply closer filter percentage for this specific month
    const filteredMeta = getFilteredMeta(baseMeta, bu, monthName, selectedClosers);
    
    total += filteredMeta;
  }

  return Math.round(total);
};
```

---

#### 2. Atualizar buildChartData para aplicar filtro nas metas do gráfico

**Modificar getMonthlyMetasFromFunnel para retornar metas filtradas por closer:**

```typescript
const getMonthlyMetasFromFunnelFiltered = (
  funnelItems: FunnelDataItem[] | undefined,
  indicatorKey: IndicatorType,
  start: Date,
  end: Date,
  bu: string,
  selectedClosers: string[]
): number[] => {
  if (!funnelItems || funnelItems.length === 0) return [];
  
  const monthsInPeriod = eachMonthOfInterval({ start, end });
  
  return monthsInPeriod.map(monthDate => {
    const monthName = monthNames[getMonth(monthDate)];
    const item = funnelItems.find(f => f.month === monthName);
    if (!item) return 0;
    
    let value = 0;
    switch (indicatorKey) {
      case 'mql': value = item.mqls; break;
      case 'rm': value = item.rms; break;
      case 'rr': value = item.rrs; break;
      case 'proposta': value = item.propostas; break;
      case 'venda': value = item.vendas; break;
    }
    
    // Apply closer filter if active
    if (selectedClosers.length > 0) {
      return Math.round(getFilteredMeta(value, bu, monthName, selectedClosers));
    }
    
    return Math.round(value);
  });
};
```

---

### Componentes Afetados

| Componente | Tipo de Mudança | Detalhes |
|------------|-----------------|----------|
| `IndicatorsTab.tsx` | Principal | Integrar hook useCloserMetas e aplicar filtro nas metas |
| `RadialProgressCard` | Nenhuma | Já recebe meta como prop, não precisa mudar |
| `ClickableFunnelChart` | Possível futura | Atualmente não mostra metas, só valores realizados |
| `IndicatorChartSection` | Nenhuma | Já recebe meta como prop, não precisa mudar |

---

### Fluxo de Dados Atualizado

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         IndicatorsTab                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────────────┐  │
│  │ funnelData  │───►│ calcularMeta     │───►│ getFilteredMeta   │  │
│  │ (Plan Growth)│   │ DoPeriodoComCloser│   │ (useCloserMetas)  │  │
│  └─────────────┘    └──────────────────┘    └─────────┬─────────┘  │
│                                                       │            │
│                                                       ▼            │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    Meta Final Ajustada                      │   │
│  │                                                             │   │
│  │  Sem filtro: Meta = 100 (100%)                             │   │
│  │  Pedro (60%): Meta = 60                                    │   │
│  │  Daniel (40%): Meta = 40                                   │   │
│  │  Ambos (100%): Meta = 100                                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│              ┌───────────────┼───────────────┐                     │
│              ▼               ▼               ▼                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│  │ RadialCards   │  │ ChartSection  │  │ Funnel (opt.) │          │
│  │ Meta: 60      │  │ Linha Meta    │  │               │          │
│  └───────────────┘  └───────────────┘  └───────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Resumo de Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Importar hook, criar função de cálculo com closer, atualizar getMetaForIndicator e buildChartData |

---

### Comportamento Esperado

| Cenário | Resultado |
|---------|-----------|
| Usuário abre aba Indicadores | Metas mostram valores totais (sem filtro) |
| Usuário seleciona "Pedro" no filtro | Metas ajustam para % do Pedro em cada mês/BU |
| Usuário seleciona "Daniel" | Metas ajustam para % do Daniel em cada mês/BU |
| Usuário seleciona ambos | Metas voltam para 100% |
| Admin altera % no painel Admin | Próxima vez que abrir Indicadores, metas refletem mudança |

---

### Consideração sobre BUs

O filtro de closer se aplica **apenas ao Modelo Atual** atualmente, pois:
- O2 TAX, Oxy Hacker e Franquia não têm campo de closer nos dados
- As porcentagens no Admin são configuradas por BU, então tecnicamente já estão preparadas

**Para esta implementação inicial:**
- Aplicar o filtro de closer nas metas do **Modelo Atual** apenas
- As outras BUs usarão a meta total (não afetadas pelo filtro de closer)
- Futuramente, se outras BUs tiverem closers, a estrutura já suporta

