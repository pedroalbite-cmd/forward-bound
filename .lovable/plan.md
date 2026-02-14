

# Tela de Logs e Historico de Alteracoes do Admin

## Objetivo

Criar uma nova aba "Logs" dentro do Admin que registra automaticamente todas as alteracoes feitas nas metas (monetarias, closer, permissoes) e permite ao admin consultar quando, quem e quantas vezes as metas foram ajustadas.

## O que o admin vera

Uma nova sub-aba "Logs" no Admin com:
- **Resumo no topo**: cards mostrando total de alteracoes no mes, na semana, e por tipo (monetarias, closer, permissoes)
- **Tabela de logs**: lista cronologica com colunas:
  - Data/hora
  - Usuario que fez a alteracao
  - Tipo (Meta Monetaria, Meta Closer, Permissao, Role)
  - Descricao (ex: "Alterou faturamento de Modelo Atual Jan de R$ 1.1M para R$ 1.2M")
  - BU / Mes afetado (quando aplicavel)
- **Filtros**: por tipo de alteracao, por BU, por periodo (data inicio/fim)

## Mudancas tecnicas

### 1. Nova tabela `admin_audit_logs` (migration)

```sql
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  action_type text NOT NULL,        -- 'monetary_meta', 'closer_meta', 'permission', 'role', 'user_create', 'user_delete'
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb, -- detalhes extras (bu, month, old_value, new_value)
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Somente admins podem ler e inserir logs
CREATE POLICY "Admins can read logs"
  ON public.admin_audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index para consultas por data
CREATE INDEX idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON public.admin_audit_logs(action_type);
```

### 2. Hook `useAuditLogs.ts`

- `logAction(actionType, description, metadata)` - insere um log
- `useLogs(filters)` - query com filtros (tipo, periodo, BU)
- `useLogStats()` - contagem de alteracoes por periodo

### 3. Inserir logs nos pontos de alteracao

Adicionar chamada `logAction()` em:
- **`MonetaryMetasTab.tsx`**: ao salvar metas monetarias - registrar BU, mes, valores antigos vs novos
- **`CloserMetasTab.tsx`**: ao salvar percentuais de closer
- **`AdminTab.tsx`**: ao alterar permissoes, roles, criar/deletar usuario
- **`useAdminPermissions.ts`**: nos callbacks `onSuccess` das mutations

### 4. Componente `AdminLogsTab.tsx`

Nova sub-aba no AdminTab com:
- Cards de resumo (total alteracoes este mes, esta semana, por tipo)
- Filtros (tipo, periodo, BU)
- Tabela paginada com os logs
- Badge colorido por tipo de acao

### 5. `AdminTab.tsx` - Adicionar aba "Logs"

Adicionar `TabsTrigger` e `TabsContent` para a nova aba de logs, com icone `History`.

## Fluxo

1. Admin altera meta monetaria do Modelo Atual em Janeiro
2. Ao salvar, o sistema grava: "Alterou faturamento de Modelo Atual Jan de R$ 1.1M para R$ 1.2M"
3. Na aba Logs, o admin ve esse registro com data, hora e seu email
4. Pode filtrar por "Meta Monetaria" e ver quantas vezes ajustou metas no periodo

