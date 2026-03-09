

## Plano: Adicionar "Email/Telefone inválido" à lista de exclusão de MQLs

### Alteração

Adicionar `'Email/Telefone inválido'` ao array `MQL_EXCLUDED_LOSS_REASONS` em `src/hooks/useModeloAtualMetas.ts` (linha 47).

Nenhuma outra alteração necessária — a função `isMqlExcludedByLoss` já é usada em todos os pontos de contagem de MQLs do Modelo Atual.

