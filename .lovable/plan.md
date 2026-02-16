
# Fix: 3 cards Oxy Hacker faltando nos MQLs (21 vs 24)

## Problema

O sistema mostra 21 MQLs para Oxy Hacker, mas o Pipefy mostra 24. Os 3 cards faltantes sao:

1. **Cards importados direto em "Contrato assinado"** (ex: Adilson) - so tem movimento para "Contrato assinado" (mapeado para 'venda'), nunca passou por "Start form" ou "Lead"
2. **"One Check"** - so tem movimento para "Reuniao agendada / Qualificado" (mapeado para 'rm'), sem Start form
3. **"Ivan da Silva Soares"** - so tem fase "Tentativas de contato" que NAO esta mapeada para nenhum indicador

## Causa raiz

O `getCardsForIndicator('mql')` so verifica os indicadores `['leads', 'mql']`. Cards que so tem movimentos mapeados para 'rm', 'rr', 'proposta' ou 'venda' nao sao contados como leads/MQLs, mesmo estando no pipe.

Alem disso, a fase "Tentativas de contato" nao tem mapeamento algum, entao o card do Ivan nem entra no mapa de indicadores.

## Solucao

### Arquivo: `src/hooks/useExpansaoAnalytics.ts`

**Alteracao 1** - Adicionar fases faltantes no PHASE_TO_INDICATOR:

```typescript
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  'Start form': 'leads',
  'Lead': 'mql',
  'MQL': 'mql',
  'Tentativas de contato': 'leads',   // NOVO
  'Reunião agendada / Qualificado': 'rm',
  'Reunião Realizada': 'rr',
  'Proposta enviada / Follow Up': 'proposta',
  'Enviar proposta': 'proposta',
  'Enviar para assinatura': 'proposta',
  'Contrato assinado': 'venda',
  'Ganho': 'venda',                    // NOVO
};
```

**Alteracao 2** - Aplicar logica de funil cumulativo para leads/mql: qualquer card com QUALQUER indicador no periodo conta como lead/MQL. No `getCardsForIndicator`, mudar os `indicatorsToCheck` para leads e mql:

```typescript
// Para leads/mql: funil cumulativo - qualquer card no pipe e um lead
const indicatorsToCheck = (indicator === 'leads' || indicator === 'mql')
  ? ['leads', 'mql', 'rm', 'rr', 'proposta', 'venda'] as IndicatorType[]
  : [indicator];
```

Isso garante que cards que entraram direto em "Contrato assinado" (sem passar por Start form) sejam contados como leads/MQLs.

## Resultado esperado

- **Leads Oxy Hacker**: 24 (todos os cards do XLSX)
- **MQLs Oxy Hacker**: 24 (iguais aos leads)
- Cards que so tem fases avancadas (Contrato assinado, RM) agora sao contados
- Franquia tambem se beneficia da mesma correcao
