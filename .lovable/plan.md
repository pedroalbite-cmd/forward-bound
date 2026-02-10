

# Hierarquia Completa Meta Ads: Campanha > Conjunto > Anuncio

## Resumo

Adicionar o 3o nivel de hierarquia (Anuncios individuais) na tabela de campanhas do Meta Ads, incluir metricas extras (CTR, Alcance, Frequencia, CPA, ROAS, Conversoes) em todos os niveis, e implementar modal de preview dos criativos ao clicar na thumbnail.

## Estrutura final da hierarquia

```text
Campanha (nivel 1)
  |-- Conjunto de Anuncios (nivel 2) -- carregado on-demand ao expandir campanha
       |-- Anuncio individual (nivel 3) -- carregado on-demand ao expandir conjunto
```

## Mudancas

### 1. Novo tipo `AdData` e metricas extras nos tipos existentes

**Arquivo: `src/components/planning/marketing-indicators/types.ts`**

- Adicionar interface `AdData` com: id, name, status, spend, impressions, clicks, leads, cpl, ctr, reach, frequency, cpa, thumbnailUrl, previewUrl
- Adicionar campos opcionais em `AdSetData`: ctr, reach, frequency, cpa, ads (AdData[])
- Adicionar campos opcionais em `CampaignData`: ctr, reach, frequency, cpa, conversions, roas (atualizado para vir da API)

### 2. Nova Edge Function `fetch-adset-ads`

**Novo arquivo: `supabase/functions/fetch-adset-ads/index.ts`**

- Recebe: `adSetId`, `startDate`, `endDate`
- Busca todos os anuncios do ad set via `{adSetId}/ads?fields=id,name,status,creative{thumbnail_url,image_url,object_story_spec}`
- Usa Batch API para buscar insights de cada anuncio: `spend,impressions,clicks,actions,reach,frequency,cpc,cpm,ctr`
- Cache em `meta_ads_cache` com chave `ads:{adSetId}:{startDate}:{endDate}`
- Fallback para cache stale em caso de rate limit (mesmo padrao do fetch-campaign-adsets)

### 3. Atualizar Edge Functions existentes para metricas extras

**Arquivo: `supabase/functions/fetch-meta-campaigns/index.ts`**

- Adicionar `reach,frequency,ctr` ao `insightsFields`
- Essas metricas ja vem gratuitamente na mesma chamada de insights

**Arquivo: `supabase/functions/fetch-campaign-adsets/index.ts`**

- Adicionar `reach,frequency,ctr` ao `insightsFields`

### 4. Novo hook `useAdSetAds`

**Novo arquivo: `src/hooks/useAdSetAds.ts`**

- Similar ao `useCampaignAdSets` mas invoca `fetch-adset-ads`
- Transforma a resposta em `AdData[]`
- Carregamento on-demand (enabled quando adSetId nao e null)
- Tratamento de rate limit com retry exponencial

### 5. Atualizar hooks existentes para novas metricas

**Arquivo: `src/hooks/useMetaCampaigns.ts`**

- Extrair `reach`, `frequency`, `ctr` do insights response
- Calcular `cpa` = spend / conversions (se houver)

**Arquivo: `src/hooks/useCampaignAdSets.ts`**

- Extrair `reach`, `frequency`, `ctr` do insights response

### 6. Refatorar `CampaignsTable.tsx` para 3 niveis

**Arquivo: `src/components/planning/marketing-indicators/CampaignsTable.tsx`**

Mudancas principais:

- **Novas colunas no header**: CTR, Alcance, Frequencia (alem das existentes)
- **Nivel 2 (Ad Set)**: agora e expansivel -- clique no ad set abre os anuncios individuais dentro dele
- **Nivel 3 (Anuncio)**: nova row com indentacao dupla (`|  |-- Nome do anuncio`), mostra thumbnail, metricas e link para Ads Manager
- **Componente `AdSetRow`**: novo componente interno que gerencia a expansao do nivel 3 e usa o hook `useAdSetAds`
- **Thumbnail clicavel**: ao clicar na thumbnail de qualquer nivel, abre um `Dialog` (modal) com a imagem em tamanho grande

### 7. Modal de preview do criativo

**Dentro de `CampaignsTable.tsx`** (ou componente separado):

- Usar `Dialog` do Radix para mostrar a imagem/thumbnail em tamanho completo
- Exibir nome do anuncio, metricas principais e link para o Ads Manager
- Fechar ao clicar fora ou no X

### 8. Configuracao da nova Edge Function

**Arquivo: `supabase/config.toml`**

- Adicionar entrada `[functions.fetch-adset-ads]` com `verify_jwt = false`

## Colunas da tabela final

| Coluna | Campanha | Conjunto | Anuncio |
|--------|----------|----------|---------|
| Preview (thumbnail) | Sim | Sim | Sim |
| Nome | Sim | Sim | Sim |
| Objetivo/Tipo | Sim | "Conjunto" | "Anuncio" |
| Impressoes | Sim | Sim | Sim |
| Cliques | Sim | Sim | Sim |
| CTR | Sim | Sim | Sim |
| Alcance | Sim | Sim | Sim |
| Frequencia | Sim | Sim | Sim |
| Leads | Sim | Sim | Sim |
| Gasto | Sim | Sim | Sim |
| CPL | Sim | Sim | Sim |
| CPA | Sim | Sim | Sim |
| Status | Sim | Sim | Sim |

## Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `src/components/planning/marketing-indicators/types.ts` | Editar - novo tipo AdData + campos extras |
| `supabase/functions/fetch-adset-ads/index.ts` | Novo - Edge Function para anuncios |
| `supabase/functions/fetch-meta-campaigns/index.ts` | Editar - metricas extras |
| `supabase/functions/fetch-campaign-adsets/index.ts` | Editar - metricas extras |
| `src/hooks/useAdSetAds.ts` | Novo - hook para buscar anuncios |
| `src/hooks/useMetaCampaigns.ts` | Editar - transformar novas metricas |
| `src/hooks/useCampaignAdSets.ts` | Editar - transformar novas metricas |
| `src/components/planning/marketing-indicators/CampaignsTable.tsx` | Editar - 3 niveis + modal + novas colunas |
| `supabase/config.toml` | Editar - registrar nova function |

## Consideracoes tecnicas

- Cada expansao de nivel faz uma chamada API sob demanda (lazy loading) para evitar chamadas desnecessarias
- Cache de 60 min em todos os niveis para minimizar chamadas a API do Meta
- Fallback automatico para cache stale em caso de rate limit
- A Batch API do Meta aceita ate 50 requests por batch, suficiente para a maioria dos ad sets/ads
