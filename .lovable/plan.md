

## Plano: Substituir metas hardcoded por metas consolidadas do banco

### Problema atual
As metas na aba Mkt Indicadores estão hardcoded em `useMarketingIndicators.ts`:
- Revenue: MRR 150k, Setup 50k, Pontual 30k, Educação 25k, GMV 250k
- Funnel: Leads 1200, MQLs 840, RMs 500, RRs 400
- Investment: 200k

### Solução
Usar os dados reais da tabela `monetary_metas` (editados no Admin) e do `MediaMetasContext.funnelData` para calcular metas consolidadas (soma de todas as BUs) filtradas pelos meses do período selecionado.

### Implementação

**Arquivo: `src/components/planning/MarketingIndicatorsTab.tsx`**

1. Importar `useMonetaryMetas` e `useMediaMetas`
2. Criar um `useMemo` que, com base no `dateRange`, identifica os meses selecionados (ex: "Fev" para fevereiro)
3. Para **metas de receita**: somar `faturamento`, `mrr`, `setup`, `pontual` de todas as BUs nos meses do período a partir de `monetary_metas`
4. Para **metas de funil** (leads, mqls, rms, rrs, propostas, vendas, investimento): somar os valores de todas as 4 BUs no `funnelData` do contexto para os meses selecionados
5. Sobrescrever `goals.revenue` e as metas de funil com esses valores calculados, mantendo os gauges de performance (ROAS, ROI LTV, CAC, LTV) hardcoded por enquanto (são benchmarks, não metas do Admin)

**Arquivo: `src/hooks/useMarketingIndicators.ts`**
- Aceitar parâmetro opcional `overrideGoals` para permitir que o componente passe as metas calculadas, OU simplesmente calcular as metas diretamente no `MarketingIndicatorsTab` e passá-las aos sub-componentes (mais simples)

### Abordagem preferida (mais simples)
Calcular as metas consolidadas diretamente no `MarketingIndicatorsTab.tsx` e usá-las no lugar de `goals.revenue` e `costGoals`. Isso evita alterar a interface do hook.

- Metas de receita: `useMonetaryMetas(2026)` → somar por meses do período
- Metas de funil: `useMediaMetas().funnelData` → somar todas BUs pelos meses do período
- GMV goal = soma de MRR + Setup + Pontual (goals)
- Educação: não existe em `monetary_metas`, mantém 0 ou hardcoded

### Arquivos alterados
1. `src/components/planning/MarketingIndicatorsTab.tsx` — adicionar imports e `useMemo` para metas consolidadas, substituir `goals.revenue` e metas de funil

