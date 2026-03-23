

## Adicionar Cards de Setup com alertas de >90 dias

### Objetivo

Buscar dados da tabela `pipefy_moviment_setup` para mostrar cards que estao em fases ativas de setup e destacar aqueles com mais de 90 dias sem finalizar.

### Implementacao

**1. `src/hooks/useOperationsData.ts`**

- Adicionar interface `SetupCard` com campos: `ID`, `Titulo`, `Fase`, `Fase Atual`, `Entrada`, `Saida`, `Duracao (s)`, `CFO Responsavel`, `Responsavel Implantacao` (ou campo equivalente)
- Adicionar interface `SetupActive` com: `id`, `empresa`, `responsavel`, `faseAtual`, `diasEmSetup`, `atrasado` (boolean, >90 dias)
- Criar funcao `processSetup(rows)`:
  - Filtrar cards na fase atual (Fase === Fase Atual)
  - Identificar fases ativas de setup (ex: "Kickoff", "Implantacao", "Treinamento", etc — preciso verificar os nomes reais das fases)
  - Calcular dias desde entrada
  - Marcar como atrasado se >90 dias
  - Ordenar por dias decrescente
- No `useOperationsData`, adicionar fetch de `pipefy_moviment_setup` no Promise.all
- Retornar `setupAtivos` e `setupAtrasados` (count) nos dados
- Adicionar KPI `emSetup` e `setupAtrasados` ao `OperationsKpis`

**2. `src/components/planning/nps/OperationsSection.tsx`**

- Adicionar KPI card "Em Setup" e "Setup >90d" na grade de KPIs
- Adicionar tabela de "Setup Ativo" similar a tabela de tratativas ativas
- Highlight em vermelho para cards com >90 dias
- Cada linha com link para o card no Pipefy (preciso adicionar o pipe ID de setup ao `PIPEFY_PIPES`)

**3. `src/components/planning/nps/PipefyCardLink.tsx`**

- Adicionar `SETUP: '{pipeId}'` ao `PIPEFY_PIPES` (preciso descobrir o pipe ID — posso inferir dos dados ou usar um placeholder e pedir ao usuario)

### Descoberta necessaria

Preciso verificar quais campos e fases existem na tabela `pipefy_moviment_setup` antes de implementar. Vou buscar uma amostra dos dados para mapear os campos corretos e nomes de fases.

### Arquivos modificados
- `src/hooks/useOperationsData.ts` — nova interface, processamento de setup, fetch adicional
- `src/components/planning/nps/OperationsSection.tsx` — KPIs + tabela de setup ativo
- `src/components/planning/nps/PipefyCardLink.tsx` — adicionar pipe ID de setup

