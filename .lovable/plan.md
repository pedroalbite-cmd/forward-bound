
# Plano: Corrigir Sincronização do Acelerômetro MQL com o Pipefy

## Problema Identificado

Após análise detalhada dos dados, identifiquei que a discrepância de **4 MQLs** (73 no Pipefy vs 69 no acelerômetro) é causada pelo **LIMIT de 10.000 registros** na query `query_period`.

### Evidência:
- A tabela `pipefy_moviment_cfos` tem **44.874 registros totais**
- O período Fevereiro 2026 tem **4.426 registros** (do campo `count_2026` nos stats)
- No entanto, a query `query_period` retorna registros ordenados por data DESC
- Os 3 cards investigados (Fratex, Hospital SIM, Angelus) têm movimentações "MQLs" em 01/02/2026 às primeiras horas da madrugada

### Fluxo do Problema:
```text
1. query_period (LIMIT 10.000) → retorna registros mais recentes primeiro
2. Registros de 01/02/2026 01:36-02:15 (primeira hora) podem ser cortados pelo LIMIT
3. IDs desses cards não são incluídos em uniqueCardIds
4. Portanto, não aparecem no drill-down/acelerômetro
```

## Solução Proposta

Modificar a estratégia de busca para garantir que TODOS os cards do período sejam capturados:

### Opção A: Aumentar o LIMIT (Solução Rápida)
Aumentar o LIMIT de 10.000 para 50.000 no `useModeloAtualAnalytics`.

### Opção B: Buscar IDs Únicos Primeiro (Solução Robusta)
1. Criar uma nova ação `query_period_ids` na Edge Function que retorne apenas IDs únicos no período
2. Modificar o hook para usar essa ação primeiro
3. Depois buscar o histórico completo desses IDs

### Opção C: Paginação (Solução Completa)
Implementar paginação para garantir que todos os registros sejam processados.

## Implementação Recomendada (Opção A - Mais Rápida)

### Arquivo: `src/hooks/useModeloAtualAnalytics.ts`

**Mudança na linha 188:**

```text
ANTES:
limit: 10000

DEPOIS:
limit: 50000
```

### Impacto:
- Garantirá que todos os ~4.500 registros de Fevereiro sejam capturados
- Pequeno aumento no tempo de carregamento (dados maiores)
- Solução imediata enquanto uma estratégia mais robusta é planejada

## Verificação Adicional

Os 3 cards específicos foram verificados e confirmados:
- **Fratex (1291471894)**: Fase "MQLs", Entrada 01/02/2026 02:10:58, Faixa "Entre R$ 1 milhão e R$ 5 milhões" ✅
- **Hospital SIM (1291469452)**: Fase "MQLs", Entrada 01/02/2026 01:36:06, Faixa "Entre R$ 1 milhão e R$ 5 milhões" ✅
- **Angelus Logística (1291472140)**: Fase "MQLs", Entrada 01/02/2026 02:15:15, Faixa "Entre R$ 500 mil e R$ 1 milhão" ✅

Todos qualificam como MQL e sua primeira entrada foi em Fevereiro 2026.

## Resultado Esperado

Após aumentar o LIMIT:
- **Acelerômetro**: 73 MQLs (batendo com o Pipefy)
- **Drill-down**: 73 MQLs (lista completa)

## Detalhes Técnicos

A tabela `pipefy_moviment_cfos` armazena cada movimentação de fase como um registro separado. Para Fevereiro 2026:
- Total de movimentações: ~4.426
- A query ordena por `Entrada DESC`
- O LIMIT de 10.000 é suficiente, mas pode haver edge cases com muitas movimentações

A solução aumenta a margem de segurança para 50.000 registros, cobrindo cenários de períodos mais longos ou com mais atividade.
