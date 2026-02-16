
# Fix: MQL Oxy Hacker mostrando 27 em vez de 24

## Problema

A logica cumulativa adicionada na ultima alteracao verifica TODOS os indicadores (leads, mql, rm, rr, proposta, venda) para contar leads/MQLs. Isso faz com que cards que entraram como lead em janeiro, mas tiveram um movimento de RM ou Proposta em fevereiro, sejam contados novamente como lead/MQL em fevereiro.

Resultado: 3 cards extras que ja foram contados em meses anteriores estao aparecendo novamente.

## Solucao

### Arquivo: `src/hooks/useExpansaoAnalytics.ts`

Alterar a logica dentro do loop de `getCardsForIndicator` para que, ao verificar indicadores avancados (rm, rr, proposta, venda), so inclua o card se ele NAO tem nenhuma entrada 'leads' ou 'mql' no historico. Se ele tem, significa que ja foi contado no periodo correto e nao deve ser puxado via indicador avancado.

**Antes** (linhas 282-301):
```typescript
const indicatorsToCheck = (indicator === 'leads' || indicator === 'mql')
  ? ['leads', 'mql', 'rm', 'rr', 'proposta', 'venda'] as IndicatorType[]
  : [indicator];

for (const ind of indicatorsToCheck) {
  for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
    const firstEntry = indicatorMap.get(ind);
    if (!firstEntry) continue;
    const entryTime = firstEntry.dataEntrada.getTime();
    if (entryTime >= startTime && entryTime <= endTime) {
      const existing = uniqueCards.get(cardId);
      if (!existing || firstEntry.dataEntrada < existing.dataEntrada) {
        uniqueCards.set(cardId, firstEntry);
      }
    }
  }
}
```

**Depois**:
```typescript
const isLeadOrMql = indicator === 'leads' || indicator === 'mql';
const indicatorsToCheck = isLeadOrMql
  ? ['leads', 'mql', 'rm', 'rr', 'proposta', 'venda'] as IndicatorType[]
  : [indicator];

for (const ind of indicatorsToCheck) {
  const isAdvancedIndicator = ind !== 'leads' && ind !== 'mql';

  for (const [cardId, indicatorMap] of firstEntryByCardAndIndicator.entries()) {
    // Para indicadores avancados no contexto leads/mql:
    // so incluir se o card NAO tem entrada 'leads' nem 'mql' no historico
    // (ou seja, foi importado direto numa fase avancada)
    if (isLeadOrMql && isAdvancedIndicator) {
      if (indicatorMap.has('leads') || indicatorMap.has('mql')) continue;
    }

    const firstEntry = indicatorMap.get(ind);
    if (!firstEntry) continue;
    const entryTime = firstEntry.dataEntrada.getTime();
    if (entryTime >= startTime && entryTime <= endTime) {
      const existing = uniqueCards.get(cardId);
      if (!existing || firstEntry.dataEntrada < existing.dataEntrada) {
        uniqueCards.set(cardId, firstEntry);
      }
    }
  }
}
```

## Por que funciona

- Cards normais (Start form -> Lead -> MQL -> ...): contados via 'leads' ou 'mql', no periodo da primeira entrada. Nao sao puxados por RM/Proposta de meses futuros.
- Cards importados direto (sem Start form/Lead): nao tem entrada 'leads' nem 'mql' no historico, entao sao puxados via o indicador avancado onde entraram (ex: 'venda').

## Resultado esperado

- **MQLs Oxy Hacker**: 24 (exatamente o XLSX)
- **Leads Oxy Hacker**: 24
- Cards de meses anteriores nao sao contados novamente
