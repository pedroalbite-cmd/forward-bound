

## Corrigir "CFOs Ativos: 0" e "Sem CFO" no NPS

### Diagnóstico

Os dados NPS estão carregando corretamente do banco de dados. Todos os scores, distribuições e feedback qualitativo funcionam. O único problema é que a tabela `pipefy_moviment_nps` não tem o campo "CFO Responsavel" preenchido (todos null). Para associar o CFO ao card NPS, é necessário cruzar com `pipefy_central_projetos` via `pipefy_card_connections`.

### Status atual confirmado

**Operação** — 100% funcional com dados reais:
- Clientes Ativos: 129, Em Operação: 124, Onboarding: 5
- Em Tratativa: 14, Churn: 121, MRR Total: R$ 654.745
- Tabela de CFOs, motivos de tratativas e churn — tudo do banco

**NPS** — Funcional exceto CFO:
- NPS: 37 (29 prom, 12 neutros, 10 det) — calculado dos dados reais
- CSAT: 87% — calculado dos dados reais
- Sean Ellis: 12% — calculado dos dados reais
- Feedback qualitativo: 36 elogios, 5 sugestões, 17 críticas, 14 expectativas
- **CFOs Ativos: 0** e tabela mostra só "Sem CFO" — campo vazio na tabela NPS

### Plano de correção

**1. `src/hooks/useNpsData.ts`**
- Além de buscar `pipefy_moviment_nps`, buscar também `pipefy_card_connections` (filtro `connected_pipe_name = '5.2 Pesquisa de Satisfação NPS'`) e `pipefy_central_projetos`
- Cruzar: NPS card ID → `pipefy_card_connections.connected_card_id` → `pipefy_card_connections.card_id` → `pipefy_central_projetos.ID` → pegar "CFO Responsavel"
- Usar esse CFO no cálculo de performance por CFO e no KPI de CFOs ativos

**2. Edge function `query-external-db`**
- Verificar que `pipefy_card_connections` já está na lista de tabelas válidas (deve estar baseado no código existente)

### Arquivos modificados
- `src/hooks/useNpsData.ts` — adicionar fetch de connections + projetos para cruzar CFO

