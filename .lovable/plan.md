

## Plano: Adicionar O2 TAX à atribuição + investigar vendas "(Sem campanha)"

### Parte 1: Adicionar O2 TAX ao `allAttributionCards`

**Problema**: O2 TAX não participa da atribuição de campanhas. Tem 1 venda em fevereiro que está "sumida".

**Desafio**: O `O2TaxCard` não possui campos de marketing (campanha, fonte, fbclid, gclid, etc.) — a tabela `pipefy_cards_movements` do O2 TAX não registra esses dados. Todos os cards O2 TAX entrarão como canal "orgânico" / "(Sem campanha)".

**Outro problema**: O hook `useO2TaxAnalytics` só faz `query_period` (filtra por data de entrada na fase). Se o card entrou no pipeline meses atrás e só assinou em fevereiro, a venda não aparece nos `cards`. Diferente do Modelo Atual, o O2 TAX **não tem query de assinatura** (`query_period_by_signature`).

**Solução (2 passos)**:

1. **`src/hooks/useO2TaxAnalytics.ts`**: Adicionar uma query de `query_period_by_signature` (igual ao Modelo Atual) para capturar vendas assinadas no período mas que entraram antes. Merge com deduplicação por `id|fase`.

2. **`src/components/planning/MarketingIndicatorsTab.tsx`**: Adicionar loop que converte `o2TaxCards` em `AttributionCard[]` e pusha no `allAttributionCards`, mapeando os campos disponíveis (id, titulo, fase, valores) e deixando os campos de marketing como `undefined`.

### Parte 2: Vendas "(Sem campanha)" — 6 vendas sem match

**Situação**: Das 9 vendas mapeadas, 6 aparecem como "(Sem campanha)". O usuário diz que só 2 dessas 6 são corretamente mapeáveis.

**Causa**: Esses cards têm o campo `campanha` vazio/undefined no Pipefy. O matching por nome (`resolveApiCampaign`) não encontra nada porque não há nome para buscar.

**Isso é uma limitação de dados do CRM** — se o Pipefy não registrou a campanha de origem, o sistema não tem como atribuir. As 4 vendas restantes provavelmente são orgânicas/indicação/sem rastreamento.

**Ação**: Sem alteração de código necessária para este ponto. A atribuição está funcionando corretamente — cards sem campo campanha vão para "(Sem campanha)" como esperado.

### Resumo de alterações

| Arquivo | Alteração |
|---|---|
| `src/hooks/useO2TaxAnalytics.ts` | Adicionar query `query_period_by_signature` + merge com dedup `id\|fase` + expor `cards` raw para atribuição |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Adicionar loop O2 TAX no `allAttributionCards` |

