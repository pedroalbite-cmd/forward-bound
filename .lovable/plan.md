
# Plano: Implementar Lógica de "Primeira Entrada" em TODOS os Hooks de Analytics

## Problema Atual

Atualmente, apenas o `useModeloAtualAnalytics` foi atualizado para usar a lógica de "primeira entrada". Os outros hooks (`useO2TaxAnalytics` e `useExpansaoAnalytics`) ainda contam **qualquer movimento no período**, causando:

1. Cards aparecem em múltiplos períodos para o mesmo indicador
2. Inconsistência entre BUs
3. Discrepância entre acelerômetros e drill-downs

## Arquitetura da Solução

Todos os hooks de analytics devem seguir a mesma lógica:

| Etapa | Descrição |
|-------|-----------|
| 1. Query período | Buscar movimentos dentro do período selecionado |
| 2. Query histórico | Buscar TODO o histórico dos cards identificados |
| 3. Primeira entrada | Identificar a primeira entrada de cada card em cada indicador |
| 4. Filtrar | Mostrar apenas cards cuja primeira entrada foi no período |

## Arquivos a Modificar

### 1. `src/hooks/useO2TaxAnalytics.ts`

**Mudanças:**

```text
1. Modificar queryFn:
   - Buscar movimentos do período (como hoje)
   - Extrair IDs únicos dos cards
   - Buscar histórico completo usando 'query_card_history' na tabela 'pipefy_cards_movements'
   - Retornar { movements, fullHistory }

2. Criar mapa firstEntryByCardAndIndicator:
   - Usar fullHistory para encontrar a PRIMEIRA entrada de cada card em cada indicador
   - Mapeamento: Start form/MQL → leads, MQL → mql, etc.

3. Modificar getDetailItemsForIndicator:
   - Verificar se a primeira entrada do card naquele indicador está no período
   - Se primeira entrada foi em período anterior → NÃO incluir
```

### 2. `src/hooks/useExpansaoAnalytics.ts`

**Mudanças:**

```text
1. Modificar queryFn:
   - Buscar movimentos do período (como hoje)
   - Extrair IDs únicos dos cards
   - Buscar histórico completo usando 'query_card_history' na tabela 'pipefy_cards_movements_expansao'
   - Retornar { movements, fullHistory }

2. Criar mapa firstEntryByCardAndIndicator:
   - Usar fullHistory para encontrar a PRIMEIRA entrada de cada card em cada indicador
   - Mapeamento: Start form → leads, MQL → mql, etc.

3. Modificar getCardsForIndicator:
   - Verificar se a primeira entrada do card naquele indicador está no período
   - Se primeira entrada foi em período anterior → NÃO incluir
```

### 3. `src/components/planning/IndicatorsTab.tsx`

**Mudanças no `getRealizedForIndicator`:**

```text
Linha 811-814 (Modelo Atual sem filtros):
ANTES: total += getModeloAtualQty(indicator.key, startDate, endDate);
DEPOIS: total += modeloAtualAnalytics.getCardsForIndicator(indicator.key).length;

Linha 839-841 (O2 TAX sem filtros):
ANTES: total += getO2TaxQty(indicator.key, startDate, endDate);
DEPOIS: total += o2TaxAnalytics.getDetailItemsForIndicator(indicator.key).length;

Linha 867 (Oxy Hacker sem filtros):
ANTES: total += getOxyHackerQty(indicator.key, startDate, endDate);
DEPOIS: total += oxyHackerAnalytics.getDetailItemsForIndicator(indicator.key).length;

Linha 894 (Franquia sem filtros):
ANTES: total += getExpansaoQty(indicator.key, startDate, endDate);
DEPOIS: total += franquiaAnalytics.getDetailItemsForIndicator(indicator.key).length;
```

## Exemplo de Fluxo (O2 TAX)

```text
Período selecionado: Fevereiro 2026
Card: Exemplo Corp

1. Query período (01/02 - 28/02):
   → Retorna movimento em "Reunião agendada" (05/02)
   → ID do card: 123456

2. Query histórico (card 123456):
   → Retorna:
     - 25/01 "MQL" (primeira MQL!)
     - 05/02 "Reunião agendada" (primeira RM!)
     - 10/02 "Reunião Realizada" (primeira RR!)

3. Construção firstEntryByCardAndIndicator:
   → card[123456][mql] = { data: 25/01 }
   → card[123456][rm] = { data: 05/02 }
   → card[123456][rr] = { data: 10/02 }

4. Filtragem para Fevereiro:
   → MQL: primeira entrada 25/01 → NÃO aparece ✓
   → RM: primeira entrada 05/02 → aparece ✓
   → RR: primeira entrada 10/02 → aparece ✓
```

## Resultado Esperado

- Todos os indicadores (MQL, RM, RR, Proposta, Venda) seguem a mesma regra
- Cards aparecem apenas no período da primeira entrada em cada fase
- Acelerômetros e drill-downs mostram os mesmos valores
- Consistência entre todas as BUs (Modelo Atual, O2 TAX, Oxy Hacker, Franquia)

## Ordem de Implementação

1. `useO2TaxAnalytics.ts` - Adicionar busca de histórico e lógica de primeira entrada
2. `useExpansaoAnalytics.ts` - Adicionar busca de histórico e lógica de primeira entrada
3. `IndicatorsTab.tsx` - Usar `getCardsForIndicator.length` em vez de `getQty` para todas as BUs
