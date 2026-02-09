

# Corrigir contagem de Reunioes Marcadas (175 -> 159)

## Problema

O sistema conta 175 reunioes marcadas em Janeiro enquanto o Pipefy mostra 159. A diferenca de 16 cards vem do mapeamento do indicador `rm`, que inclui 3 fases:

- "Reuniao agendada / Qualificado" (correto)
- "Remarcar Reuniao" (inflando a contagem)
- "Remarcar reuniao / No show" (inflando a contagem)

Cards que tiveram sua primeira reuniao agendada em Dezembro mas remarcaram em Janeiro sao contados como RM de Janeiro pelo sistema, mas nao pelo Pipefy (que usa "First time enter Reuniao agendada / Qualificado").

## Solucao

Remover "Remarcar Reuniao" e "Remarcar reuniao / No show" do mapeamento do indicador `rm`. Essas fases representam reagendamentos de reunioes ja contabilizadas, nao novas reunioes.

## Arquivos a modificar

### 1. `src/hooks/useModeloAtualMetas.ts` (linhas 56-58)

Remover as duas linhas que mapeiam remarcar para `rm`:

```text
ANTES:
  'Reuniao agendada / Qualificado': 'rm',
  'Remarcar Reuniao': 'rm',
  'Remarcar reuniao / No show': 'rm',

DEPOIS:
  'Reuniao agendada / Qualificado': 'rm',
```

### 2. `src/hooks/useModeloAtualAnalytics.ts`

Aplicar a mesma mudanca no mapeamento `PHASE_TO_INDICATOR` -- remover "Remarcar Reuniao" e "Remarcar reuniao / No show" do indicador `rm`.

## Resultado esperado

- Contagem de RM em Janeiro passara de 175 para 159, alinhado com o Pipefy
- Nenhum outro indicador e afetado (leads, mql, rr, proposta, venda permanecem iguais)
- Os cards de remarcacao continuam visiveis no Pipefy e no drill-down de outras fases, apenas nao inflam o numero de reunioes marcadas

