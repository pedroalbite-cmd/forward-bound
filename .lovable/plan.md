

## Análise: GMV pode ser calculado automaticamente?

### O que é o GMV hoje

O GMV (Gross Merchandise Value) no dashboard é a **receita total** — essencialmente a soma de todas as receitas geradas. Atualmente ele vem exclusivamente da planilha "Indicadores 26" (valor manual).

### Dados que já temos automatizados via Pipefy

Para as BUs selecionadas, já calculamos automaticamente:
- **MRR** (Modelo Atual + O2 TAX)
- **Setup** (Modelo Atual + O2 TAX)
- **Pontual** (Modelo Atual + O2 TAX + Franquia + Oxy Hacker)
- **Educação** (Modelo Atual)

### Proposta

**Sim, podemos calcular o GMV automaticamente** como:

```
GMV = MRR + Setup + Pontual + Educação
```

Isso já está disponível no código — basta somar os 4 valores que já calculamos no `realRevenue`.

### Implementação

**Arquivo:** `src/components/planning/MarketingIndicatorsTab.tsx`

1. Substituir `gmv: data.revenue.gmv` (que vem da planilha) por `gmv: mrr + setup + pontual + educacao` no retorno do `realRevenue` useMemo (linha 144).

Mudança de **1 linha**. Nenhum hook novo necessário.

### Consideração

Se o GMV da planilha incluir receitas de fontes que **não** são cobertas pelos 4 campos (ex: receitas avulsas, comissões, ou BUs não integradas), o valor calculado será diferente do manual. Se todas as receitas passam pelo Pipefy nas 4 BUs, os valores devem bater.

