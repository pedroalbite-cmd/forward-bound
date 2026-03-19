

## Sincronizar MRR Base entre Plan Growth e Indicadores

### Problema
O `usePlanGrowthData.ts` (que alimenta os Indicadores) sobrescreve o MRR Base com valores hardcoded (`realMrrBase: { Jan: 700k, Fev: 700k, Mar: 755k }`), enquanto a aba Plan Growth (`MediaInvestmentTab`) calcula o MRR dinamicamente pela cadeia de churn/retenção.

Resultado para Março:
- Plan Growth: MRR Base = R$ 834.610 → A Vender = **R$ 500.000** (correto)
- Indicadores: MRR Base hardcoded = R$ 755.000 → A Vender = **R$ 579.610** (inflado)

Isso infla MQLs, vendas e todas as metas nos Indicadores.

### Solução

**Arquivo: `src/hooks/usePlanGrowthData.ts`**

Remover o bloco `realMrrBase` hardcoded (linhas 357-361) e o override que sobrescreve o cálculo dinâmico (linhas 374-379). Assim, o MRR Base será calculado pela mesma cadeia de churn/retenção usada no Plan Growth, e o "A Vender" de Março será R$ 500.000 como esperado.

Alterações específicas:
1. Deletar a constante `realMrrBase` (linhas 357-361)
2. Deletar o bloco de override dentro do `useMemo` do `mrrDynamic` (linhas 374-379)

### Resultado esperado
- Março: A Vender = R$ 500.000, vendas ~29, MQLs ~248
- Todos os meses ficam consistentes entre Plan Growth e Indicadores

