

## Plano: Aplicar Filtros de BU e Closer aos Indicadores Monetários

### Problema Atual

Os 5 novos acelerômetros (ROI, Faturamento, MRR, SETUP, PONTUAL) não respeitam:
1. **Filtro de BUs** - MRR/Setup/Pontual só buscam dados do Modelo Atual
2. **Filtro de Closer** - Nenhum dos indicadores monetários filtra por Closer selecionado

---

### Solução

#### 1. Modificar `useModeloAtualMetas.ts`

Adicionar suporte a filtro de Closer nas funções `getMrrForPeriod`, `getSetupForPeriod`, `getPontualForPeriod` e `getValueForPeriod`:

```typescript
// Cada função receberá um parâmetro opcional closerFilter
const getMrrForPeriod = (start?: Date, end?: Date, closerFilter?: string[]): number => {
  // Filtrar cards por closer se closerFilter fornecido
  // Similar à lógica de getRealizedForIndicator
};
```

#### 2. Modificar `IndicatorsTab.tsx` - `getRealizedMonetaryForIndicator`

**ANTES:**
```typescript
case 'mrr':
  return getMrrForPeriod(startDate, endDate);

case 'faturamento':
  if (includesModeloAtual) {
    totalFaturamento += getModeloAtualValue('venda', startDate, endDate);
  }
  // Outras BUs...
```

**DEPOIS:**
```typescript
case 'mrr':
  // Somar MRR de todas as BUs selecionadas
  let totalMrr = 0;
  if (includesModeloAtual) {
    if (selectedClosers.length > 0) {
      // Filtrar por closer usando analytics
      const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
      const filteredCards = salesCards.filter(card => matchesCloserFilter(card.closer?.trim()));
      totalMrr += filteredCards.reduce((acc, card) => acc + (card.valorMRR || 0), 0);
    } else {
      totalMrr += getMrrForPeriod(startDate, endDate);
    }
  }
  // Para outras BUs, usar dados específicos ou ticket estimado
  return totalMrr;

case 'faturamento':
  // Aplicar filtro de closer para Modelo Atual
  if (includesModeloAtual) {
    if (selectedClosers.length > 0) {
      const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
      const filteredCards = salesCards.filter(card => matchesCloserFilter(card.closer?.trim()));
      totalFaturamento += filteredCards.reduce((acc, card) => acc + (card.valor || 0), 0);
    } else {
      totalFaturamento += getModeloAtualValue('venda', startDate, endDate);
    }
  }
  // Outras BUs mantêm lógica atual (closers só se aplicam a Modelo Atual)
```

#### 3. Mesma lógica para `setup` e `pontual`

Aplicar a mesma abordagem: verificar se há filtro de closer ativo, e se sim, filtrar cards de venda e somar o campo específico (`valorSetup`, `valorPontual`).

---

### Comportamento Esperado

| Filtro | Indicador | Resultado |
|--------|-----------|-----------|
| Só Modelo Atual + Pedro | MRR | Soma de valorMRR dos cards de venda onde closer = "Pedro Albite" |
| O2 TAX + Franquia | Faturamento | Soma de vendas O2 TAX × R$15k + vendas Franquia × R$140k |
| Consolidado + Sem filtro | MRR | Total de MRR de todas as BUs |
| Modelo Atual + Daniel | Setup | Soma de valorSetup dos cards de venda onde closer = "Daniel Trindade" |

---

### Modificações Detalhadas

#### Arquivo: `src/hooks/useModeloAtualMetas.ts`

**Adicionar campos ao retorno do hook (já existem, revisar se `valorMRR`, `valorSetup`, `valorPontual` estão expostos nos movements):**

O hook já retorna `getMrrForPeriod`, `getSetupForPeriod`, `getPontualForPeriod`. Precisamos garantir que o hook `useModeloAtualAnalytics` também tenha acesso a esses valores para filtragem por closer.

#### Arquivo: `src/hooks/useModeloAtualAnalytics.ts`

Verificar se os cards retornados por `getCardsForIndicator` incluem os campos `valorMRR`, `valorSetup`, `valorPontual`, `closer`. Se não, adicionar.

#### Arquivo: `src/components/planning/IndicatorsTab.tsx`

Modificar a função `getRealizedMonetaryForIndicator` para:

1. **Faturamento**: Filtrar por closer se aplicável
2. **MRR**: Somar de todas as BUs selecionadas, com filtro de closer para Modelo Atual
3. **Setup**: Idem
4. **Pontual**: Idem
5. **ROI**: Automático (usa faturamento que já estará filtrado)

---

### Código Refatorado para `getRealizedMonetaryForIndicator`

```typescript
const getRealizedMonetaryForIndicator = (indicator: MonetaryIndicatorConfig): number => {
  switch (indicator.key) {
    case 'faturamento': {
      let total = 0;
      
      if (includesModeloAtual) {
        if (selectedClosers.length > 0) {
          // Com filtro de closer: usar analytics para filtrar
          const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
          const filteredCards = salesCards.filter(card => 
            matchesCloserFilter((card.responsible || '').trim())
          );
          total += filteredCards.reduce((acc, card) => acc + (card.value || 0), 0);
        } else {
          total += getModeloAtualValue('venda', startDate, endDate);
        }
      }
      
      // Outras BUs não têm filtro de closer
      if (includesO2Tax) {
        total += getO2TaxQty('venda', startDate, endDate) * 15000;
      }
      if (includesOxyHacker) {
        total += getOxyHackerQty('venda', startDate, endDate) * 54000;
      }
      if (includesFranquia) {
        total += getExpansaoQty('venda', startDate, endDate) * 140000;
      }
      
      return total;
    }
    
    case 'roi': {
      const faturamento = getRealizedMonetaryForIndicator({ ...indicator, key: 'faturamento' });
      const investimento = getInvestimentoPeriodo();
      return investimento > 0 ? faturamento / investimento : 0;
    }
    
    case 'mrr': {
      let total = 0;
      
      if (includesModeloAtual) {
        if (selectedClosers.length > 0) {
          const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
          const filteredCards = salesCards.filter(card => 
            matchesCloserFilter((card.responsible || '').trim())
          );
          // Acessar valorMRR dos items (precisa estar disponível no DetailItem)
          total += filteredCards.reduce((acc, card) => acc + ((card as any).mrr || 0), 0);
        } else {
          total += getMrrForPeriod(startDate, endDate);
        }
      }
      
      // Para O2 TAX, Oxy Hacker, Franquia: estimar ou buscar de hooks específicos
      // (atualmente não têm campo MRR separado, então usar 0 ou estimativa)
      
      return total;
    }
    
    case 'setup': {
      let total = 0;
      
      if (includesModeloAtual) {
        if (selectedClosers.length > 0) {
          const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
          const filteredCards = salesCards.filter(card => 
            matchesCloserFilter((card.responsible || '').trim())
          );
          total += filteredCards.reduce((acc, card) => acc + ((card as any).setup || 0), 0);
        } else {
          total += getSetupForPeriod(startDate, endDate);
        }
      }
      
      return total;
    }
    
    case 'pontual': {
      let total = 0;
      
      if (includesModeloAtual) {
        if (selectedClosers.length > 0) {
          const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
          const filteredCards = salesCards.filter(card => 
            matchesCloserFilter((card.responsible || '').trim())
          );
          total += filteredCards.reduce((acc, card) => acc + ((card as any).pontual || 0), 0);
        } else {
          total += getPontualForPeriod(startDate, endDate);
        }
      }
      
      return total;
    }
    
    default:
      return 0;
  }
};
```

---

### Extensão do `DetailItem` (se necessário)

Adicionar campos opcionais ao tipo `DetailItem` em `DetailSheet.tsx`:

```typescript
export interface DetailItem {
  // ... campos existentes ...
  mrr?: number;
  setup?: number;
  pontual?: number;
}
```

E garantir que `useModeloAtualAnalytics.toDetailItem` popule esses campos.

---

### Resumo de Modificações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/planning/indicators/DetailSheet.tsx` | Modificar | Adicionar campos `mrr`, `setup`, `pontual` ao `DetailItem` |
| `src/hooks/useModeloAtualAnalytics.ts` | Modificar | Incluir `mrr`, `setup`, `pontual`, `closer` no mapeamento de cards |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Refatorar `getRealizedMonetaryForIndicator` para respeitar filtros de BU e Closer |

---

### Meta de Indicadores Monetários com Filtro de Closer

A função `getMetaMonetaryForIndicator` também precisará ser ajustada para aplicar proporções de closer nas metas quando o filtro estiver ativo:

```typescript
case 'faturamento':
  let meta = getFaturamentoMetaPeriodo();
  // Se apenas Modelo Atual está selecionado E há filtro de closer
  if (hasSingleBU && includesModeloAtual && selectedClosers.length > 0) {
    // Aplicar proporção do closer (usar getFilteredMeta)
    const monthsInPeriod = eachMonthOfInterval({ start: startDate, end: endDate });
    // Recalcular meta com filtro de closer por mês
    // ...
  }
  return meta;
```

