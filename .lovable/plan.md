

## Plano: Resolver atribuição de campanhas Meta arquivadas (abordagem segura)

### Estratégia

Manter o fluxo atual (ACTIVE+PAUSED com enrichment) para a tabela de métricas de mídia, e criar uma **segunda query leve** apenas para resolver nomes/IDs de campanhas arquivadas usadas na atribuição CRM. Cache de 24h.

### Alterações

**1. `supabase/functions/fetch-meta-campaigns/index.ts`**

Adicionar uma nova action no body: `{ action: "resolve-names" }`. Quando essa action é recebida:
- Buscar TODAS as campanhas (sem filtro de status) com apenas `fields=id,name` (sem insights, sem batch, sem thumbnails)
- Paginar com cursor `after` para pegar todas
- Cachear no `meta_ads_cache` com key `campaign-names:{accountId}` e TTL de 24h
- Retornar `{ success: true, campaignNames: { [id]: name } }`

O fluxo padrão (sem action) continua igual — ACTIVE+PAUSED com enrichment completo.

**2. `src/hooks/useMetaCampaigns.ts`**

Criar novo hook `useMetaCampaignNames()` que:
- Invoca `fetch-meta-campaigns` com `{ action: "resolve-names" }`
- Retorna `Map<string, string>` (id → name)
- staleTime de 24h, retry 1

**3. `src/hooks/useMarketingAttribution.ts`**

- Receber `campaignNamesMap` como parâmetro opcional
- No `resolveApiCampaign`: se o ID numérico não foi encontrado nas campanhas da API, buscar o nome no `campaignNamesMap` e criar um `CampaignData` stub com o nome resolvido
- Sanitizar valores lixo: `"1"`, `"{{campaign.id}}"`, `"inbound"` → tratar como `undefined`

**4. `src/components/planning/MarketingIndicatorsTab.tsx`**

- Chamar `useMetaCampaignNames()` e passar o mapa para `useMarketingAttribution`

### Por que é seguro

- A query leve busca só `id,name` — sem insights/batch → **1-3 requests** com paginação, executa em <2s
- Cache de 24h evita chamadas repetidas
- O fluxo principal de métricas não muda — zero risco de timeout

### Resumo

| Arquivo | Alteração |
|---|---|
| `fetch-meta-campaigns/index.ts` | Nova action `resolve-names`: query leve sem filtro de status + paginação + cache 24h |
| `useMetaCampaigns.ts` | Novo hook `useMetaCampaignNames()` |
| `useMarketingAttribution.ts` | Usar nomes resolvidos como fallback + sanitizar dados lixo |
| `MarketingIndicatorsTab.tsx` | Integrar novo hook e passar mapa de nomes |

