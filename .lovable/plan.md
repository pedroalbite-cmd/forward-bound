

## Plano: Corrigir Filtro de Closers para Usar Campo Específico

### Problema Identificado

O filtro de Closers está comparando contra o campo `responsavel`, que é preenchido com fallback:
```
Closer responsável || SDR responsável || Responsável
```

Isso causa o seguinte cenário problemático:
- Card com `Closer responsável = "Pedro Albite"` e `SDR responsável = "Jessica Simon Nunes"`
- O campo `responsavel` = "Pedro Albite" (prioridade para Closer) ✓ Correto
- **MAS** um card com `Closer responsável = ""` e `SDR responsável = "Jessica Simon Nunes"`:
- O campo `responsavel` = "Jessica Simon Nunes"
- Este card NÃO deveria aparecer no filtro de Pedro ✓ Correto

O problema real pode ser que a coluna **exibida** no DetailSheet mostra o SDR, mesmo quando o Closer é Pedro. Ou seja, o filtro está correto, mas a **exibição** mostra o campo errado.

---

### Análise do Banco de Dados

No banco `pipefy_moviment_cfos`:
- `Closer responsável`: Campo específico do Closer (Pedro Albite, Daniel Trindade)
- `SDR responsável`: Campo do SDR (Jessica Simon Nunes, etc.)

O código atual mapeia para `responsavel`:
```typescript
responsavel: row['Closer responsável'] || row['SDR responsável'] || row['Responsável'] || ...
```

---

### Solução Proposta

**Opção 1: Separar campos Closer e SDR (Recomendada)**

Adicionar um campo `closer` separado no `ModeloAtualCard` para armazenar especificamente o "Closer responsável", e usar esse campo para o filtro. O campo `responsavel` mostraria o SDR para exibição na coluna "Responsável".

#### 1. Modificar `src/hooks/useModeloAtualAnalytics.ts`

Adicionar campo `closer` na interface `ModeloAtualCard`:
```typescript
export interface ModeloAtualCard {
  // ... campos existentes ...
  responsavel?: string;  // Para exibição (SDR ou outro)
  closer?: string;       // Novo campo: especificamente o Closer
}
```

Atualizar mapeamento no parsing:
```typescript
cards.push({
  // ... outros campos ...
  responsavel: row['SDR responsável'] || row['Responsável'] || '',  // SDR para exibição
  closer: row['Closer responsável'] || '',  // Closer separado para filtro
});
```

Atualizar `toDetailItem` para usar ambos os campos:
```typescript
const toDetailItem = (card: ModeloAtualCard): DetailItem => ({
  // ... outros campos ...
  responsible: card.closer || card.responsavel || undefined,  // Prioriza Closer na exibição
});
```

#### 2. Modificar `src/components/planning/ClickableFunnelChart.tsx`

Atualizar helpers de filtro para usar `card.closer`:
```typescript
const getFilteredModeloAtualQty = (indicator: IndicatorType): number => {
  if (selectedClosers?.length && selectedClosers.length > 0) {
    const cards = modeloAtualAnalytics.getCardsForIndicator(indicator);
    return cards.filter(c => selectedClosers.includes(c.closer || '')).length;
  }
  // ...
};

const getFilteredModeloAtualValue = (indicator: 'proposta' | 'venda'): number => {
  if (selectedClosers?.length && selectedClosers.length > 0) {
    const cards = modeloAtualAnalytics.getCardsForIndicator(indicator);
    const filteredCards = cards.filter(c => selectedClosers.includes(c.closer || ''));
    return filteredCards.reduce((sum, card) => sum + card.valor, 0);
  }
  // ...
};
```

Atualizar `getItemsForIndicator` para filtrar por `closer`:
```typescript
if (selectedClosers?.length && selectedClosers.length > 0) {
  const cards = modeloAtualAnalytics.getCardsForIndicator(indicator);
  const filteredCards = cards.filter(c => selectedClosers.includes(c.closer || ''));
  items = filteredCards.map(modeloAtualAnalytics.toDetailItem);
}
```

#### 3. Modificar outros componentes que usam o filtro

| Componente | Mudança |
|------------|---------|
| `LeadsStackedChart.tsx` | Filtrar por `c.closer` |
| `LeadsMqlsStackedChart.tsx` | Filtrar por `c.closer` |
| `IndicatorsTab.tsx` | Filtrar por `card.closer` |

---

### Comportamento Esperado Após Correção

| Cenário | Resultado |
|---------|-----------|
| Card com Closer = "Pedro", SDR = "Jessica" | Filtro Pedro ✓ mostra card, coluna Responsável = "Pedro" |
| Card com Closer = "", SDR = "Jessica" | Filtro Pedro ✗ NÃO mostra card |
| Card com Closer = "Daniel", SDR = "Jessica" | Filtro Pedro ✗ NÃO mostra card |
| Sem filtro de closers | Mostra todos os cards |

---

### Resumo de Arquivos a Modificar

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/hooks/useModeloAtualAnalytics.ts` | Adicionar campo `closer` na interface e mapeamento |
| `src/components/planning/ClickableFunnelChart.tsx` | Usar `card.closer` para filtros |
| `src/components/planning/LeadsStackedChart.tsx` | Usar `card.closer` para filtros |
| `src/components/planning/LeadsMqlsStackedChart.tsx` | Usar `card.closer` para filtros |
| `src/components/planning/IndicatorsTab.tsx` | Usar `card.closer` para filtros nos radial cards |

