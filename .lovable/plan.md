

## Por que só aparece 2026

A query que busca `pipefy_central_projetos` usa `action: 'preview'` com `LIMIT 1000` e **sem ORDER BY**. Como a tabela tem mais de 1000 linhas, o PostgreSQL retorna as primeiras 1000 em ordem interna (geralmente as mais recentes inseridas). Cards de Out/Nov/Dez 2025 ficam de fora.

O mesmo problema pode afetar `pipefy_moviment_tratativas` e `pipefy_moviment_nps` (também limitadas a 1000).

## Solução

Aumentar o limit das tabelas relevantes para o Dossiê de Churn para garantir que cubra dados desde Out/2025.

### Alteração em `src/hooks/useOperationsData.ts`

Na função `useOperationsData()` (linha 529-536), aumentar os limits:

```typescript
const [projetos, tratativas, setup, rotinas, npsRows, clientes, connections] = await Promise.all([
  fetchTableData('pipefy_central_projetos', 5000),   // era 1000
  fetchTableData('pipefy_moviment_tratativas', 5000), // era 1000
  fetchTableData('pipefy_moviment_setup'),
  fetchTableData('pipefy_moviment_rotinas'),
  fetchTableData('pipefy_moviment_nps', 5000),        // era 1000
  fetchTableData('pipefy_db_clientes', 5000),
  fetchTableData('pipefy_card_connections', 5000),
]);
```

Isso garante que todas as linhas (incluindo Oct-Dec 2025) sejam retornadas.

### Arquivo modificado
- `src/hooks/useOperationsData.ts` — 3 linhas alteradas nos limits de fetch

