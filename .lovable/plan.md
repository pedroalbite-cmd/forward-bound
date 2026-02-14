

# Logs de Alteracoes de Metas de Vendas

## Objetivo

Registrar automaticamente toda vez que um admin altera numeros de metas (faturamento, ticket medio, percentuais de closer) e mostrar um historico dessas alteracoes para o admin saber quando e quantas vezes precisou ajustar.

## O que o admin vera

Nova sub-aba "Logs" no Admin com:

- **Cards de resumo**: total de ajustes no mes, na semana, por tipo (Monetaria vs Closer)
- **Tabela cronologica** com:
  - Data/hora do ajuste
  - Quem ajustou (email)
  - Tipo: Meta Monetaria ou Meta Closer
  - BU afetada
  - Descricao (ex: "Modelo Atual Jan: faturamento de R$ 1.1M para R$ 1.2M")
- **Filtros**: por tipo, por BU, por periodo

## Mudancas tecnicas

### 1. Nova tabela `admin_audit_logs`

Tabela para armazenar os logs com RLS restrito a admins (leitura e escrita). Indices por data e tipo de acao para consultas rapidas.

Campos: user_id, user_email, action_type ('monetary_meta' ou 'closer_meta'), description, metadata (JSON com bu, month, valores antigos e novos), created_at.

### 2. Hook `useAuditLogs.ts`

- `logAction(actionType, description, metadata)` - grava um log no banco
- `useLogs(filters)` - busca logs com filtros (tipo, BU, periodo) paginados
- `useLogStats()` - contagem de ajustes por semana/mes/tipo para os cards de resumo

### 3. Instrumentar os pontos de salvamento

**`MonetaryMetasTab.tsx`** - no `handleSave`:
- Antes de salvar, comparar valores antigos (do DB) com novos (local)
- Para cada BU/mes que mudou, gravar log: "Modelo Atual Jan: faturamento de R\$ 1.1M para R\$ 1.2M"
- Se o ticket medio mudou, gravar: "Modelo Atual: ticket medio de R\$ 400k para R\$ 450k"

**`CloserMetasTab.tsx`** - no `handleSave`:
- Comparar percentuais antigos com novos
- Para cada closer/mes que mudou, gravar: "Modelo Atual Jan: Pedro de 60% para 70%"

### 4. Componente `AdminLogsTab.tsx`

- Cards de resumo no topo (ajustes esta semana, este mes, por tipo)
- Filtros por tipo (Monetaria/Closer), por BU, por periodo (date pickers)
- Tabela paginada com os logs
- Badges coloridos por tipo (azul = monetaria, verde = closer)
- Botao "Carregar mais" para paginacao

### 5. `AdminTab.tsx` - Adicionar aba

Nova `TabsTrigger` "Logs" com icone History, e `TabsContent` renderizando `AdminLogsTab`.

## Arquivos modificados/criados

- **Criar**: migration SQL para tabela `admin_audit_logs`
- **Criar**: `src/hooks/useAuditLogs.ts`
- **Criar**: `src/components/planning/AdminLogsTab.tsx`
- **Editar**: `src/components/planning/MonetaryMetasTab.tsx` (adicionar log no save)
- **Editar**: `src/components/planning/CloserMetasTab.tsx` (adicionar log no save)
- **Editar**: `src/components/planning/AdminTab.tsx` (adicionar aba Logs)

