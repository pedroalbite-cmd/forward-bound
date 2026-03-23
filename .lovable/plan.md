

## Adicionar 4 novas métricas ao dashboard de Operações

### 1. Tempo Médio de Setup por ERP

**Lógica**: Dos cards de setup que chegaram a "Concluído", calcular duração total (primeira entrada até saída do Concluído). Cruzar com `pipefy_central_projetos` pelo título para obter o campo `ERP`. Agrupar por ERP e calcular média em dias.

**Dados**: `pipefy_moviment_setup` (todas as linhas, não só fase atual) + `pipefy_central_projetos` (campo ERP).

**UI**: Card com gráfico de barras horizontal — ERP no eixo Y, dias médios no X.

### 2. Taxa de Entrega por CFO

**Lógica**: Das rotinas ativas por CFO (já calculado em `processRotinas`), calcular `taxaEntrega = (totalAtivas - atrasadas) / totalAtivas * 100`. Adicionar coluna "Taxa Entrega" na tabela existente de "Tarefas por CFO".

**UI**: Nova coluna na tabela existente com badge colorido (verde ≥80%, amarelo ≥60%, vermelho <60%).

### 3. Taxa de Churn e Retenção

**Lógica**: Do `processProjects`, já temos `emOperacao + emOnboarding` (ativos) e `churn` (churned). Taxa churn = churn / (ativos + churn). Retenção = 1 - churn rate. Também calcular MRR em risco (MRR dos clientes em tratativa).

**UI**: 3 KPI cards adicionais — Taxa de Retenção (%), Taxa de Churn (%), MRR em Risco (R$).

### 4. Satisfação do Cliente nas Tratativas

**Lógica**: Do `pipefy_moviment_tratativas`, nas tratativas finalizadas que têm `Satisfacao do Cliente`, agrupar por nota/resposta e contar. Calcular média ou distribuição.

**UI**: Card com distribuição de satisfação (barras ou pie chart).

### Arquivos modificados

- `src/hooks/useOperationsData.ts`
  - Alterar `processSetup` para calcular duração dos concluídos e cruzar ERP com projetos
  - Adicionar `taxaEntrega` ao `CfoTaskSummary`
  - Adicionar `churnRate`, `retencaoRate`, `mrrEmRisco` aos KPIs
  - Processar satisfação das tratativas finalizadas
  - Exportar novas interfaces (`SetupByErp`, `SatisfacaoDistribution`)

- `src/components/planning/nps/OperationsSection.tsx`
  - Adicionar KPIs de churn/retenção/MRR em risco
  - Adicionar coluna "Taxa Entrega" na tabela de tarefas por CFO
  - Adicionar card "Tempo Médio de Setup por ERP" (bar chart)
  - Adicionar card "Satisfação — Tratativas" (bar chart)

