

## Corrigir filtro de fases terminais do Setup

### Problema

Cards com fase "Arquivo" ainda aparecem na tabela de Setup Ativo. O filtro atual só exclui "Arquivado", mas a fase real nos dados pode ser "Arquivo".

### Correção

**Arquivo**: `src/hooks/useOperationsData.ts` (linha 219)

Adicionar `'Arquivo'` à lista de fases terminais:

```typescript
const SETUP_TERMINAL_PHASES = ['Concluído', 'Churnou', 'Desistência', 'Arquivado', 'Arquivo'];
```

### Arquivos modificados
- `src/hooks/useOperationsData.ts` — adicionar "Arquivo" às fases terminais

