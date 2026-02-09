

# Corrigir contagem de vendas no Analytics (13 -> 18)

## Diagnostico

O `useModeloAtualMetas` mostra 18 vendas (correto), mas `useModeloAtualAnalytics` mostra apenas 13. A causa raiz esta em DUAS camadas:

### Camada 1: parseCardRow nao sobrescreve dataEntrada
No `useModeloAtualMetas.ts`, a correcao sobrescreve `dataEntrada = dataAssinatura` no momento do parsing para a fase "Contrato assinado". Porem, no `useModeloAtualAnalytics.ts`, a funcao `parseCardRow` (linha 100) mantem `dataEntrada` como o valor original de `Entrada` e apenas armazena `dataAssinatura` separadamente. A logica de "effective date" nas linhas 297-303 e 346-348 deveria compensar, mas e fragil e depende de `dataAssinatura` estar populado em CADA registro do historico.

### Camada 2: Cards possivelmente nao capturados
Se algum dos 5 cards faltantes nao tem NENHUMA movimentacao com `Entrada` em Janeiro (apenas `dataAssinatura` em Janeiro), o `query_period` do servidor nao os retorna, e eles nunca entram no `query_card_history`.

## Solucao

### 1. `src/hooks/useModeloAtualAnalytics.ts` - parseCardRow

Aplicar a mesma logica do metas: sobrescrever `dataEntrada` com `dataAssinatura` quando a fase e "Contrato assinado" e `dataAssinatura` esta preenchido. Isso garante que TODA a logica downstream (firstEntry, getCardsForIndicator, toDetailItem) funcione automaticamente.

Na funcao `parseCardRow` (por volta da linha 100-151):
- Apos parsear `dataAssinatura` (linha 110), adicionar:
```
if (fase === 'Contrato assinado' && dataAssinatura) {
  dataEntrada = dataAssinatura;
}
```
- Tornar `dataEntrada` mutavel (usar `let` em vez de `const`)

### 2. `src/hooks/useModeloAtualAnalytics.ts` - Query adicional por data de assinatura

Adicionar uma terceira query paralela para buscar cards com `"Data de assinatura do contrato"` no periodo selecionado. Isso captura cards que tem assinatura em Janeiro mas nenhuma `Entrada` em Janeiro.

Na funcao de query (linhas 191-210):
- Adicionar novo request usando uma nova action `query_period_by_signature`
- Mergear os resultados com os cards do `query_period`
- Incluir esses card IDs no `query_card_history`

### 3. `supabase/functions/query-external-db/index.ts` - Nova action

Adicionar action `query_period_by_signature`:
```sql
SELECT * FROM pipefy_moviment_cfos
WHERE "Data de assinatura do contrato" >= $1::timestamp
AND "Data de assinatura do contrato" <= $2::timestamp
ORDER BY "Data de assinatura do contrato" DESC
LIMIT $3
```

### 4. Simplificar logica de effective date

Com a sobrescrita no parseCardRow, a logica de "effective date" nas linhas 297-303 e 346-348 do `getCardsForIndicator` se torna redundante (pois `dataEntrada` ja contem a data correta). Manter por seguranca, mas agora ambos os caminhos dao o mesmo resultado.

## Arquivos a modificar

1. `supabase/functions/query-external-db/index.ts` - adicionar action `query_period_by_signature`
2. `src/hooks/useModeloAtualAnalytics.ts` - sobrescrever dataEntrada no parseCardRow + query adicional por assinatura

## Resultado esperado

- `getCardsForIndicator('venda')` retornara 18 cards em Janeiro (igual ao metas)
- Drill-down de vendas mostrara todos os 18 cards com datas corretas
- KPIs e graficos refletirao os dados completos

