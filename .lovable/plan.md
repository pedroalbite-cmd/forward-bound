

## Agendar sync automática de faturamento DRE a cada 12 horas

### O que será feito
Criar um cron job no banco de dados usando `pg_cron` + `pg_net` que chama a Edge Function `sync-daily-revenue` automaticamente a cada 12 horas (00:00 e 12:00 UTC), enviando como parâmetros o primeiro e último dia do mês corrente, com `source: 'dre'` e `forceRefreshDays` alto o suficiente para cobrir o mês inteiro (~31 dias).

### Alterações

1. **Habilitar extensões `pg_cron` e `pg_net`** no banco (via SQL)

2. **Criar o cron job** via SQL (não migration, pois contém dados específicos do projeto):
   - Schedule: `0 0,12 * * *` (meia-noite e meio-dia UTC)
   - Chama `sync-daily-revenue` via `net.http_post` com body dinâmico que calcula `startDate` = primeiro dia do mês atual e `endDate` = hoje, `source = 'dre'`, `forceRefreshDays = 31`
   - Isso garante que **todos os dias do mês corrente** sejam re-sincronizados a cada execução

3. **Ajustar a Edge Function** para aceitar chamadas sem body JSON (quando `forceRefreshDays=31`, todos os dias do mês são tratados como "frescos" e re-buscados da API)

### Detalhes técnicos

```sql
-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cron: a cada 12h, sync do mês atual inteiro
SELECT cron.schedule(
  'sync-daily-revenue-dre-12h',
  '0 0,12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dgwmwmofyaxstykwuzxh.supabase.co/functions/v1/sync-daily-revenue',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := jsonb_build_object(
      'startDate', to_char(date_trunc('month', now()), 'YYYY-MM-DD'),
      'endDate', to_char(now(), 'YYYY-MM-DD'),
      'source', 'dre',
      'forceRefreshDays', 31
    )
  );
  $$
);
```

Com `forceRefreshDays=31`, todos os dias do mês serão deletados do cache e re-buscados da API DRE, garantindo que vendas retroativas sejam sempre capturadas.

