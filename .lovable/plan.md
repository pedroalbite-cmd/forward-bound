

## Corrigir exclusão de MQLs por motivo de perda

### Arquivo: `src/hooks/useModeloAtualMetas.ts`

Alterar a função `isMqlExcludedByLoss` para remover a exigência de `faseAtual === 'Perdido'`. Basta checar se `motivoPerda` está na lista de exclusão:

```typescript
export function isMqlExcludedByLoss(faseAtual?: string, motivoPerda?: string): boolean {
  if (!motivoPerda) return false;
  const normalizado = motivoPerda.trim().toLowerCase();
  return MQL_EXCLUDED_LOSS_REASONS.some(r => r.toLowerCase() === normalizado);
}
```

Nenhum outro arquivo precisa ser alterado.

