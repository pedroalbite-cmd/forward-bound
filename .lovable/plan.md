

## Adicionar Dossiê de Churn com toggle colapsável

### Objetivo
Criar uma seção "Dossiê de Churn" colapsável (igual ao "Resultados NPS") com tabela mostrando todos os cards em fase Churn da `pipefy_central_projetos`, com as mesmas colunas do Pipefy.

### Dados
Os dados já são carregados via `fetchTableData('pipefy_central_projetos')` no `useOperationsData`. Preciso apenas:
1. Expandir a interface `ProjectCard` com os campos de churn que faltam
2. Processar e retornar os cards em fase Churn
3. Exibir na UI

### Colunas da tabela (conforme screenshots)
Mês do Churn | Cliente | Setup (R$) | MRR (R$) | Motivo Principal do Churn | Motivos cancelamento | CFO do projeto | Produto | Fase atual | Data assinatura | Data encerramento | LT (meses) | Problemas com a Oxy

### Alterações

**1. `src/hooks/useOperationsData.ts`**
- Adicionar campos à interface `ProjectCard`: `Mes do Churn`, `Setup (R$)` ou `Valor Setup`, `Motivo Principal do Churn`, `Motivos cancelamento`, `Data de assinatura do contrato`, `Data encerramento`, `LT (meses)`, `Problemas com a Oxy`
- Criar interface `ChurnDossierCard` com os campos normalizados
- Em `processProjects`, filtrar cards com `Fase Atual === 'Churn'` e montar lista de `ChurnDossierCard`
- Retornar `churnDossier` nos dados

**2. `src/components/planning/NpsTab.tsx`**
- Adicionar seção colapsável "Dossiê de Churn" (toggle igual ao NPS) entre Operação e Resultados NPS
- Dentro, renderizar tabela com scroll horizontal e todas as colunas
- Badges coloridos para Motivo Principal (Financeiro, Atendimento, Problema na Oxy, etc.)
- Link Pipefy em cada linha

**3. `src/components/planning/nps/ChurnDossierSection.tsx`** (novo)
- Componente separado com a tabela do dossiê
- Recebe `churnDossier` como prop do `useOperationsData`
- Tabela com scroll, badges, formatação de moeda, link Pipefy

### Arquivos modificados
- `src/hooks/useOperationsData.ts` — interface expandida, processamento de churn dossier
- `src/components/planning/NpsTab.tsx` — nova seção colapsável
- `src/components/planning/nps/ChurnDossierSection.tsx` — novo componente

