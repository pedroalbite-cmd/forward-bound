

## Plano: Corrigir case-sensitivity no motivo "Email/Telefone Inválido"

### Problema identificado

O valor no banco de dados do Pipefy é `"Email/Telefone Inválido"` (com **I** maiúsculo), mas o código tem `'Email/Telefone inválido'` (com **i** minúsculo). A comparação é case-sensitive (`Array.includes`), então o filtro nunca faz match.

Exemplo real encontrado: lead **"Esther"** (ID 1311732963), criado em 07/03/2026, fase atual "Perdido", motivo `"Email/Telefone Inválido"` — este lead **não está sendo excluído** da contagem de MQLs.

### Alteração

Em `src/hooks/useModeloAtualMetas.ts`, linha 48, corrigir o valor para corresponder exatamente ao que vem do Pipefy:

```typescript
'Email/Telefone Inválido',  // era 'Email/Telefone inválido'
```

Adicionalmente, para evitar problemas futuros de case-sensitivity, tornar a comparação case-insensitive na função `isMqlExcludedByLoss` (linha 52-55):

```typescript
export function isMqlExcludedByLoss(faseAtual?: string, motivoPerda?: string): boolean {
  if (!faseAtual || !motivoPerda) return false;
  const normalizado = motivoPerda.trim().toLowerCase();
  return faseAtual === 'Perdido' && MQL_EXCLUDED_LOSS_REASONS.some(r => r.toLowerCase() === normalizado);
}
```

