

## Perdidos e Motivos de Perda — Respeitar BU selecionada

### Problema
Os widgets `LostDealsWidget` e `LossReasonsWidget` usam **sempre** `useO2TaxAnalytics`, mostrando dados mockados para outras BUs. Deveriam puxar dados reais da BU correspondente.

### Solução

**1. Adicionar `getLostDeals` e `getLossReasons` em `useModeloAtualAnalytics.ts`**
- Lógica idêntica à do O2 Tax: iterar `cards`, filtrar os que têm `faseAtual === 'Perdido'` ou `'Arquivado'` (ou `fase` equivalente), no período, deduplicar por ID
- `getLostDeals`: retorna `{ count, totalValue, trend, cards }`
- `getLossReasons`: agrupa por `motivoPerda`, calcula percentual, retorna array com `{ reason, count, percentage, cards, color }`

**2. Adicionar `getLostDeals` e `getLossReasons` em `useExpansaoAnalytics.ts`**
- Mesma lógica, filtrando fases `'Perdido'` e `'Arquivado'`

**3. Refatorar `LostDealsWidget.tsx`**
- Importar os 3 hooks (`useModeloAtualAnalytics`, `useO2TaxAnalytics`, `useExpansaoAnalytics`)
- Com base no `buKey`, chamar o hook correto e pegar `getLostDeals` + `toDetailItem`
- Remover mock data
- Para `buKey === 'all'` (consolidado), somar os dados de todos os hooks

**4. Refatorar `LossReasonsWidget.tsx`**
- Mesma lógica: rotear para o hook correto com base no `buKey`
- Remover mock data
- Para consolidado, mesclar os `getLossReasons` de todos os hooks (agrupar por motivo)

### Detalhes de implementação

Nos hooks de analytics, a lógica de perdidos:
```typescript
const getLostDeals = useMemo(() => {
  const lostCards = [];
  const seenIds = new Set();
  for (const card of cards) {
    const isLost = card.faseAtual === 'Perdido' || card.faseAtual === 'Arquivado';
    const inPeriod = card.dataEntrada.getTime() >= startTime && card.dataEntrada.getTime() <= endTime;
    if (isLost && inPeriod && !seenIds.has(card.id)) {
      lostCards.push(card);
      seenIds.add(card.id);
    }
  }
  return { count: lostCards.length, totalValue: lostCards.reduce((s,c) => s + c.valor, 0), trend: 0, cards: lostCards };
}, [cards, startTime, endTime]);
```

Nos widgets, seleção do hook por BU:
- `modelo_atual` → `useModeloAtualAnalytics`
- `o2_tax` → `useO2TaxAnalytics`
- `oxy_hacker` / `franquia` → `useExpansaoAnalytics` (com o produto correto)
- `all` → combinar resultados dos 3 hooks

### Arquivos alterados
1. `src/hooks/useModeloAtualAnalytics.ts` — adicionar `getLostDeals`, `getLossReasons`
2. `src/hooks/useExpansaoAnalytics.ts` — adicionar `getLostDeals`, `getLossReasons`
3. `src/components/planning/indicators/LostDealsWidget.tsx` — rotear para hook correto por BU
4. `src/components/planning/indicators/LossReasonsWidget.tsx` — rotear para hook correto por BU

