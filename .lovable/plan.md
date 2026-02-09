
# Corrigir meta de Faturamento (Incremento) no acelerometro

## Problema

O banco de dados (`monetary_metas`) armazena o **faturamento total** (meta total do mes) no campo `faturamento`. Exemplo: Fev modelo_atual = R$ 1.237.500.

Porem, o acelerometro "Faturamento" exibe o **Incremento** (A Vender = Total - MRR Base), que deveria ser ~R$ 400k para Fev.

O hook `useConsolidatedMetas` retorna o valor do banco (1.2M) diretamente para o acelerometro, sem subtrair o MRR Base. O fallback do Plan Growth (que calcula corretamente via `vendas * ticket`) nunca eh ativado porque o banco tem prioridade.

### Sintomas
- Filtro Fev 1-9: meta mostra ~R$ 398k (pro-rata de 1.2M, nao de ~400k)
- Filtro Fev inteiro: meta mostra R$ 1.2M (deveria ser ~R$ 400k)

## Solucao

Alterar o `useConsolidatedMetas` para que, **no caso do modelo_atual + metrica faturamento**, nao use o valor bruto do banco (que eh o total) e sim o valor calculado pelo Plan Growth (que ja computa o Incremento = revenueToSell corretamente a partir do mesmo valor do banco).

### Logica
- `modelo_atual` + `faturamento`: sempre usar Plan Growth (que ja le o banco e calcula Incremento = Total - MRR Base)
- `modelo_atual` + `mrr/setup/pontual`: continuar usando DB normalmente (esses valores sao o breakdown correto do incremento)
- Todas as outras BUs: manter logica atual (DB faturamento = incremento para elas)

### Bug secundario
A funcao `getFilteredFaturamentoMeta` (usada quando ha filtro de closer) nao aplica pro-rata por dias. Sera corrigida para usar a mesma logica de fracao do `getMetaForPeriod`.

## Arquivos a modificar

### `src/hooks/useConsolidatedMetas.ts`

1. Em `getConsolidatedMeta`: para `bu === 'modelo_atual'` e `metric === 'faturamento'`, pular o check do DB e ir direto para o Plan Growth fallback
2. Em `getFilteredFaturamentoMeta`: adicionar calculo de pro-rata (fracao de dias do mes cobertos pelo periodo selecionado), igual ao que ja existe em `getMetaForPeriod`

## Impacto esperado

- Fev inteiro, Modelo Atual: Faturamento passara de R$ 1.2M para ~R$ 400k (Incremento correto)
- Fev 1-9, Modelo Atual: Faturamento sera pro-rata do incremento (~R$ 400k * 9/28 ≈ R$ 129k)
- MRR, Setup, Pontual: sem alteracao (valores do banco sao corretos)
- Outras BUs: sem alteracao
