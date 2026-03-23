

## Adicionar coluna "Diagnóstico" ao Dossiê de Churn

### Contexto
O campo `Valor Diagnostico` já existe na interface `ProjectCard` e vem do Pipefy. É um valor pontual (não recorrente como MRR). Precisa ser adicionado à interface do dossiê, ao processamento de dados e à tabela visual.

### Alterações

**1. `src/hooks/useOperationsData.ts`**
- Adicionar `diagnostico: number` na interface `ChurnDossierCard`
- Na construção do objeto (linha 302), adicionar: `diagnostico: parseNumber(card['Valor Diagnostico'])`

**2. `src/components/planning/nps/ChurnDossierSection.tsx`**
- Adicionar coluna "Diagnóstico (R$)" na tabela, após "Setup (R$)" e antes de "MRR (R$)"
- Exibir o valor formatado com `formatCurrency`
- Adicionar o total de diagnóstico perdido nos KPI cards do topo

### Arquivos modificados
- `src/hooks/useOperationsData.ts` — interface + mapeamento
- `src/components/planning/nps/ChurnDossierSection.tsx` — coluna na tabela + KPI

