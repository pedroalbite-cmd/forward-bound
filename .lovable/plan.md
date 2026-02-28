

## Usar valor real da "Taxa de franquia" com fallback para ticket fixo

### Problema
O card 1294245876 (Silvio Filho - Recife) tem "Taxa de franquia" = R$ 105.000, mas os funis usam `qty * R$ 140.000` (ticket fixo). Isso gera divergencia: o funil mostra R$ 140k quando deveria mostrar R$ 105k para esse card.

O acelerometro tambem usa `qty * 140.000` fixo, entao a correcao deve ser feita em todos os locais para manter consistencia.

### Solucao
Usar `getValueForPeriod` dos hooks (que ja le o campo "Taxa de franquia" do Pipefy), mas garantir que o fallback seja o ticket padrao (R$ 140k para Franquia, R$ 54k para Oxy Hacker) quando todos os campos monetarios estao vazios.

### Alteracoes

#### 1. `src/hooks/useExpansaoMetas.ts` (linhas 178-189)
No `getValueForPeriod`, quando `taxaFranquia` e 0 e `pontual + setup + mrr` tambem e 0, aplicar fallback de R$ 140.000:

```typescript
if (shouldCount && !cardValues.has(movement.id)) {
  const taxaFranquia = movement.taxaFranquia || 0;
  if (taxaFranquia > 0) {
    cardValues.set(movement.id, taxaFranquia);
  } else {
    const pontual = movement.valorPontual || 0;
    const setup = movement.valorSetup || 0;
    const mrr = movement.valorMRR || 0;
    const sum = pontual + setup + mrr;
    cardValues.set(movement.id, sum > 0 ? sum : 140000); // fallback
  }
}
```

#### 2. `src/hooks/useOxyHackerMetas.ts`
Mesma logica no `getValueForPeriod`, com fallback de R$ 54.000 para Oxy Hacker.

#### 3. `src/components/planning/PeriodFunnelChart.tsx` (linhas 99-117)
Substituir `qty * 140000` por `getExpansaoValue(...)` e `qty * 54000` por `getOxyHackerValue(...)` em todos os branches (consolidado, franquia, oxy_hacker). Os hooks agora ja incluem o fallback correto.

#### 4. `src/components/planning/ClickableFunnelChart.tsx` (linhas 173-183)
Mesma substituicao: usar `getExpansaoValue` e `getOxyHackerValue` em vez de `qty * ticket`.

#### 5. `src/components/planning/IndicatorsTab.tsx` (linhas 1785-1791)
Atualizar o acelerometro para tambem usar `getExpansaoValue('venda')` e `getOxyHackerValue('venda')` em vez de `qty * ticket`.

### Resultado
- Card com "Taxa de franquia" preenchida (ex: R$ 105k) -> usa valor real
- Card com campos monetarios vazios -> usa ticket padrao (R$ 140k ou R$ 54k)
- Funis e acelerometro ficam 100% alinhados

| Arquivo | Alteracao |
|---------|-----------|
| `useExpansaoMetas.ts` | Adicionar fallback R$ 140k no getValueForPeriod |
| `useOxyHackerMetas.ts` | Adicionar fallback R$ 54k no getValueForPeriod |
| `PeriodFunnelChart.tsx` | Usar getValueForPeriod em vez de qty * ticket |
| `ClickableFunnelChart.tsx` | Usar getValueForPeriod em vez de qty * ticket |
| `IndicatorsTab.tsx` | Usar getValueForPeriod no acelerometro |
