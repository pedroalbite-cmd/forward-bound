

# Plano: Filtrar Indicadores pela Primeira Entrada em Cada Fase

## Comportamento Desejado

**Regra universal para TODOS os indicadores:**
Um card só aparece em um indicador se a **primeira entrada naquela fase específica** ocorreu dentro do período selecionado.

| Indicador | Card aparece se... |
|-----------|---------------------|
| MQL | Primeira entrada em fase MQL foi no período |
| RM | Primeira entrada em fase RM foi no período |
| RR | Primeira entrada em fase RR foi no período |
| Proposta | Primeira entrada em fase Proposta foi no período |
| Venda | Primeira entrada em fase Venda foi no período |

**Exemplo (Card A3P Transporte):**
- MQL em 31/01/2026
- RM em 02/02/2026
- RR em 05/02/2026
- Proposta em 10/02/2026
- Venda em 15/02/2026

| Período | MQL | RM | RR | Proposta | Venda |
|---------|-----|-----|-----|----------|-------|
| Janeiro | Aparece | NÃO | NÃO | NÃO | NÃO |
| Fevereiro | NÃO | Aparece | Aparece | Aparece | Aparece |

## Problema Atual

1. **Query limitada ao período**: `query_period` só busca movimentos dentro do período selecionado
2. **Sem visibilidade do histórico**: Quando Fevereiro é selecionado, o sistema não vê que MQL aconteceu em Janeiro
3. **Lógica incompleta**: Apenas MQL tem lógica de "primeira entrada", outras fases mostram qualquer movimento no período

## Solução Técnica

### Arquivos a Modificar

#### 1. Edge Function `supabase/functions/query-external-db/index.ts`

**Adicionar nova action `query_card_history`** (após linha 272):

```typescript
} else if (action === 'query_card_history') {
  // Query full history for specific card IDs (used to find first phase entry)
  const { cardIds } = body;
  
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    await client.end();
    return new Response(
      JSON.stringify({ error: 'cardIds array required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const validTables = ['pipefy_cards', 'pipefy_cards_expansao', 'pipefy_cards_movements', 'pipefy_cards_movements_expansao', 'pipefy_moviment_cfos'];
  if (!validTables.includes(table)) {
    await client.end();
    return new Response(
      JSON.stringify({ error: 'Invalid table name' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Limit to 500 IDs per request for safety
  const limitedIds = cardIds.slice(0, 500);
  
  console.log(`Querying full history for ${limitedIds.length} card IDs in ${table}`);
  
  // Build parameterized query with placeholders
  const placeholders = limitedIds.map((_, i) => `$${i + 1}`).join(', ');
  const dataQuery = `
    SELECT * FROM ${table} 
    WHERE "ID" IN (${placeholders})
    ORDER BY "Entrada" ASC
  `;
  
  const dataResult = await client.queryObject(dataQuery, limitedIds);
  
  result = {
    action: 'query_card_history',
    table,
    cardIds: limitedIds,
    totalRows: dataResult.rows.length,
    data: dataResult.rows,
  };
  console.log(`Card history query: ${result.totalRows} total movements for ${limitedIds.length} cards`);
}
```

**Atualizar mensagem de erro** (linha 276):
```typescript
JSON.stringify({ error: 'Invalid action. Use: schema, preview, count, query_period, search, stats, or query_card_history' })
```

#### 2. Hook `src/hooks/useModeloAtualAnalytics.ts`

**Mudanças principais no `queryFn`** (linhas 111-198):

```text
Fluxo atualizado:

1. QUERY PRINCIPAL: Buscar movimentos do período selecionado (como hoje)
   → Identificar todos os card IDs únicos que aparecem no período

2. QUERY SECUNDÁRIA: Para esses cards, buscar TODO o histórico
   → Chamar action 'query_card_history' com os IDs únicos
   → Retorna TODOS os movimentos desses cards (inclusive de meses anteriores)

3. RETORNAR AMBOS: 
   → cards: movimentos do período (como hoje)
   → fullHistory: todos os movimentos para verificar primeira entrada
```

**Modificar `queryFn`:**
```typescript
queryFn: async () => {
  // Step 1: Fetch movements in the selected period
  const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
    body: { 
      table: 'pipefy_moviment_cfos', 
      action: 'query_period',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 10000 
    }
  });

  if (fetchError) throw fetchError;
  if (!responseData?.data) return { cards: [], fullHistory: [] };

  const cards = parseCards(responseData.data); // Extract parsing to helper

  // Step 2: Get unique card IDs from period
  const uniqueCardIds = [...new Set(cards.map(c => c.id))];
  
  // Step 3: Fetch full history for these cards
  let fullHistory: ModeloAtualCard[] = [];
  if (uniqueCardIds.length > 0) {
    const { data: historyData } = await supabase.functions.invoke('query-external-db', {
      body: { 
        table: 'pipefy_moviment_cfos', 
        action: 'query_card_history',
        cardIds: uniqueCardIds
      }
    });
    
    if (historyData?.data) {
      fullHistory = parseCards(historyData.data);
    }
  }

  return { cards, fullHistory };
}
```

**Criar mapa de PRIMEIRA ENTRADA por INDICADOR** (substituir `firstMqlEntryByCard`):

```typescript
// Build a map of first entry for EACH indicator per card (using full history)
const firstEntryByCardAndIndicator = useMemo(() => {
  const firstEntries = new Map<string, Map<IndicatorType, ModeloAtualCard>>();
  const history = data?.fullHistory ?? [];
  
  for (const card of history) {
    const indicator = PHASE_TO_INDICATOR[card.fase];
    if (!indicator) continue;
    
    // Special validation for MQL (requires revenue >= 200k)
    if (indicator === 'mql' && !isMqlQualified(card.faixa)) continue;
    
    if (!firstEntries.has(card.id)) {
      firstEntries.set(card.id, new Map());
    }
    
    const cardMap = firstEntries.get(card.id)!;
    const existing = cardMap.get(indicator);
    
    // Keep the EARLIEST entry for this indicator
    if (!existing || card.dataEntrada < existing.dataEntrada) {
      cardMap.set(indicator, card);
    }
  }
  
  return firstEntries;
}, [data?.fullHistory]);
```

**Modificar `getCardsForIndicator`** para usar a nova lógica universal:

```typescript
const getCardsForIndicator = useMemo(() => {
  return (indicator: IndicatorType): ModeloAtualCard[] => {
    const uniqueCards = new Map<string, ModeloAtualCard>();
    
    // For LEADS indicator: union of leads + mql phases
    const indicatorsToCheck = indicator === 'leads' 
      ? ['leads', 'mql'] as IndicatorType[]
      : [indicator];
    
    for (const ind of indicatorsToCheck) {
      // Check each card's first entry for this indicator
      for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
        const firstEntry = indicatorMap.get(ind);
        if (!firstEntry) continue;
        
        const entryTime = firstEntry.dataEntrada.getTime();
        
        // Only include if FIRST entry was in selected period
        if (entryTime >= startTime && entryTime <= endTime) {
          // For same card appearing in multiple indicators, keep earliest
          const existing = uniqueCards.get(cardId);
          if (!existing || firstEntry.dataEntrada < existing.dataEntrada) {
            uniqueCards.set(cardId, firstEntry);
          }
        }
      }
    }
    
    return Array.from(uniqueCards.values());
  };
}, [firstEntryByCardAndIndicator, startTime, endTime]);
```

## Fluxo de Dados Corrigido

```text
Período selecionado: Fevereiro 2026
Card: A3P Transporte

1. Query período (01/02 - 28/02):
   → Retorna movimento em "Tentativas de contato" (02/02)
   → ID do card: 1291436814

2. Query histórico (card 1291436814):
   → Retorna TODOS os movimentos:
     - 31/01 "MQLs" (fase MQL)
     - 02/02 "Tentativas de contato" (fase MQL)
     - 05/02 "Reunião agendada" (fase RM)
     - etc.

3. Construção firstEntryByCardAndIndicator:
   → card[1291436814][mql] = { data: 31/01 }  ← primeira MQL
   → card[1291436814][rm] = { data: 05/02 }   ← primeira RM
   → etc.

4. Filtragem para Fevereiro:
   → MQL: primeira entrada 31/01 → fora do período → NÃO aparece ✓
   → RM: primeira entrada 05/02 → dentro do período → aparece ✓
   → etc.
```

## Impacto

- Card A3P Transporte:
  - **Janeiro**: Aparece apenas em MQL (primeira qualificação 31/01)
  - **Fevereiro**: Aparece apenas em RM, RR, Proposta, Venda (se passou por essas fases em Fev)
  - **NÃO aparece em MQL em Fevereiro** (já contou em Janeiro)

## Considerações de Performance

- Query adicional apenas quando há cards no período
- Histórico limitado a 500 IDs por request
- Cache do React Query preserva resultados entre navegações
- Dados memoizados evitam recálculos desnecessários

## Arquivos a Modificar

1. `supabase/functions/query-external-db/index.ts` - Adicionar action `query_card_history`
2. `src/hooks/useModeloAtualAnalytics.ts` - Busca em duas etapas + lógica universal de primeira entrada

