
# Correcao: Valores Monetarios Zerados (Faturamento, MRR, Setup, Pontual)

## Problema

O hook `useModeloAtualMetas` que calcula os valores monetarios (Faturamento, MRR, Setup, Pontual) tem dois bugs que fazem os valores aparecerem como R$ 0 mesmo com 1 venda registrada:

### Bug 1: Datas enviadas com fuso horario
O hook envia `startDate.toISOString()` ao servidor, que converte para UTC. Quando o usuario seleciona 12/02/2026, a data enviada e `2026-02-12T03:00:00.000Z` (meia-noite BRT = 3AM UTC). Porem, a "Entrada" do card no banco e `2026-02-12T00:06:10.817Z` (antes das 3AM UTC), entao o filtro server-side EXCLUI o registro.

O hook `useModeloAtualAnalytics` (que calcula os volumes) ja resolve isso enviando `2026-02-12T00:00:00.000Z` e `2026-02-12T23:59:59.999Z` (UTC puro baseado em data-only).

### Bug 2: Falta `query_period_by_signature`
O hook `useModeloAtualAnalytics` faz 3 queries paralelas: `query_period`, `query_period_by_creation`, e `query_period_by_signature`. Mas o `useModeloAtualMetas` so faz 2 (falta a query por data de assinatura). Cards cujo "Contrato assinado" foi assinado no periodo mas movido em data diferente nao sao capturados para calculo monetario.

## Solucao

### Arquivo: `src/hooks/useModeloAtualMetas.ts`

**Mudanca 1**: Corrigir as datas enviadas ao servidor para usar UTC puro (igual ao analytics):
- Trocar `startDate?.toISOString()` por `startDateStr + 'T00:00:00.000Z'`
- Trocar `endDate?.toISOString()` por `endDateStr + 'T23:59:59.999Z'`
- Adicionar calculo de `startDateStr` e `endDateStr` extraindo `YYYY-MM-DD` via `.toISOString().split('T')[0]`

**Mudanca 2**: Adicionar terceira query `query_period_by_signature` (paralela com as outras duas):
- Buscar cards cujo campo "Data de assinatura do contrato" esta dentro do periodo
- Mergir esses cards no array `movements`, deduplicando por `id + fase`

Isso garante que o card RM FERNANDEZ (e qualquer outro com situacao similar) apareca no calculo monetario e exiba os R$ 18.000 de Valor Pontual corretamente.

## Resultado Esperado

- Faturamento: R$ 18.000 (era R$ 0)
- Pontual: R$ 18.000 (era R$ 0)
- MRR e Setup: R$ 0 (correto - o card so tem Valor Pontual)
