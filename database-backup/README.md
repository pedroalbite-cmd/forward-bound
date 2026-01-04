# Database Backup - Planning 2026

**Data de Exportação:** 2025-01-04

## Estrutura do Backup

```
database-backup/
├── csv/
│   ├── profiles.csv          # Perfis de usuários
│   ├── user_roles.csv        # Roles (admin/user)
│   ├── user_tab_permissions.csv  # Permissões de abas
│   └── sales_realized.csv    # Vendas realizadas
├── seed.sql                  # Script SQL para reimportação
└── README.md                 # Este arquivo
```

## Resumo dos Dados

| Tabela | Registros |
|--------|-----------|
| profiles | 5 |
| user_roles | 5 |
| user_tab_permissions | 17 |
| sales_realized | 12 |

## Usuários

| Email | Nome | Role |
|-------|------|------|
| admin@oxycapital.com | Administrador | admin |
| bruno@oxycapital.com | Bruno Duarte | admin |
| almir@oxycapital.com | Almir | user |
| jose@oxycapital.com | Jose Neto | user |
| bruna@oxycapital.com | Bruna Eduarda | user |

## Como Usar os CSVs

### Importação Manual
1. Acesse o painel do Supabase/Lovable Cloud
2. Vá em Table Editor
3. Selecione a tabela desejada
4. Use a opção "Import CSV"
5. Selecione o arquivo correspondente

### Ordem de Importação (Importante!)
1. **profiles** - Primeiro (base)
2. **user_roles** - Segundo (depende de profiles)
3. **user_tab_permissions** - Terceiro (depende de profiles)
4. **sales_realized** - Último (independente)

## Como Usar o Seed SQL

### Pré-requisitos
1. Criar as tabelas no novo projeto (usar as migrations)
2. Criar os usuários no Supabase Auth com os mesmos emails
3. Os IDs dos usuários no Auth devem corresponder aos IDs no seed

### Execução
```bash
# Via psql
psql -h <host> -U postgres -d postgres -f seed.sql

# Ou copie o conteúdo e execute no SQL Editor do Supabase
```

### Alternativa: Criar Usuários Primeiro
Se estiver migrando para um novo projeto:

1. Use a função admin do Supabase para criar os usuários
2. Anote os novos UUIDs gerados
3. Atualize os UUIDs no seed.sql antes de executar

## Estrutura das Tabelas

### profiles
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### user_roles
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### user_tab_permissions
```sql
CREATE TABLE public.user_tab_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tab_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### sales_realized
```sql
CREATE TABLE public.sales_realized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bu TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER DEFAULT 2026,
  value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Abas Disponíveis (tab_keys)

- `contexto-2025` - Contexto 2025
- `metas-2026` - Metas 2026
- `metas-de-vendas` - Metas de Vendas
- `receita-mensal` - Receita Mensal
- `investimento-midia` - Investimento em Mídia
- `plano-de-marketing` - Plano de Marketing
- `estrutura` - Estrutura

## Business Units (BUs)

- `expansao` - Expansão O2
- `reativacao` - Reativação
- `hunter` - Hunter
- `inbound` - Inbound

## Notas Importantes

⚠️ **Senhas não incluídas**: Por segurança, as senhas dos usuários NÃO estão incluídas neste backup. Os usuários precisarão redefinir suas senhas no novo sistema.

⚠️ **UUIDs**: Os IDs são específicos para este projeto. Se importar em outro projeto, pode ser necessário ajustar os UUIDs para corresponder aos novos usuários criados.

⚠️ **RLS Policies**: Lembre-se de configurar as políticas de Row Level Security no novo projeto.
