

## Exportar Schema SQL Completo para Migração

### Situação atual
O arquivo `database-backup/full-backup.sql` já contém quase tudo, mas está **desatualizado** — foi gerado em 16/03 e faltam as colunas adicionadas em 24/03 na tabela `daily_revenue` (`caas`, `saas`, `expansao`, `tax`, `source`).

### Plano
Gerar um arquivo SQL atualizado em `/mnt/documents/` com:

1. **Enum types** (`app_role`)
2. **Todas as 12 tabelas** com schema atual completo (incluindo colunas `caas`, `saas`, `expansao`, `tax`, `source` em `daily_revenue`)
3. **Funções** (`has_role`, `handle_new_user`, `update_sales_realized_updated_at`, `save_redistribution_session`, `rollback_redistribution_session`)
4. **Trigger instructions** (handle_new_user on auth.users)
5. **RLS Enable + todas as policies**
6. **Constraints** (`daily_revenue_date_source_key UNIQUE`)
7. **Dados** de configuração (profiles, user_roles, user_tab_permissions, monetary_metas, closer_metas, sales_realized, mrr_base_monthly) — com nota para atualizar UUIDs

O arquivo será gerado via script combinando o `full-backup.sql` existente com as migrações mais recentes, produzindo um SQL completo e pronto para executar no SQL Editor de um novo projeto Supabase.

### Saída
`/mnt/documents/full-schema-export-2026-03-30.sql` — arquivo SQL único para migração.

