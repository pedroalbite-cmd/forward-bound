

## Corrigir fontes de dados do Dossiê de Churn

### Problema
O dossiê puxa todos os campos do `pipefy_central_projetos`, mas na prática vários campos estão vazios nessa tabela. Os dados reais vêm de outras fontes:

| Campo | Fonte correta |
|-------|--------------|
| Mês do Churn | Mês da `Entrada` na tratativa |
| Motivo Principal | `Motivo` da tratativa |
| Motivos cancelamento | `Motivo Churn` da tratativa |
| Data encerramento | `Saída` da tratativa |
| Data de assinatura | Card conectado via `pipefy_card_connections` |
| LT (meses) | Calculado: data encerramento - data assinatura |
| Problemas com a Oxy | Comentários/feedback do NPS |

### Alterações

**1. `src/hooks/useOperationsData.ts`**

- Buscar `pipefy_card_connections` e `pipefy_moviment_nps` no `Promise.all` (2 fetches adicionais)
- Alterar `processProjects` para receber `tratativas`, `npsRows` e `connections` como parâmetros
- Construir mapa `título → tratativa` cruzando por nome do cliente:
  - `Entrada` (mês) → mês do churn
  - `Motivo` → motivo principal
  - `Motivo Churn` → motivos cancelamento
  - `Saída` → data encerramento
- Construir mapa de data de assinatura via `pipefy_card_connections` (card_id do projeto → connected_card com data)
- Construir mapa `título → problemas` via NPS (usar `Comentarios` ou `Motivo da Nota` dos detratores)
- Calcular LT em meses: `(dataEncerramento - dataAssinatura) / 30`
- Usar campos do central_projetos como fallback quando os cruzamentos não retornarem dados

**2. Interface `TratativaCard`**
- Já tem todos os campos necessários (`Motivo`, `Motivo Churn`, `Entrada`, `Saída`)

**3. Sem alterações no componente UI**
- `ChurnDossierSection.tsx` já exibe todas as 13 colunas — só os dados vão mudar

### Arquivos modificados
- `src/hooks/useOperationsData.ts` — cross-reference com tratativas, NPS e connections

