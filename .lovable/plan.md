

# Corrigir vendas Oxy Hacker no useExpansaoAnalytics

## Problema

A correcao anterior foi aplicada apenas no `useOxyHackerMetas.ts` (que agora mostra 0 vendas corretamente). Porem, o hook `useExpansaoAnalytics.ts` -- usado pelos gauges, drill-downs e funil na aba Indicadores -- continua usando a data de `Entrada` sem priorizar a data de assinatura. Por isso, as 17 vendas ainda aparecem em Fevereiro.

Os logs confirmam:
- `[useOxyHackerMetas] getQtyForPeriod venda: 0 unique cards` (corrigido)
- `[Oxy Hacker Analytics] getCardsForIndicator(venda): 17 cards` (ainda errado)

## Solucao

Aplicar a mesma logica de priorizacao de data de assinatura no `useExpansaoAnalytics.ts`:

### Arquivo: `src/hooks/useExpansaoAnalytics.ts`

**Mudanca 1: Priorizar data de assinatura no `parseRawCard`**

Na funcao `parseRawCard` (linha 66-108), quando a fase for "Contrato assinado" e o campo "Data de assinatura do contrato" estiver preenchido, substituir `dataEntrada` pela data de assinatura:

```text
ANTES (linha 68):
  const dataEntrada = parseDate(row['Entrada']) || new Date();

DEPOIS:
  let dataEntrada = parseDate(row['Entrada']) || new Date();
  const fase = row['Fase'] || '';
  const dataAssinatura = parseDate(row['Data de assinatura do contrato']);
  if (fase === 'Contrato assinado' && dataAssinatura) {
    dataEntrada = dataAssinatura;
  }
```

**Mudanca 2: Adicionar query paralela por data de assinatura**

Na `queryFn` (linhas 127-183), adicionar uma segunda chamada `query_period_by_signature` em paralelo com `query_period`, e mesclar os resultados com deduplicacao por `ID + Fase` (mesma abordagem usada no `useOxyHackerMetas`).

## Resultado esperado

- Os gauges, drill-downs e funil da aba Indicadores deixarao de mostrar as 17 vendas em Fevereiro
- Vendas serao contabilizadas pelo mes da assinatura do contrato
- A logica de "first entry" do analytics continuara funcionando corretamente, agora com a data correta

