

# Fix: Leads do Oxy Hacker nao aparecem como MQLs no drill-down

## Problema identificado

O XLSX do Pipefy mostra **6 leads Oxy Hacker** em fevereiro de 2026, mas o dashboard mostra apenas **1 MQL**. O log confirma: `getCardsForIndicator(mql): 1 cards`.

### Causa raiz

No `useExpansaoAnalytics.ts`, o mapeamento `PHASE_TO_INDICATOR` tem:

```
'Start form': 'leads'
'Lead': 'leads'     <-- PROBLEMA: mesmo indicador que Start form
'MQL': 'mql'
```

O sistema usa logica de "First Entry" por indicador: para cada card, guarda a entrada MAIS ANTIGA por indicador. Quando um card passa por `Start form -> Lead`, ambas as fases mapeiam para o indicador `'leads'`. O sistema guarda apenas o `Start form` (mais antigo).

Na hora de contar MQLs, o codigo verifica os indicadores `['leads', 'mql']` mas **exclui** entradas com fase `'Start form'` (linha 289). Como a primeira entrada do indicador `'leads'` e `Start form`, ela e excluida. A entrada `Lead` ja foi sobrescrita e nao existe mais no mapa.

**Resultado**: Cards que passaram por `Start form -> Lead` nao aparecem como MQL.

### Fase "Enviar proposta" faltando

O XLSX mostra um card na fase "Enviar proposta", mas o mapeamento so tem "Proposta enviada / Follow Up" e "Enviar para assinatura". Essa fase precisa ser adicionada para capturar propostas corretamente.

## Solucao

### Arquivo: `src/hooks/useExpansaoAnalytics.ts`

**Alteracao 1** - Mudar o mapeamento de `'Lead'` de `'leads'` para `'mql'` (linha 39):

```typescript
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  'Start form': 'leads',
  'Lead': 'mql',           // Antes: 'leads' -> agora 'mql'
  'MQL': 'mql',
  'Reunião agendada / Qualificado': 'rm',
  'Reunião Realizada': 'rr',
  'Proposta enviada / Follow Up': 'proposta',
  'Enviar proposta': 'proposta',   // NOVO: fase do pipe de expansao
  'Enviar para assinatura': 'proposta',
  'Contrato assinado': 'venda',
};
```

**Por que funciona**: O indicador Leads ja faz uniao de `['leads', 'mql']`, entao `Lead` continuara contando como Lead. Para MQL, agora `Lead` tera seu proprio slot no mapa de first entries (indicador `'mql'`), separado do `Start form` (indicador `'leads'`). O filtro de exclusao so remove `Start form`, entao `Lead` sera incluido.

### Arquivo: `src/hooks/useOxyHackerMetas.ts`

**Alteracao 2** - Mesmo ajuste no mapeamento (linha 29) + adicionar "Enviar proposta":

```typescript
const PHASE_TO_INDICATOR: Record<string, OxyHackerIndicator> = {
  'Start form': 'leads',
  'Lead': 'mql',           // Antes: 'leads'
  'MQL': 'mql',
  'Reunião agendada / Qualificado': 'rm',
  'Reunião Realizada': 'rr',
  'Proposta enviada / Follow Up': 'proposta',
  'Enviar proposta': 'proposta',   // NOVO
  'Enviar para assinatura': 'proposta',
  'Contrato assinado': 'venda',
};
```

Tambem ajustar a logica de `getQtyForPeriod` (linhas 186-189) para que o indicador `leads` tambem capture `'Lead'` e `'MQL'` (ja que agora esses nao mapeiam mais para `'leads'`):

```typescript
// Para leads: capturar 'leads' E 'mql' (pois 'Lead' agora e 'mql')
if (movementIndicator === 'leads' || movementIndicator === 'mql') {
  uniqueCards.add(movement.id);
}
```

## Resultado esperado

- **Leads Oxy Hacker**: 6 (todos os cards que entraram em Start form, Lead ou MQL)
- **MQLs Oxy Hacker**: 6 (todos que entraram em Lead ou MQL, excluindo apenas Start form)
- **Propostas**: Cards na fase "Enviar proposta" serao capturados corretamente
- Franquia nao e afetada (usa o mesmo hook com os mesmos mapeamentos)

