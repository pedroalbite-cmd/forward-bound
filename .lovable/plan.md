

## Diagnóstico e Plano de Correção

### Problema 1: Metas divergentes na aba Marketing

**Causa raiz:** O `consolidatedRevenueGoals` no `MarketingIndicatorsTab.tsx` soma diretamente `meta.mrr`, `meta.setup`, `meta.pontual` da tabela `monetary_metas`. Para o Modelo Atual, a tabela armazena valores baseados no faturamento **TOTAL** (incluindo base MRR ~R$1.3M), não no **INCREMENTO** (A Vender). 

A aba Indicadores usa `useConsolidatedMetas`, que **pula o DB para o Modelo Atual** (linha 100: `skipDb = bu === 'modelo_atual'`) e usa o Plan Growth (incremento). A aba Marketing não faz isso — pega o valor bruto do DB.

**Correção:** Substituir o `consolidatedRevenueGoals` no `MarketingIndicatorsTab.tsx` para usar `useConsolidatedMetas().getMetaForPeriod()` — a mesma fonte da aba Indicadores. Isso garante que Modelo Atual use Plan Growth (incremento) e as outras BUs usem o DB.

**Arquivo:** `src/components/planning/MarketingIndicatorsTab.tsx`
- Importar e usar `useConsolidatedMetas`
- Substituir o `useMemo` que soma raw DB values por chamadas a `getMetaForPeriod(['modelo_atual', 'o2_tax', 'oxy_hacker', 'franquia'], dateRange.from, dateRange.to, 'mrr')` etc.

---

### Problema 2: Valor da venda da Franquia ausente no Consolidado (aba Indicadores)

**Causa raiz:** No `getRealizedMonetaryForIndicator` (IndicatorsTab.tsx), o case `'pontual'` (linhas 1919-1941) só soma Modelo Atual e O2 TAX. **Franquia e Oxy Hacker não estão incluídas**, apesar de toda a receita delas ser pontual. O case `'faturamento'` inclui corretamente (via `getExpansaoValue`/`getOxyHackerValue`), mas `'pontual'` não.

**Correção:** Adicionar Franquia e Oxy Hacker ao case `'pontual'` no `getRealizedMonetaryForIndicator`:

```typescript
// Oxy Hacker: toda receita é pontual
if (includesOxyHacker) {
  total += getOxyHackerValue('venda', startDate, endDate);
}
// Franquia: toda receita é pontual
if (includesFranquia) {
  total += getExpansaoValue('venda', startDate, endDate);
}
```

**Arquivo:** `src/components/planning/IndicatorsTab.tsx` (dentro do case `'pontual'`, após o bloco O2 TAX)

---

### Resumo de alterações
1. `src/components/planning/MarketingIndicatorsTab.tsx` — usar `useConsolidatedMetas` em vez de somar raw DB
2. `src/components/planning/IndicatorsTab.tsx` — adicionar Franquia e Oxy Hacker ao case `pontual`

