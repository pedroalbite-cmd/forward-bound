

## Corrigir Histórico de Movimentação no Widget de Conversão por Tier

### Problema

O widget "Conversão de Funil por Tier de Faturamento" perde o histórico de movimentação quando o card atravessa dois períodos:
- Card em **RM (Dezembro)** → **RR (Dezembro)** → **Proposta (Janeiro)** → **Venda (Janeiro)**
- Ao filtrar **Janeiro**, apenas Proposta e Venda aparecem
- O tier de faturamento do card não é considerado em RM→RR (que aconteceu em Dezembro)

### Causa Raiz

A lógica atual busca cards por indicador usando apenas movimentações **dentro do período**:
```typescript
// Linha 493-495 do useO2TaxAnalytics.ts
const entryTime = card.dataEntrada.getTime();
if (entryTime < startTime || entryTime > endTime) continue;
```

Isso significa que para calcular conversão RM→RR, o sistema só considera cards que **entraram** em RM durante o período, ignorando cards que já estavam em RM antes.

### Solução Proposta

Criar um **modo de análise de coorte** que considera o **histórico completo** de cada card que teve alguma movimentação no período selecionado.

**Nova lógica:**
1. Identificar todos os cards que tiveram **qualquer movimentação** no período (Proposta ou Venda em Janeiro)
2. Para esses cards, recuperar o **histórico completo** de movimentações (incluindo RM/RR de Dezembro)
3. Usar esse histórico para calcular as taxas de conversão por tier

### Alterações Técnicas

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useO2TaxAnalytics.ts` | Adicionar função `getCardHistoryForPeriod()` que busca histórico completo de cards ativos no período |
| `src/hooks/useModeloAtualAnalytics.ts` | Adicionar mesma lógica para Modelo Atual |
| `src/hooks/useExpansaoAnalytics.ts` | Adicionar mesma lógica para Franquia/Oxy Hacker |
| `src/components/planning/indicators/FunnelConversionByTierWidget.tsx` | Adicionar toggle "Modo Coorte" que usa o histórico completo vs apenas período |

---

### Implementação Detalhada

**1. Nova função nos hooks de analytics:**

```typescript
// Exemplo para useO2TaxAnalytics.ts

// Get cards that had activity in the period, with their FULL history
const getCardsWithFullHistory = useMemo(() => {
  // Step 1: Find all card IDs that had ANY movement in the period
  const activeCardIds = new Set<string>();
  for (const card of cards) {
    const entryTime = card.dataEntrada.getTime();
    if (entryTime >= startTime && entryTime <= endTime) {
      activeCardIds.add(card.id);
    }
  }
  
  // Step 2: For each active card, get ALL their movements (regardless of date)
  const cardHistories = new Map<string, O2TaxCard[]>();
  for (const card of cards) {
    if (activeCardIds.has(card.id)) {
      if (!cardHistories.has(card.id)) {
        cardHistories.set(card.id, []);
      }
      cardHistories.get(card.id)!.push(card);
    }
  }
  
  return cardHistories;
}, [cards, startTime, endTime]);

// Get items for indicator using FULL history (for tier conversion analysis)
const getItemsWithFullHistory = (indicator: IndicatorType): DetailItem[] => {
  const result: DetailItem[] = [];
  const seenIds = new Set<string>();
  
  const cardHistories = getCardsWithFullHistory;
  
  for (const [cardId, movements] of cardHistories.entries()) {
    if (seenIds.has(cardId)) continue;
    
    // Check if this card ever entered this indicator phase
    const matchingMovement = movements.find(m => {
      const movementIndicator = PHASE_TO_INDICATOR_MAP[m.fase];
      return movementIndicator === indicator;
    });
    
    if (matchingMovement) {
      seenIds.add(cardId);
      result.push(toDetailItem(matchingMovement));
    }
  }
  
  return result;
};
```

**2. Toggle no Widget:**

Adicionar um switch "Modo Coorte" que alterna entre:
- **Período**: Conta apenas movimentações dentro do período (comportamento atual)
- **Coorte**: Conta histórico completo de cards que tiveram atividade no período

---

### Comportamento Esperado

**Cenário:** Card ABC
- Dezembro: RM → RR
- Janeiro: Proposta → Venda
- Tier: R$ 500k - 1M

**Antes (filtro Janeiro):**
| Etapa | R$ 500k-1M |
|-------|------------|
| RM→RR | 0% (0/0) |
| RR→Prop | 0% (0/0) |
| Prop→Venda | 100% (1/1) |

**Depois (Modo Coorte, filtro Janeiro):**
| Etapa | R$ 500k-1M |
|-------|------------|
| RM→RR | 100% (1/1) |
| RR→Prop | 100% (1/1) |
| Prop→Venda | 100% (1/1) |

---

### Alternativas Consideradas

**Alternativa A: Apenas Modo Coorte (mais simples)**
- Remove o toggle e sempre usa o histórico completo
- Prós: Mais simples de implementar
- Contras: Perde a análise de "o que aconteceu especificamente neste período"

**Alternativa B: Toggle (recomendado)**
- Permite escolher entre os dois modos
- Prós: Flexibilidade máxima para análise
- Contras: Mais complexo de implementar

---

### Próximos Passos

1. Implementar `getCardsWithFullHistory` nos 3 hooks de analytics
2. Criar nova prop `useCohortMode` no FunnelConversionByTierWidget
3. Adicionar toggle visual no header do widget
4. Testar com cenário de cards que cruzam múltiplos meses

