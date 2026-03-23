

## Corrigir "Data de encerramento" no Dossiê de Churn

### Causa raiz
Na linha 290, o código usa `trat?.['Saída']` para pegar a data de encerramento. Porém, o `trat` é o registro da **fase atual** da tratativa (filtrado por `Fase === Fase Atual` na linha 267). Para tratativas finalizadas (fase "Tratativa finalizada" ou "Arquivado"), o campo `Saída` é `null` porque o card ainda está nessa fase.

A data de encerramento correta é a **`Entrada`** na fase terminal — ou seja, quando o card entrou em "Tratativa finalizada".

### Alteração em `src/hooks/useOperationsData.ts`

**Linha 290** — trocar a lógica de `dataEncerramento`:

```typescript
// ANTES:
const dataEncerramento = trat?.['Saída'] 
  ? new Date(trat['Saída']).toISOString().split('T')[0] 
  : (card['Data encerramento'] || '');

// DEPOIS:
const dataEncerramento = trat?.['Saída'] 
  ? new Date(trat['Saída']).toISOString().split('T')[0] 
  : trat?.['Entrada'] 
    ? new Date(trat['Entrada']).toISOString().split('T')[0] 
    : (card['Data encerramento'] || '');
```

Lógica: se `Saída` existe, usa ela. Senão, usa `Entrada` da fase atual (que é quando o card entrou na fase terminal). Fallback para o campo do projeto.

### Arquivo modificado
- `src/hooks/useOperationsData.ts` — uma linha alterada

