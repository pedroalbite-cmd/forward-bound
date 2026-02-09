

# Corrigir contagem de Propostas Enviadas (134 -> 95)

## Problema

O sistema conta 134 propostas em Janeiro enquanto o Pipefy mostra 95. A diferenca de 39 cards vem de duas fontes:

### Causa 1: Fase "Enviar proposta" inflando contagem
O mapeamento inclui duas fases para o indicador `proposta`:
- "Proposta enviada / Follow Up" (correto - proposta efetivamente enviada)
- "Enviar proposta" (incorreto - fase intermediaria ANTES do envio, nao deve contar)

O Pipefy so rastreia "First time enter Proposta enviada / Follow Up". Cards que estao em "Enviar proposta" (etapa preparatoria) nao devem ser contados como propostas enviadas.

### Causa 2: Re-entradas no periodo
O sistema usa `query_period` que busca movimentacoes com `Entrada` em Janeiro. Cards que entraram em "Proposta enviada / Follow Up" pela primeira vez em Dezembro e re-entraram em Janeiro sao contados pelo sistema, mas nao pelo Pipefy (que usa "First time enter").

Como o `query_period` so tem dados de Janeiro, o sistema nao consegue saber que a primeira entrada foi em outro mes. A deduplicacao por card ID funciona dentro do dataset, mas nao tem a informacao historica para filtrar re-entradas.

## Solucao

### Mudanca 1: Remover "Enviar proposta" do mapeamento

Nos dois hooks, remover a fase "Enviar proposta" do indicador `proposta`:

**Arquivo: `src/hooks/useModeloAtualMetas.ts`**
```text
ANTES:
  'Proposta enviada / Follow Up': 'proposta',
  'Enviar proposta': 'proposta',

DEPOIS:
  'Proposta enviada / Follow Up': 'proposta',
```

**Arquivo: `src/hooks/useModeloAtualAnalytics.ts`**
Mesma mudanca no `PHASE_TO_INDICATOR`.

### Mudanca 2: Filtrar re-entradas usando historico

Para eliminar cards que re-entraram em Janeiro mas cuja primeira entrada foi em outro mes, adicionar uma query historica especifica para propostas. O sistema ja faz `query_card_history` no analytics; no metas, precisamos de uma abordagem mais leve.

**Abordagem**: No `useModeloAtualMetas`, apos coletar os card IDs de proposta, buscar o historico desses cards especificos e manter apenas aqueles cuja PRIMEIRA entrada em "Proposta enviada / Follow Up" esta dentro do periodo selecionado.

**Arquivo: `src/hooks/useModeloAtualMetas.ts`**
- Na funcao `getQtyForPeriod`, quando `indicator === 'proposta'`:
  1. Coletar os card IDs candidatos (como ja faz)
  2. Buscar historico desses cards via `query_card_history`
  3. Para cada card, verificar se a primeira entrada em "Proposta enviada / Follow Up" esta no periodo
  4. Retornar apenas os cards que passam nesse filtro

Como isso requer uma chamada async dentro de `getQtyForPeriod` (que hoje e sincrono), a alternativa mais simples e:
- Buscar o historico de propostas durante o fetch inicial (junto com `query_period` e `query_period_by_creation`)
- Filtrar no momento do parsing, antes de adicionar ao array `movements`

**Implementacao concreta**:
- Adicionar um terceiro request paralelo no fetch: buscar todos os cards que ALGUMA VEZ entraram em "Proposta enviada / Follow Up" e estao no dataset
- Usar a logica de "first entry" para filtrar

Na verdade, a abordagem mais simples e eficiente: mudar a action da query para propostas de `query_period` (filtra por `Entrada`) para uma nova logica que filtra pela PRIMEIRA entrada na fase. Como isso exigiria mudancas no backend, a alternativa e:

**Solucao simplificada**: Apos remover "Enviar proposta", verificar se a contagem se aproxima de 95. Se ainda houver discrepancia significativa (re-entradas), implementar o filtro historico como segundo passo.

## Arquivos a modificar

### 1. `src/hooks/useModeloAtualMetas.ts`
- Remover `'Enviar proposta': 'proposta'` do mapeamento PHASE_TO_INDICATOR

### 2. `src/hooks/useModeloAtualAnalytics.ts`
- Remover `'Enviar proposta': 'proposta'` do mapeamento PHASE_TO_INDICATOR

## Resultado esperado

- A contagem de propostas diminuira significativamente (removendo cards em fase preparatoria)
- Apos verificacao, se ainda houver discrepancia por re-entradas, implementaremos o filtro historico como segundo passo
- Nenhum outro indicador e afetado

