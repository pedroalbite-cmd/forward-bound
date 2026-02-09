
# Plano: Alinhar MQL com o Pipefy (usar Data de Criacao)

## Problema
O Pipefy conta MQLs como: **card criado no mes + faturamento >= R$ 200k**. O dashboard atual conta pela **data de entrada na fase MQL**. Cards que foram direto para "Perdido" (como CghcffJ, inogvavaso, Viviana) nunca sao carregados porque a fase "Perdido" nao esta no mapeamento.

## Solucao

Mudar a logica de contagem de MQL para usar `dataCriacao` (Data de Criacao do card) em vez de `dataEntrada` (entrada na fase), mantendo o filtro de faturamento >= R$ 200k. Isso alinha exatamente com o criterio do Pipefy.

### Mudancas Necessarias

**1. Edge Function `query-external-db/index.ts`**
- Criar nova acao `query_period_by_creation` que filtra por `"Data Criacao"` em vez de `"Entrada"`
- Isso garante que cards criados no periodo mas que foram para fases nao mapeadas (como "Perdido") sejam retornados

**2. Hook `useModeloAtualAnalytics.ts`**
- Adicionar uma segunda query no `queryFn` para buscar cards criados no periodo (usando a nova acao)
- No `parseCardRow`: remover o filtro `if (!PHASE_TO_INDICATOR[fase]) return null` para cards que vem da query por criacao, ou criar um parser separado
- No `getCardsForIndicator` para MQL: usar `dataCriacao` dentro do periodo + `isMqlQualified(faixa)` como criterio, em vez de primeira entrada em fase MQL
- Manter a logica de primeira entrada para todos os outros indicadores (leads, rm, rr, proposta, venda)

**3. Hook `useModeloAtualMetas.ts`**
- Mesma mudanca no `getQtyForPeriod` para MQL: filtrar por `dataCriacao` + faturamento qualificado
- Mesma mudanca no `getGroupedData` para MQL (daily/weekly/monthly)

### Detalhes Tecnicos

**Nova acao na Edge Function:**
```text
action: 'query_period_by_creation'
- Filtra por: "Data Criacao" >= startDate AND "Data Criacao" <= endDate
- Retorna TODOS os cards criados no periodo, independente da fase
```

**Mudanca no parseCardRow (Analytics):**
- Criar funcao `parseCardRowForMql` que NAO filtra por `PHASE_TO_INDICATOR`
- Cards vindos da query por criacao sao parseados sem restricao de fase
- O filtro de qualificacao (`isMqlQualified`) continua sendo aplicado

**Mudanca no getCardsForIndicator (Analytics):**
- Para `indicator === 'mql'`: iterar pelos cards criados no periodo, filtrar por `isMqlQualified(faixa)`, deduplicar por ID
- Para todos os outros indicadores: manter logica atual de primeira entrada

**Mudanca no useModeloAtualMetas:**
- Adicionar campo `dataCriacao` ao tipo `ModeloAtualMovement`
- Parsear "Data Criacao" na query
- No `getQtyForPeriod` para MQL: usar `dataCriacao` como filtro temporal
- No `getGroupedData` para MQL: usar `dataCriacao` para agrupar por dia/semana/mes

### Impacto
- **MQL**: Passara de 113 para 116, alinhado com Pipefy
- **Leads**: NAO sera afetado (continua usando logica de fase)
- **RM, RR, Proposta, Venda**: NAO serao afetados
- **Drill-down de MQL**: Mostrara os 3 cards adicionais (CghcffJ, inogvavaso, Viviana) com suas fases reais (ex: "Perdido")

### Arquivos Modificados
1. `supabase/functions/query-external-db/index.ts` - nova acao
2. `src/hooks/useModeloAtualAnalytics.ts` - logica MQL por criacao
3. `src/hooks/useModeloAtualMetas.ts` - logica MQL por criacao
