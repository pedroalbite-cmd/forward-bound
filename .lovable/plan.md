
# Corrigir arredondamento na cadeia de MRR (A Vender inconsistente)

## Problema

Os valores de "A Vender" estao levemente errados (ex: Fev mostra R$ 398.000 em vez de R$ 400.000). A causa e que a retencao mensal usa **vendas arredondadas x ticket** em vez do valor real de A Vender:

- Jan: A Vender = 400.000, Vendas = Math.round(400.000/17.000) = **24**
- Retencao para Fev = 24 x 17.000 x 25% = **102.000** (deveria ser 400.000 x 25% = **100.000**)
- Esse excesso de R$ 2.000 na retencao infla o MRR Base de Fev, reduzindo A Vender de 400k para 398k
- O erro se acumula mes a mes

## Solucao

Usar o valor financeiro real de A Vender (nao o arredondado) para calcular a retencao. Trocar:

```
retencaoDoMesAnterior = vendasMesAnterior * ticketMedio * retencaoRate
```

Por:

```
retencaoDoMesAnterior = aVenderAnterior * retencaoRate
```

Isso garante que a cadeia de MRR use valores financeiros exatos.

## Arquivos a alterar

### 1. `src/components/planning/MediaInvestmentTab.tsx` (funcao `calculateMrrAndRevenueToSell`, linhas ~145-165)
- Substituir variavel `vendasMesAnterior` por `aVenderAnterior` (tipo number, inicia em 0)
- Linha 154: trocar `vendasMesAnterior * ticketMedio * retencaoRate` por `aVenderAnterior * retencaoRate`
- Linha 165: trocar `vendasMesAnterior = vendasDoMes` por `aVenderAnterior = aVender`

### 2. `src/hooks/usePlanGrowthData.ts` (funcao `calculateMrrAndRevenueToSell`, linhas ~199-217)
- Mesma alteracao: usar `aVenderAnterior * retencaoRate` em vez de `vendasMesAnterior * ticketMedio * retencaoRate`

## Resultado esperado
- A Vender mostrara os valores corretos derivados das metas no banco
- A cadeia de MRR Base sera precisa sem erros de arredondamento acumulados
- Vendas continua como indicador arredondado (display only)
