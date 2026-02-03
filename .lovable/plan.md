

## Solução para Reduzir Erros de Rate Limit do Meta Ads

### Problema Atual

A API do Meta Ads tem limites de requisições por conta de anúncios (~200 chamadas/hora para contas padrão). Atualmente, cada vez que você expande uma campanha:

| Ação | Chamadas à API |
|------|----------------|
| Listar ad sets | 1 |
| Insights por ad set | N (uma por ad set) |
| Thumbnail por ad set | N (uma por ad set) |
| **Total** | **2N + 1** |

Se uma campanha tem 5 ad sets = 11 chamadas. Expandir 3 campanhas rapidamente = 33 chamadas em segundos.

---

### Soluções Propostas

Implementaremos 3 estratégias complementares:

#### 1. Cache no Banco de Dados (Principal)

Criar tabela para armazenar dados do Meta com TTL de 1 hora:

```sql
CREATE TABLE meta_ads_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_meta_ads_cache_key ON meta_ads_cache(cache_key);
CREATE INDEX idx_meta_ads_cache_expires ON meta_ads_cache(expires_at);
```

#### 2. Batch API do Meta (Reduz Chamadas)

Usar a [Batch API](https://developers.facebook.com/docs/marketing-api/asyncrequests/batch-requests) do Meta para combinar múltiplas requisições:

```typescript
// Antes: 11 chamadas separadas para 5 ad sets
// Depois: 1 chamada batch com 11 operações

const batchRequest = adSets.map(adSet => ({
  method: 'GET',
  relative_url: `${adSet.id}/insights?fields=spend,impressions,clicks,actions`
}));

fetch(`${META_BASE_URL}?batch=${JSON.stringify(batchRequest)}&access_token=${token}`);
```

#### 3. Throttling Inteligente

Adicionar delays entre grupos de chamadas:

```typescript
// Processar em lotes de 2 com delay de 1 segundo entre lotes
const BATCH_SIZE = 2;
const DELAY_MS = 1000;
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| **Nova migração SQL** | Criar tabela `meta_ads_cache` |
| `supabase/functions/fetch-campaign-adsets/index.ts` | Adicionar cache + batch API + throttling |
| `supabase/functions/fetch-meta-campaigns/index.ts` | Adicionar cache + batch API |

---

### Implementação Detalhada

#### Edge Function com Cache

```typescript
// 1. Verificar cache primeiro
async function getCachedData(supabase, cacheKey: string) {
  const { data } = await supabase
    .from('meta_ads_cache')
    .select('data')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  return data?.data || null;
}

// 2. Salvar no cache após buscar
async function setCachedData(supabase, cacheKey: string, data: any, ttlMinutes = 60) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  
  await supabase
    .from('meta_ads_cache')
    .upsert({
      cache_key: cacheKey,
      data,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: 'cache_key' });
}

// 3. Fluxo principal
const cacheKey = `adsets:${campaignId}:${startDate}:${endDate}`;
const cached = await getCachedData(supabase, cacheKey);

if (cached) {
  return cached; // Retorna do cache, 0 chamadas à API
}

// Se não tem cache, busca com batch API
const freshData = await fetchWithBatchAPI(campaignId, startDate, endDate);
await setCachedData(supabase, cacheKey, freshData);
return freshData;
```

---

### Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Primeira visualização | 11 chamadas | 2-3 chamadas (batch) |
| Visualização repetida (< 1h) | 11 chamadas | 0 chamadas (cache) |
| 3 campanhas seguidas | 33 chamadas | 6-9 chamadas |

**Redução de ~70-90% nas chamadas à API**

---

### Limpeza Automática do Cache

Adicionar função para limpar entradas expiradas:

```sql
-- Executar periodicamente via cron ou trigger
DELETE FROM meta_ads_cache WHERE expires_at < now();
```

---

### Diagrama do Fluxo

```text
Usuário expande campanha
         │
         ▼
┌──────────────────────┐
│ Verificar cache      │
│ (meta_ads_cache)     │
└────────┬─────────────┘
         │
    ┌────┴────┐
    │ Cache   │
    │ válido? │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   Sim       Não
    │         │
    ▼         ▼
┌───────┐  ┌───────────────┐
│Retorna│  │Batch API Meta │
│cache  │  │+ Throttling   │
└───────┘  └───────┬───────┘
                   │
                   ▼
           ┌─────────────┐
           │Salvar cache │
           │+ Retornar   │
           └─────────────┘
```

