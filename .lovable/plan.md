

## Plano: Remover alerta de custo acima da meta

Remover o bloco de alerta vermelho ("⚠️ ... acima da meta!") do componente `CostPerStageGauges`.

### Implementação

**Arquivo:** `src/components/planning/marketing-indicators/CostPerStageGauges.tsx`

Remover as linhas 108-117 que calculam `stagesAboveGoal` e renderizam o `<div>` de alerta com fundo vermelho. Manter o restante do componente intacto.

