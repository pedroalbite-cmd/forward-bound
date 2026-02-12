
# Correcao de Timezone no Campo "Data de assinatura do contrato"

## Problema
O campo "Data de assinatura do contrato" vem do banco como `2026-02-12T00:00:00.000Z` (meia-noite UTC). O `new Date()` do JavaScript converte para fuso local (BRT = UTC-3), resultando em 11/02/2026 21:00 -- mostrando a venda no dia errado.

## Solucao
Criar uma funcao `parseDateOnly` que extrai apenas YYYY-MM-DD da string e cria a data ao meio-dia local, evitando deslocamento de timezone. Aplicar essa funcao em todos os pontos que parseiam "Data de assinatura do contrato".

## Arquivos afetados

### 1. `src/hooks/useModeloAtualAnalytics.ts`
- Adicionar funcao `parseDateOnly` ao lado da `parseDate` existente (apos linha 73)
- Linha 118: trocar `parseDate(row['Data de assinatura do contrato'])` por `parseDateOnly(row['Data de assinatura do contrato'])`

### 2. `src/hooks/useModeloAtualMetas.ts`
- Adicionar funcao `parseDateOnly`
- Linhas 184 e 224: trocar `parseDate(row['Data de assinatura do contrato'])` por `parseDateOnly(...)`

### 3. `src/hooks/useOxyHackerMetas.ts`
- Adicionar funcao `parseDateOnly`
- Linha 111: trocar `parseDate(row['Data de assinatura do contrato'])` por `parseDateOnly(...)`

### 4. `src/hooks/useExpansaoAnalytics.ts`
- Adicionar funcao `parseDateOnly`
- Linha 82: trocar `parseDate(row['Data de assinatura do contrato'])` por `parseDateOnly(...)`

### Funcao a ser adicionada em cada arquivo

```text
function parseDateOnly(dateValue: string | null): Date | null {
  if (!dateValue) return null;
  const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return parseDate(dateValue);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
}
```

Essa funcao extrai ano/mes/dia da string ISO e cria o Date ao meio-dia local, eliminando qualquer deslocamento de fuso horario.

## Resultado
O card RM FERNANDEZ passara a aparecer no dia 12/02/2026 (data correta da assinatura), e todas as demais vendas serao exibidas na data correta.
