
# Fix: MRR, Setup e Pontual mostrando meta do faturamento TOTAL em vez do INCREMENTO

## Problema

Os 3 acelerometros monetarios (MRR, Setup, Pontual) para o Modelo Atual estao puxando metas do banco de dados baseadas no **faturamento total** (ex: R$ 1.181.500 em Fev), quando deveriam usar o **incremento** (R$ 400.000 em Fev).

Valores atuais (errados) para Fev:
- MRR: R$ 295k (25% de 1.18M)
- Setup: R$ 709k (60% de 1.18M)
- Pontual: R$ 177k (15% de 1.18M)

Valores corretos (baseados no incremento de 400k):
- MRR: R$ 100k (25% de 400k)
- Setup: R$ 240k (60% de 400k)
- Pontual: R$ 60k (15% de 400k)

## Causa raiz

No `useConsolidatedMetas.ts`, a logica `skipDbForFaturamento` so pula o banco para a metrica `faturamento` do Modelo Atual. Para `mrr`, `setup` e `pontual`, o sistema continua buscando do banco, onde os valores sao calculados sobre o faturamento TOTAL.

## Solucao

### Arquivo: `src/hooks/useConsolidatedMetas.ts`

Expandir a logica de skip para incluir MRR, Setup e Pontual do Modelo Atual. Quando a BU for `modelo_atual`, TODAS as metricas monetarias devem vir do Plan Growth (que calcula com base no incremento), nao do banco.

**Antes** (linha 99):
```typescript
const skipDbForFaturamento = bu === 'modelo_atual' && metric === 'faturamento';
```

**Depois**:
```typescript
// Para modelo_atual, todas as métricas monetárias devem usar Plan Growth
// O DB armazena valores baseados no faturamento TOTAL, mas os acelerômetros
// precisam do INCREMENTO (A Vender = Total - MRR Base)
const skipDb = bu === 'modelo_atual';
```

E na linha 102, trocar `skipDbForFaturamento` por `skipDb`.

## Resultado esperado

Para Modelo Atual em Fevereiro (incremento = R$ 400k):
- Faturamento: Meta R$ 400k (ja funcionava)
- MRR: Meta ~R$ 100k (25% do incremento)
- Setup: Meta ~R$ 240k (60% do incremento)
- Pontual: Meta ~R$ 60k (15% do incremento)

As outras BUs (O2 TAX, Oxy Hacker, Franquia) continuam buscando do banco normalmente.
