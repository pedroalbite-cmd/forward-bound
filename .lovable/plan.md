

# Corrigir discrepancia de leads entre Indicadores e Plan Growth

## Problema

O Plan Growth mostra 889 leads em Janeiro enquanto o Indicadores mostra 720. A causa e que os dois usam o mesmo hook (`useModeloAtualMetas`) mas com **ranges de data diferentes**:

- **Indicadores**: chama `useModeloAtualMetas(1 Jan, 31 Jan)` - o servidor retorna so movimentos de Janeiro
- **Plan Growth** (`useIndicatorsRealized`): chama `useModeloAtualMetas(1 Jan, 31 Dez)` - o servidor retorna TODOS os movimentos do ano, depois filtra Janeiro no cliente

O dataset do ano inteiro e maior (ate 10.000 linhas), capturando cards adicionais que a query mensal nao retorna. Isso infla os numeros do Plan Growth.

## Solucao

Mudar o `useIndicatorsRealized` para criar hooks **por mes** em vez de um unico hook por ano. Como nao e possivel chamar hooks condicionalmente no React, a alternativa e:

1. Manter os hooks do ano inteiro (necessario para React rules)
2. Criar um **hook separado por BU que faz 12 queries mensais** usando `useQueries` do TanStack Query
3. Ou, mais simples: **fazer as queries mensais diretamente dentro do `useMemo`** chamando a edge function para cada mes

A abordagem mais limpa e pragmatica:

### Opcao escolhida: Reutilizar os mesmos hooks mas com range mensal

Nao e viavel criar 4 x 12 = 48 hooks. Em vez disso, o `useIndicatorsRealized` vai continuar usando os hooks do ano inteiro, mas vamos **corrigir a causa raiz**: garantir que o `getQtyForPeriod` produza resultados consistentes independente do range da query.

O problema real e que a query do ano inteiro retorna mais linhas de movimento do que a query mensal (limite de 10.000 linhas e queries adicionais por creation/signature). A correcao:

### Mudanca em `useIndicatorsRealized.ts`

Em vez de usar os hooks do ano inteiro e filtrar por mes no cliente, o hook vai **chamar a edge function diretamente** para cada mes, fazendo queries identicas as do Indicadores:

1. Remover a dependencia dos 4 hooks (`useModeloAtualMetas`, `useO2TaxMetas`, etc.)
2. Usar `useQuery` com uma unica queryFn que faz 12 chamadas mensais por BU (4 BUs x 12 meses = 48 chamadas, mas paralelizadas)
3. Aplicar a mesma logica de contagem de leads que os hooks individuais usam

**Problema**: isso duplicaria muita logica dos hooks existentes.

### Alternativa mais simples (recomendada)

Manter os hooks do ano inteiro mas **aumentar o limite** de 10.000 para um valor maior (50.000) na query do `useIndicatorsRealized`, e garantir que a logica de deduplicacao seja identica. O verdadeiro problema provavelmente e que com o range do ano inteiro, mais movimentos passam pela query `query_period_by_creation` (MQLs por data de criacao), inflando o count de leads.

Na verdade, olhando mais atentamente: os 889 leads vem da soma de **todas as 4 BUs** (Modelo Atual + O2 Tax + Oxy Hacker + Franquia), enquanto os 720 podem ser so Modelo Atual. Preciso verificar isso.

### Verificacao necessaria

Pelos logs do console:
- `[useModeloAtualMetas] getQtyForPeriod leads: 889` - isso e Modelo Atual com query do ano inteiro
- No Indicadores, com query de Janeiro: 720 leads

Entao a diferenca e realmente no Modelo Atual. A correcao:

### Mudanca concreta

**`useIndicatorsRealized.ts`**: Em vez de instanciar os hooks com `yearStart`/`yearEnd` (ano inteiro), instanciar com ranges mais curtos nao e possivel (hooks fixos). A solucao real:

**Criar queries mensais separadas usando `useQueries`** do TanStack Query dentro do `useIndicatorsRealized`:

```text
Para cada BU:
  Para cada mes (Jan-Dez):
    Fazer query identica a do hook individual (mesma table, mesmo action, mesmo range)
    Aplicar a mesma logica de contagem
```

Isso garante paridade exata com o Indicadores.

### Implementacao

1. **`useIndicatorsRealized.ts`**:
   - Remover imports dos 4 hooks de BU
   - Usar `useQueries` do TanStack Query para fazer 4 queries (uma por BU), cada uma com range mensal
   - Para cada BU/mes, invocar `query-external-db` com o range do mes especifico
   - Aplicar a mesma logica de parsing e contagem dos hooks originais
   - Retornar `realizedFunnelByBU` e `realizedByBU` como antes

2. **Alternativa mais simples** (se `useQueries` for complexo demais):
   - Manter os hooks do ano inteiro
   - Mas para o campo `leads` especificamente, fazer uma query mensal adicional
   - Ou ajustar o `getQtyForPeriod` para ser deterministico independente do tamanho do dataset

Dado a complexidade, a solucao mais pragmatica e: **manter os hooks do ano mas mudar o `useIndicatorsRealized` para instanciar hooks com range mensal para o mes corrente e anteriores** -- mas isso viola regras do React.

### Solucao final recomendada

A forma mais limpa e correta: fazer o `useIndicatorsRealized` manter os 4 hooks do ano inteiro mas **nao usar `getQtyForPeriod` para leads**. Em vez disso, para leads, fazer uma contagem direta nos movements filtrando pelo mes, usando exatamente a mesma logica. O problema e que o dataset retornado pela query anual ja e diferente.

**A verdadeira correcao**: mudar os hooks para que a query do ano inteiro nao tenha o limite de 10.000 linhas ou para que o `query_period` retorne resultados consistentes. Aumentar o limite para 50.000 na instancia do `useIndicatorsRealized`.

Vou implementar:

1. No `useIndicatorsRealized`, passar parametros extras aos hooks para usar limite maior (50.000)
2. OU criar instancias separadas dos hooks por mes usando `useQueries`

A opcao 2 e a correta para garantir paridade. Vou implementa-la.

## Detalhes tecnicos

### `useIndicatorsRealized.ts` - Refatorar para queries mensais

- Usar `useQueries` do `@tanstack/react-query` para criar 48 queries (4 BUs x 12 meses)
- Cada query invoca `query-external-db` com o range exato do mes (identico ao Indicadores)
- Aplicar a mesma logica de parsing e contagem de cada hook de BU
- Montar o `realizedFunnelByBU` a partir dos resultados
- Manter backward-compatibility com `realizedByBU`

Isso garante que os numeros do Plan Growth sejam **identicos** aos do Indicadores para qualquer mes.

