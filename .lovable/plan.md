

## Corrigir MRR/Setup/Pontual Zerados para O2 TAX na Aba Indicadores

### Problema Identificado

Na aba **Indicadores**, quando o usuário seleciona "O2 TAX" como BU, os acelerômetros de **MRR**, **Setup** e **Pontual** mostram **R$ 0**, apesar de existirem valores reais no banco de dados.

| Componente | Código | Problema |
|------------|--------|----------|
| Desestruturação do hook | Linha 372 | Não extrai `getMrrForPeriod`, `getSetupForPeriod`, `getPontualForPeriod` do `useO2TaxMetas` |
| Case `mrr` | Linhas 1612-1631 | Só soma Modelo Atual, ignora O2 TAX (comentário diz "Other BUs don't have MRR breakdown") |
| Case `setup` | Linhas 1634-1649 | Só soma Modelo Atual |
| Case `pontual` | Linhas 1652-1667 | Só soma Modelo Atual |

---

### Solução

Extrair as funções de MRR/Setup/Pontual do hook `useO2TaxMetas` e somar esses valores quando O2 TAX estiver selecionado.

---

### Arquivo a Modificar

| Arquivo | Linhas | Ação |
|---------|--------|------|
| `src/components/planning/IndicatorsTab.tsx` | 372 | Adicionar `getMrrForPeriod: getO2TaxMrr`, etc. à desestruturação |
| `src/components/planning/IndicatorsTab.tsx` | 1612-1631 | Somar O2 TAX MRR no case `mrr` |
| `src/components/planning/IndicatorsTab.tsx` | 1634-1649 | Somar O2 TAX Setup no case `setup` |
| `src/components/planning/IndicatorsTab.tsx` | 1652-1667 | Somar O2 TAX Pontual no case `pontual` |

---

### Mudanças no Código

**1. Linha 372 - Atualizar desestruturação do useO2TaxMetas:**

```typescript
// Antes:
const { getQtyForPeriod: getO2TaxQty, getValueForPeriod: getO2TaxValue, getGroupedData: getO2TaxGroupedData, isLoading: isLoadingO2Tax } = useO2TaxMetas(startDate, endDate);

// Depois:
const { 
  getQtyForPeriod: getO2TaxQty, 
  getValueForPeriod: getO2TaxValue, 
  getMrrForPeriod: getO2TaxMrr, 
  getSetupForPeriod: getO2TaxSetup, 
  getPontualForPeriod: getO2TaxPontual,
  getGroupedData: getO2TaxGroupedData, 
  isLoading: isLoadingO2Tax 
} = useO2TaxMetas(startDate, endDate);
```

---

**2. Case `mrr` (linhas 1612-1631) - Adicionar soma de O2 TAX:**

```typescript
case 'mrr': {
  let total = 0;
  
  if (includesModeloAtual) {
    if (selectedClosers.length > 0) {
      const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
      const filteredCards = salesCards.filter(card => 
        matchesCloserFilter((card.closer || '').trim())
      );
      total += filteredCards.reduce((acc, card) => acc + (card.valorMRR || 0), 0);
    } else {
      total += getMrrForPeriod(startDate, endDate);
    }
  }
  
  // ADICIONAR: O2 TAX MRR
  if (includesO2Tax) {
    total += getO2TaxMrr(startDate, endDate);
  }
  
  return total;
}
```

---

**3. Case `setup` (linhas 1634-1649) - Adicionar soma de O2 TAX:**

```typescript
case 'setup': {
  let total = 0;
  
  if (includesModeloAtual) {
    if (selectedClosers.length > 0) {
      const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
      const filteredCards = salesCards.filter(card => 
        matchesCloserFilter((card.closer || '').trim())
      );
      total += filteredCards.reduce((acc, card) => acc + (card.valorSetup || 0), 0);
    } else {
      total += getSetupForPeriod(startDate, endDate);
    }
  }
  
  // ADICIONAR: O2 TAX Setup
  if (includesO2Tax) {
    total += getO2TaxSetup(startDate, endDate);
  }
  
  return total;
}
```

---

**4. Case `pontual` (linhas 1652-1667) - Adicionar soma de O2 TAX:**

```typescript
case 'pontual': {
  let total = 0;
  
  if (includesModeloAtual) {
    if (selectedClosers.length > 0) {
      const salesCards = modeloAtualAnalytics.getCardsForIndicator('venda');
      const filteredCards = salesCards.filter(card => 
        matchesCloserFilter((card.closer || '').trim())
      );
      total += filteredCards.reduce((acc, card) => acc + (card.valorPontual || 0), 0);
    } else {
      total += getPontualForPeriod(startDate, endDate);
    }
  }
  
  // ADICIONAR: O2 TAX Pontual
  if (includesO2Tax) {
    total += getO2TaxPontual(startDate, endDate);
  }
  
  return total;
}
```

---

### Resultado Esperado

| Métrica | Antes (O2 TAX, Jan) | Depois |
|---------|---------------------|--------|
| MRR | R$ 0 | Valor real do banco (pipefy_cards_movements) |
| Setup | R$ 0 | Valor real do banco |
| Pontual | R$ 0 | Valor real do banco |
| Soma Total | R$ 0 | ~R$ 54k (consistente com o acelerômetro de Faturamento) |

---

### Nota sobre Oxy Hacker e Franquia

Essas BUs usam a tabela `pipefy_cards_movements_expansao`. Se elas também tiverem valores de MRR/Setup/Pontual no banco, a mesma lógica pode ser aplicada. Por enquanto, elas continuam usando tickets fixos (Oxy Hacker: R$ 54k, Franquia: R$ 140k).

