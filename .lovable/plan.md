

## Corrigir URLs do Pipefy (404)

### Problema

A URL montada como `https://app.pipefy.com/pipes/{pipeId}/cards/{cardId}` nao existe no Pipefy. O formato correto para abrir um card diretamente e:

```
https://app.pipefy.com/pipes/{pipeId}#cards/{cardId}
```

### Correcao

**Arquivo**: `src/components/planning/nps/PipefyCardLink.tsx`

Alterar a linha que monta a URL de:
```typescript
const url = `https://app.pipefy.com/pipes/${pipeId}/cards/${cardId}`;
```
Para:
```typescript
const url = `https://app.pipefy.com/pipes/${pipeId}#cards/${cardId}`;
```

Apenas 1 caractere muda (`/cards` vira `#cards`). Todos os links existentes (Central de Projetos, Tratativas, NPS) serao corrigidos automaticamente.

### Arquivos modificados
- `src/components/planning/nps/PipefyCardLink.tsx` — corrigir formato da URL

