

## Backup Completo do Banco de Dados

Levantei todos os dados do banco atual. Aqui está o inventário completo:

### Tabelas e Quantidades

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| profiles | 11 | Perfis de usuários |
| user_roles | 11 | Roles (10 admin, 1 user) |
| user_tab_permissions | 56 | Permissões de abas por usuário |
| monetary_metas | 48 | Metas monetárias por BU/mês |
| closer_metas | 84 | Metas de closers por BU/mês |
| sales_realized | 12 | Vendas realizadas por BU/mês |
| funnel_realized | 666 | Dados de funil sincronizados do Pipefy |
| daily_revenue | 72 | Receita diária (Jan-Mar 2026) |
| mrr_base_monthly | 15 | MRR base mensal (2025 + 2026) |
| cost_stage_metas | 0 | Vazio |
| admin_audit_logs | 28 | Logs de auditoria |
| meta_ads_cache | 78 | Cache de campanhas Meta Ads |

### Plano

1. **Gerar arquivo `database-backup/full-backup.sql`** com todos os dados atualizados de todas as 12 tabelas, incluindo:
   - Schema completo (CREATE TABLE, tipos, constraints, índices)
   - Funções do banco (`has_role`, `handle_new_user`, `update_sales_realized_updated_at`)
   - Políticas RLS de cada tabela
   - INSERTs com ON CONFLICT para todos os registros
   - Ordem correta de dependências

2. **Atualizar os CSVs existentes** em `database-backup/csv/` com os dados atuais (os CSVs antigos têm dados do projeto anterior com emails @oxycapital.com que não existem mais)

3. **Atualizar `database-backup/README.md`** com o inventário atualizado

### Nota importante
- Os dados de `auth.users` (senhas, tokens) **não podem** ser exportados -- os usuários precisarão ser recriados no novo projeto
- A tabela `meta_ads_cache` é cache temporário e pode ser omitida se preferir
- Os UUIDs dos `profiles` dependem dos UUIDs criados no `auth.users` do novo projeto, então o seed precisará ser ajustado após recriar os usuários

