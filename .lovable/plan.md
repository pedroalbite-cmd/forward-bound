

## Excluir tarefas concluídas/canceladas das "Tarefas Atrasadas"

### Problema
A lista de fases terminais (`ROTINA_TERMINAL_PHASES`) que filtra tarefas ativas no hook `useOperationsData.ts` está incompleta. Fases como **"Concluído"** e **"Cancelada"** não estão incluídas, fazendo com que cards nessas fases ainda apareçam como atrasados (ex: LOGAME, DATWEB).

### Solução
Adicionar as fases faltantes à constante `ROTINA_TERMINAL_PHASES` na linha 471 de `src/hooks/useOperationsData.ts`:

**Antes:**
```ts
const ROTINA_TERMINAL_PHASES = ['Entregue / Concluído', 'Arquivado', 'Arquivo'];
```

**Depois:**
```ts
const ROTINA_TERMINAL_PHASES = [
  'Entregue / Concluído',
  'Concluído',
  'Cancelada',
  'Cancelado',
  'Arquivado',
  'Arquivo',
];
```

### Arquivo alterado
- `src/hooks/useOperationsData.ts` — linha 471 (apenas expandir o array de fases terminais)

### Resultado
Cards em fases de conclusão ou cancelamento serão excluídos da contagem de tarefas ativas e, consequentemente, não aparecerão mais como "atrasadas".

