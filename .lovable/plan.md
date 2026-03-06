

## Diagnóstico: Divergência de dados Meta Ads no dashboard de Marketing

### Problema identificado

O dashboard "Mídia e Leads por Canal" mostra **R$ 63k** e **0 leads** para Meta Ads porque esses dados vêm exclusivamente da **planilha Google Sheets** ("Indicadores 26"). No entanto, a consulta direta à API da Meta retornou **R$ 186k** e ~1.470 leads para fevereiro.

A seção "Atribuição por Canal (Dados Reais)" mostra 958 leads e 12 vendas porque usa dados do **Pipefy CRM**, que é uma fonte diferente.

### Causa raiz

No `MarketingIndicatorsTab.tsx` (linhas 201-242), existe lógica de enriquecimento que substitui dados da planilha por dados da API, mas **apenas para Google Ads**. Meta Ads não tem esse fallback -- usa sempre o valor da planilha, mesmo quando a API retorna dados mais completos.

```text
enrichedChannels logic:
  Google Ads → se planilha = 0, usa API ✅
  Meta Ads   → sempre usa planilha ❌
```

### Plano de correção

1. **Adicionar enriquecimento para Meta Ads** no `enrichedChannels` useMemo, análogo ao Google Ads:
   - Calcular totais da API Meta (`metaCampaigns`) em um `metaAdsApiTotals` useMemo
   - No `enrichedChannels`, quando `ch.id === 'meta_ads'` e a API retornar investimento maior que zero, usar os dados da API como fallback (investimento e leads)

2. **Atualizar `enrichedTotals`** para incluir o delta de Meta Ads (investimento e leads) nos totais recalculados, assim como já faz para Google Ads.

### Impacto

Após a correção, os cards "Mídia e Leads por Canal" mostrarão os valores reais da API Meta (R$ 186k) quando a planilha estiver desatualizada ou incompleta, eliminando a divergência visual.

