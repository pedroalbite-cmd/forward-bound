
# Plano: Investigar e Corrigir Discrepância de 5 MQLs

## Situação Atual
- **Pipefy**: 73 MQLs em Fevereiro 2026
- **Acelerômetro**: 68 MQLs (ainda faltam 5)
- **Aumento do LIMIT para 50.000**: Já implementado, mas não resolveu

## Próximos Passos de Investigação

### 1. Verificar se os 5 cards estão sendo retornados pela query
Consultar diretamente a Edge Function para confirmar se os cards específicos (IDs: 1291471894, 1291469452, 1291472140, etc.) estão sendo retornados.

### 2. Verificar lógica de qualificação `isMqlQualified`
O hook aplica filtro de faturamento ≥ R$ 200k. Verificar se os 5 cards passam nesse critério.

### 3. Verificar mapeamento de fases
Confirmar se as fases dos 5 cards estão mapeadas corretamente para 'mql' (fases: 'MQLs' ou 'Tentativas de contato').

### 4. Verificar lógica de "primeira entrada"
O sistema só conta cards cuja primeira entrada na fase MQL foi no período selecionado. Verificar se os 5 cards têm movimentações anteriores.

## Arquivos a Analisar
- `src/hooks/useModeloAtualAnalytics.ts` - Lógica de filtragem e contagem
- `src/hooks/useModeloAtualMetas.ts` - Função `isMqlQualified`
- `supabase/functions/query-external-db/index.ts` - Query de dados

## Ação Imediata
Adicionar logging detalhado para rastrear exatamente onde os 5 cards estão sendo filtrados/excluídos.
