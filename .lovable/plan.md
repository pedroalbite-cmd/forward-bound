

## Investigar e corrigir dados do Dossiê de Churn

### Problema provável
O componente tem todas as 13 colunas implementadas. O problema mais provável é que os dados não estão chegando porque o filtro `Fase Atual === 'Churn'` pode não corresponder ao nome exato da fase no Pipefy.

### Alterações

**1. `src/hooks/useOperationsData.ts`**
- Adicionar log temporário ou ampliar o filtro de churn para incluir variações do nome da fase (ex: "Churn", "Churnou", "Churn - Encerrado")
- Verificar se o campo `Fase Atual` realmente contém "Churn" nos dados brutos
- Atualmente na linha do `processProjects`, o churn count usa: `phaseCount['Churn'] || 0` + `phaseCount['Atividades finalizadas'] || 0` + `phaseCount['Desistência'] || 0`, mas o dossiê só filtra por `'Churn'`
- **Corrigir**: incluir também "Atividades finalizadas" e "Desistência" no filtro do dossiê, ou pelo menos usar o mesmo critério do count de churn

**2. Validação dos dados**
- O filtro `currentPhase` já remove registros onde `Fase !== Fase Atual`, garantindo apenas o estado atual
- Se o problema persistir, pode ser necessário verificar via query direta quais fases existem nos dados

### Arquivo modificado
- `src/hooks/useOperationsData.ts` — ampliar filtro do churnDossier para incluir mesmas fases usadas no count de churn

