# Plano: MQL Conta Apenas no Primeiro Mês (Opção C) ✅ IMPLEMENTADO

## Solução Aplicada

MQLs agora são contados apenas no mês da **primeira qualificação**. O card 1291436814 (A3P Transporte):
- ✅ Em **Janeiro 2026**: aparece com data 31/01 (primeira entrada em "MQLs")
- ✅ Em **Fevereiro 2026**: **não aparece** (já foi contado em Janeiro)

## Mudança Técnica

**`src/hooks/useModeloAtualAnalytics.ts`**:
- Criado `firstMqlEntryByCard`: mapeia cada card à sua primeira entrada em fase MQL (considerando todo o histórico)
- `getCardsForIndicator('mql')`: verifica se a primeira entrada do card está no período selecionado
