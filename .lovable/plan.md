

## Corrigir cache de dados diários DRE: re-sincronizar dias recentes

### Problema
A Edge Function `sync-daily-revenue` usa um cache "write-once": se um dia já existe no banco, ele nunca é atualizado. Isso significa que se a sync rodou no dia 15/03, os dias 1-15 de março foram gravados, mas vendas que entraram retroativamente (ex: uma venda no dia 10 registrada depois do dia 15) nunca são capturadas. Os dados ficam "congelados" na primeira sync.

### Solução
Adicionar um parâmetro `forceRefreshDays` na Edge Function que força a re-busca dos últimos N dias, mesmo que já existam no cache. A lógica:

1. **Novo parâmetro `forceRefreshDays`** (default: 7) — sempre re-busca os últimos 7 dias do range, deletando os registros antigos antes do upsert
2. **Dias mais antigos** continuam usando o cache normal (se já existe, não busca de novo)

### Alterações

**Arquivo: `supabase/functions/sync-daily-revenue/index.ts`**

- Aceitar `forceRefreshDays` no body (default 7)
- Calcular a data de corte: `hoje - forceRefreshDays`
- Separar as datas em dois grupos:
  - **Datas "frescas"** (>= corte): sempre re-buscar da API, deletar do banco antes do upsert
  - **Datas "antigas"** (< corte): manter lógica de cache atual (skip se já existe)
- Deletar os registros "frescos" existentes antes de processar
- O upsert final já funciona para ambos os grupos

```
Exemplo: sync de 01/01 a 26/03, forceRefreshDays=7
- Dias 01/01 a 19/03: usa cache (não busca se já existe)
- Dias 20/03 a 26/03: deleta do banco e re-busca da API
```

### Resultado
- Dados dos últimos 7 dias sempre atualizados a cada sync
- Dados históricos continuam cacheados eficientemente
- Sem mudança no frontend — apenas a Edge Function fica mais inteligente

