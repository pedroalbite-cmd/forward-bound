

## Plano: Construir a aba Growth com indicadores do quadro

### Visão geral

A aba Growth terá 5 seções baseadas no quadro branco. Dados reais serão usados onde já existem no sistema; o restante será placeholder (valor 0 ou "—") pronto para conectar.

### Dados já disponíveis no sistema (real)

| Métrica | Fonte |
|---------|-------|
| MRR, Setup, Pontual, Educação | `useModeloAtualMetas`, `useO2TaxMetas` |
| Expansão (Franquia, Oxy Hacker) | `useExpansaoMetas`, `useOxyHackerMetas` |
| Investimento Mídia | Meta/Google APIs (`useMetaCampaigns`, `useGoogleCampaigns`) |
| ROAS direto, CAC, LTV, CPV | Calculados no `MarketingIndicatorsTab` |
| Vendas (qty) | Analytics hooks (`getCardsForIndicator('venda')`) |
| NPS score | `npsData.ts` (hardcoded Q4 2025) |

### Dados placeholder (sem fonte ainda)

Investimento: Time, Tools, Evento (custo); ARR (calculável = MRR×12 com dados reais); Valuation (10x ARR); REV/People; LT(3) mediana/churn/propensão; Rev Churn; Logo Churn; MHS

### Estrutura do componente

Criar `src/components/planning/GrowthTab.tsx` com as seções:

**1. KPIs de destaque (topo)**
- 4 cards grandes: **ARR** (MRR×12, calculado real), **Valuation** (10×ARR, derivado), **LTV/CAC** (real se houver dados de Marketing), **NPS** (do npsData)

**2. Seção Investimento**
- Cards menores: Mídia (real, soma Meta+Google APIs), Evento (placeholder 0), Time (placeholder 0), Tools (placeholder 0), Total
- Sub-linha: MRR, Setup, Pontual, Educação, Expansão (valores reais)

**3. Seção ROAS & ROI**
- Cards: ROAS direto (GMV/Investimento), ROAS LTV (LTV×Vendas/Investimento), REV/People (placeholder)
- Cards: ROI direto (mesma lógica), ROI LTV

**4. Seção Venda & Resultado**
- Cards: CPV (Investimento/Vendas, real), CAC (real)
- Cards Resultado: LTV (real), TCV (real), Faturamento total (real)

**5. Seção CS (Customer Success)**
- Cards: LT(3) mediana (placeholder), Rev Churn (placeholder), Logo Churn (placeholder), Churn (placeholder), NPS (real do npsData), MHS (placeholder)

### Hooks necessários

O componente importará:
- `useModeloAtualMetas`, `useO2TaxMetas`, `useExpansaoMetas`, `useOxyHackerMetas` — para MRR/revenue real
- `useMetaCampaigns`, `useGoogleCampaigns` — para investimento mídia
- `useModeloAtualAnalytics`, `useO2TaxAnalytics`, `useExpansaoAnalytics` — para qty vendas
- `NPS_METRICS` de `npsData.ts` — NPS score
- Date range picker igual ao marketing tab

### Alterações

1. **Criar** `src/components/planning/GrowthTab.tsx` — componente completo com as 5 seções
2. **Editar** `src/components/planning/IndicatorsWrapper.tsx` — importar `GrowthTab` no lugar do placeholder

### Layout visual

Cada seção usa `Card` com header e grid de KPI cards internos. Os KPIs sem dados mostram "—" com label "(em breve)" em tom muted.

