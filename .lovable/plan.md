

## Extrair Palavras-Chave do Google Ads

### Arquitetura

Criar uma nova Edge Function `fetch-google-keywords` e um hook `useGoogleKeywords` para extrair palavras-chave de campanhas ou grupos de anuncios, com metricas de performance.

### 1. Edge Function `supabase/functions/fetch-google-keywords/index.ts`

- Recebe `campaignId` ou `adGroupId`, `startDate`, `endDate`
- Query GAQL:
```sql
SELECT keyword_view.resource_name,
       ad_group_criterion.keyword.text,
       ad_group_criterion.keyword.match_type,
       ad_group_criterion.status,
       ad_group.name,
       campaign.name,
       metrics.cost_micros, metrics.impressions, metrics.clicks,
       metrics.conversions, metrics.ctr
FROM keyword_view
WHERE campaign.id = {campaignId}
  AND segments.date BETWEEN '{startDate}' AND '{endDate}'
```
- Agrega por keyword (mesma palavra pode ter rows por dia)
- Retorna: `{ success, keywords: [{ text, matchType, adGroupName, spend, impressions, clicks, conversions, ctr, cpl }] }`
- Cache via `meta_ads_cache` (mesmo padrao das outras functions)

### 2. Hook `src/hooks/useGoogleKeywords.ts`

- Aceita `campaignId` ou `adGroupId`, `startDate`, `endDate`
- Chama `supabase.functions.invoke('fetch-google-keywords', ...)`
- Retorna array tipado de keywords com metricas

### 3. Exibicao no UI (fase futura)

A integracao no drill-down da tabela de campanhas Google pode ser feita depois. O foco agora e criar a infraestrutura de dados.

| Arquivo | Acao |
|---------|------|
| `supabase/functions/fetch-google-keywords/index.ts` | Criar - Edge Function com query GAQL de keyword_view |
| `src/hooks/useGoogleKeywords.ts` | Criar - Hook React Query |

