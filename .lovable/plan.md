
# Igualar MQL a Leads para Franquia e Oxy Hacker

## Contexto

Franquia e Oxy Hacker nao possuem criterio separado de MQL. Os leads chegam pela fase "Start form" no Pipefy e hoje sao contados apenas como "leads". A fase "MQL" raramente (ou nunca) eh usada nesses pipes, resultando em MQL = 0 ou muito baixo.

## O que muda

Para essas duas BUs, todo card contado como Lead sera automaticamente contado tambem como MQL. Isso reflete a realidade operacional: se entrou no pipe, ja eh qualificado.

## Mudancas tecnicas

### Arquivo 1: `src/hooks/useExpansaoMetas.ts` (Franquia)

Na funcao `getQtyForPeriod`, adicionar logica para que quando `indicator === 'mql'`, tambem considere cards da fase `Start form` (alem da fase `MQL` existente). O mesmo para `getValueForPeriod` e `getGroupedData`.

Abordagem: alterar o mapeamento ou a logica de contagem para que o indicador `mql` inclua tanto a fase `MQL` quanto a fase `Start form`.

```
// Antes (linha 28):
'Start form': 'leads',
'MQL': 'mql',

// Depois - adicionar logica especial nos metodos getQtyForPeriod, getValueForPeriod, getGroupedData:
// Quando indicator === 'mql', contar cards de 'Start form' E 'MQL'
```

Concretamente, nos 3 metodos que fazem contagem (getQtyForPeriod, getValueForPeriod, getGroupedData), onde hoje temos:

```
if (movementIndicator === indicator) {
  uniqueCards.add(movement.id);
}
```

Adicionar condicao:

```
if (movementIndicator === indicator) {
  uniqueCards.add(movement.id);
} else if (indicator === 'mql' && movementIndicator === 'leads') {
  // Para Franquia, todo lead eh MQL (sem criterio separado)
  uniqueCards.add(movement.id);
}
```

### Arquivo 2: `src/hooks/useOxyHackerMetas.ts` (Oxy Hacker)

Mesma mudanca: nos metodos de contagem, quando o indicador solicitado for `mql`, incluir tambem os cards da fase `Start form` (mapeada como `leads`).

### Arquivo 3: Metas anuais (dentro dos mesmos hooks)

Ajustar a meta anual de MQL para ser igual a de Leads em ambos os hooks, ja que agora MQL = Leads:

- Franquia: `mql: 432` (igual a leads)
- Oxy Hacker: verificar e igualar ao valor de leads

## Resultado esperado

- O indicador MQL de Franquia e Oxy Hacker passara a exibir o mesmo numero que Leads
- Os graficos de funil mostrarao conversao 100% de Leads para MQL nessas BUs
- O drill-down de MQL listara os mesmos cards do drill-down de Leads
- Nenhuma mudanca nas demais BUs (Modelo Atual e O2 TAX)
