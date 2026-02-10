

# Corrigir vendas Oxy Hacker usando Data de Assinatura do Contrato

## Problema

17 vendas Oxy Hacker aparecem em Fevereiro porque foram alimentadas no Pipefy nesse mes, mas os contratos foram assinados entre Outubro e Dezembro de 2025. O sistema usa a coluna "Entrada" (data de alimentacao) ao inves da "Data de assinatura do contrato" (data real).

## Evidencia do banco de dados

Todos os cards de "Contrato assinado" Oxy Hacker com Entrada em Fevereiro tem "Data de assinatura do contrato" preenchida com datas de 2025:
- Formato: ISO 8601 (`"2025-10-30T00:00:00.000Z"`)
- Todas as 17 vendas tem assinatura ANTES de 2026

## Solucao

Modificar o hook `useOxyHackerMetas.ts` para priorizar a "Data de assinatura do contrato" sobre a "Entrada" quando a fase for "Contrato assinado". Esta e a mesma abordagem ja usada no Modelo Atual (`useModeloAtualMetas.ts`).

## Mudancas tecnicas

### Arquivo: `src/hooks/useOxyHackerMetas.ts`

**1. Adicionar campo `dataAssinatura` na interface `OxyHackerMovement`**

Adicionar `dataAssinatura: Date | null;` para armazenar a data real de assinatura.

**2. Parsear a coluna no momento da criacao do movement**

No loop de parsing (linha 79-91), capturar `row['Data de assinatura do contrato']` e, quando a fase for "Contrato assinado" e a data de assinatura existir, substituir `dataEntrada` pela data de assinatura:

```text
ANTES:
  dataEntrada: parseDate(row['Entrada']) || new Date(),

DEPOIS:
  // Para vendas, priorizar data de assinatura sobre data de entrada
  const fase = row['Fase'] || '';
  const dataAssinatura = parseDate(row['Data de assinatura do contrato']);
  let dataEntrada = parseDate(row['Entrada']) || new Date();
  if (fase === 'Contrato assinado' && dataAssinatura) {
    dataEntrada = dataAssinatura;
  }
```

**3. Adicionar query paralela por data de assinatura**

Adicionar uma segunda chamada `query_period_by_signature` em paralelo com a `query_period` existente, para capturar vendas cujo contrato foi assinado no periodo mas cuja "Entrada" esta fora dele. Mesclar resultados com deduplicacao por `id + fase`.

## Resultado esperado

- As 17 vendas com assinatura em 2025 deixarao de aparecer em Fevereiro 2026
- Se houver vendas reais em Fevereiro (com data de assinatura em Fevereiro), elas continuarao aparecendo
- Nenhum outro indicador e afetado (leads, mql, rm, rr, proposta) -- a priorizacao so ocorre para "Contrato assinado"

