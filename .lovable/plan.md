

## Adicionar Gestão de Tarefas por CFO com drill-down de atrasadas

### Objetivo

Buscar dados de `pipefy_moviment_rotinas` para mostrar por CFO a quantidade de tarefas ativas e atrasadas. Ao clicar num CFO, abrir sheet com a lista de tarefas atrasadas dele.

### Dados descobertos

- **Tabela**: `pipefy_moviment_rotinas` (já autorizada no `query-external-db`)
- **Pipe ID**: `306755752` ("Gestão de Rotinas (CFO)")
- **Campos relevantes**: `CFO Responsavel`, `Overdue` (boolean), `Data Prevista Entrega`, `Fase`/`Fase Atual`, `Tipo de Entrega`, `Título`, `Mes Referencia`
- **Fase terminal**: `"Entregue / Concluído"` — tarefas nesta fase não são ativas

### Implementação

**1. `src/hooks/useOperationsData.ts`**

- Adicionar interface `RotinaCard` com campos da tabela
- Adicionar interface `CfoTaskSummary`: `{ cfo, totalAtivas, atrasadas, tarefas: RotinaAtrasada[] }`
- Criar função `processRotinas(rows)`:
  - Filtrar cards na fase atual (`Fase === Fase Atual`)
  - Excluir fases terminais ("Entregue / Concluído", "Arquivado")
  - Agrupar por `CFO Responsavel`
  - Contar total de tarefas ativas e quantas têm `Overdue === true` ou `Data Prevista Entrega < now()`
  - Guardar lista de tarefas atrasadas para drill-down
- Adicionar fetch de `pipefy_moviment_rotinas` no `Promise.all` existente
- Retornar `cfoTaskSummary` nos dados e KPI `tarefasAtrasadasTotal`

**2. `src/components/planning/nps/OperationsSection.tsx`**

- Adicionar KPI card "Tarefas Atrasadas" na grade
- Adicionar card/tabela "Tarefas por CFO" com colunas: CFO, Ativas, Atrasadas
- Linha clicável → abre Sheet com lista das tarefas atrasadas daquele CFO (empresa, tipo de entrega, data prevista, dias de atraso, link Pipefy)

**3. `src/components/planning/nps/PipefyCardLink.tsx`**

- Adicionar `ROTINAS: '306755752'` ao `PIPEFY_PIPES`

### Arquivos modificados
- `src/hooks/useOperationsData.ts` — interfaces, processamento, fetch
- `src/components/planning/nps/OperationsSection.tsx` — KPI + tabela CFO + sheet drill-down
- `src/components/planning/nps/PipefyCardLink.tsx` — pipe ID de rotinas

