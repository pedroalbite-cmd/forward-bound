

## Plano: Corrigir Drill-down dos Acelerômetros para Filtro de Closer

### Problema Identificado

Quando o usuário seleciona **Consolidado** + **Lucas** como Closer e clica nos acelerômetros (radial cards), o drill-down retorna **lista vazia** (0 itens).

**Causa raiz**: A função `getItemsForIndicator` busca dados de **todas as 4 BUs** e depois tenta filtrar por closer. Como Lucas só opera na O2 TAX:
- Items de Modelo Atual, Franquia, Oxy Hacker → não têm Lucas como closer → são filtrados fora
- Items da O2 TAX → podem ter closer preenchido ou não (dependendo da fase)

**Resultado**: lista vazia mesmo quando existem dados.

### Solução

Aplicar a mesma lógica de exclusão de BU do `getRealizedForIndicator` no `getItemsForIndicator`:

> Se um closer está selecionado e ele **não opera** em uma BU, não buscar dados dessa BU para o drill-down.

---

### Seção Técnica

#### Alteração em `IndicatorsTab.tsx` (função `getItemsForIndicator`)

**Antes** (linhas 919-950):
```typescript
const getItemsForIndicator = (indicatorKey: IndicatorType): DetailItem[] => {
  let items: DetailItem[] = [];
  
  // Aggregate items from selected BUs
  if (includesModeloAtual) {
    items = [...items, ...modeloAtualAnalytics.getDetailItemsForIndicator(indicatorKey)];
  }
  
  if (includesO2Tax) {
    items = [...items, ...o2TaxAnalytics.getDetailItemsForIndicator(indicatorKey)];
  }
  
  // ... outras BUs
  
  // Apply closer filter if any closers are selected
  if (selectedClosers.length > 0) {
    items = items.filter(item => matchesCloserFilter(item.closer));
  }
  
  return items;
};
```

**Depois**:
```typescript
const getItemsForIndicator = (indicatorKey: IndicatorType): DetailItem[] => {
  let items: DetailItem[] = [];
  
  // Apply the SAME BU exclusion logic as getRealizedForIndicator
  // If a closer is selected and doesn't operate in a BU, skip that BU entirely
  
  if (includesModeloAtual) {
    const closersForBU = effectiveSelectedClosers.filter(c => 
      BU_CLOSERS.modelo_atual.includes(c as CloserType)
    );
    // Include BU if: no closer filter OR at least one selected closer operates here
    if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
      const buItems = modeloAtualAnalytics.getDetailItemsForIndicator(indicatorKey);
      // If closer filter is active, apply it to items from this BU
      if (effectiveSelectedClosers.length > 0) {
        items = [...items, ...buItems.filter(item => matchesCloserFilter(item.closer))];
      } else {
        items = [...items, ...buItems];
      }
    }
  }
  
  if (includesO2Tax) {
    const closersForBU = effectiveSelectedClosers.filter(c => 
      BU_CLOSERS.o2_tax.includes(c as CloserType)
    );
    if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
      const buItems = o2TaxAnalytics.getDetailItemsForIndicator(indicatorKey);
      if (effectiveSelectedClosers.length > 0) {
        items = [...items, ...buItems.filter(item => matchesCloserFilter(item.closer))];
      } else {
        items = [...items, ...buItems];
      }
    }
  }
  
  if (includesFranquia) {
    const closersForBU = effectiveSelectedClosers.filter(c => 
      BU_CLOSERS.franquia.includes(c as CloserType)
    );
    if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
      const buItems = franquiaAnalytics.getDetailItemsForIndicator(indicatorKey);
      if (effectiveSelectedClosers.length > 0) {
        items = [...items, ...buItems.filter(item => matchesCloserFilter(item.closer))];
      } else {
        items = [...items, ...buItems];
      }
    }
  }
  
  if (includesOxyHacker) {
    const closersForBU = effectiveSelectedClosers.filter(c => 
      BU_CLOSERS.oxy_hacker.includes(c as CloserType)
    );
    if (closersForBU.length > 0 || effectiveSelectedClosers.length === 0) {
      const buItems = oxyHackerAnalytics.getDetailItemsForIndicator(indicatorKey);
      if (effectiveSelectedClosers.length > 0) {
        items = [...items, ...buItems.filter(item => matchesCloserFilter(item.closer))];
      } else {
        items = [...items, ...buItems];
      }
    }
  }
  
  // Apply SDR filter if any SDRs are selected
  if (selectedSDRs.length > 0) {
    items = items.filter(item => matchesSdrFilter(item.responsible));
  }
  
  return items;
};
```

---

### Comportamento Esperado Após a Correção

| Cenário | Resultado Esperado |
|---------|-------------------|
| Consolidado + Lucas | Drill-down mostra apenas items da O2 TAX com closer Lucas |
| Consolidado + Pedro | Drill-down mostra items de Modelo Atual, Franquia, Oxy Hacker com closer Pedro |
| Consolidado + Todos Closers | Drill-down mostra todos os items de todas as BUs |
| O2 TAX + Lucas | Drill-down mostra items da O2 TAX (mesmo que closer não esteja preenchido) |

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Refatorar `getItemsForIndicator` para aplicar lógica de exclusão de BU baseada no closer selecionado |

---

### Nota Importante sobre Closer na O2 TAX

O campo "Closer responsável" na O2 TAX geralmente só é preenchido em fases mais avançadas (RM, RR, Proposta, Ganho). Portanto:
- Para **MQL e Leads** da O2 TAX, o filtro por closer pode retornar lista vazia mesmo que Lucas seja o único closer
- Isso é comportamento esperado do banco de dados, não um bug do sistema

Se for desejado mostrar **todos os items da O2 TAX** quando Lucas está selecionado (já que ele é o único closer da BU), seria necessário uma lógica adicional que trata BUs com closer único de forma especial.

