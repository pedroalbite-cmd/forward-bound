
# Integracao Google Ads API

## Visao Geral

Criar uma integracao com a API do Google Ads similar a que ja existe para o Meta Ads. A arquitetura seguira o mesmo padrao: Edge Function como proxy para a API, cache no banco, hooks React para consumo, e exibicao na tabela de campanhas existente.

## Credenciais Necessarias

Voce precisara fornecer 5 secrets:

| Secret | Descricao |
|--------|-----------|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Token de desenvolvedor aprovado pelo Google |
| `GOOGLE_ADS_CLIENT_ID` | OAuth2 Client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth2 Client Secret |
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth2 Refresh Token |
| `GOOGLE_ADS_CUSTOMER_ID` | ID da conta Google Ads (sem hifens, ex: 1234567890) |

## Etapas de Implementacao

### 1. Configurar os secrets
Solicitar que voce insira cada uma das 5 credenciais acima.

### 2. Criar Edge Function `fetch-google-campaigns`
- Autentica via OAuth2 (refresh token -> access token)
- Consulta a API REST do Google Ads (`googleads.googleapis.com/v23`)
- Usa GAQL (Google Ads Query Language) para buscar campanhas com metricas:

```text
SELECT campaign.id, campaign.name, campaign.status,
       metrics.cost_micros, metrics.impressions, metrics.clicks,
       metrics.conversions, metrics.ctr
FROM campaign
WHERE segments.date BETWEEN '{startDate}' AND '{endDate}'
  AND campaign.status IN ('ENABLED', 'PAUSED')
```

- Implementa cache na tabela `meta_ads_cache` (renomeando conceitualmente para "ads_cache", mas reutilizando a mesma tabela)
- Hierarquia: Campanha -> Grupo de Anuncios -> Anuncios (3 consultas GAQL separadas, sob demanda)

### 3. Criar Edge Function `fetch-google-adgroups`
- Carregamento sob demanda (lazy-load) ao expandir uma campanha
- Busca grupos de anuncio de uma campanha especifica com metricas

### 4. Criar Edge Function `fetch-google-ads`
- Carregamento sob demanda ao expandir um grupo de anuncio
- Busca anuncios individuais com metricas

### 5. Criar hooks React
- `useGoogleCampaigns(startDate, endDate)` — similar ao `useMetaCampaigns`
- `useGoogleAdGroups(campaignId, startDate, endDate)` — similar ao `useCampaignAdSets`
- `useGoogleAds(adGroupId, startDate, endDate)` — similar ao `useAdSetAds`

### 6. Integrar na aba Mkt Indicadores
- No `MarketingIndicatorsTab.tsx`, chamar `useGoogleCampaigns` ao lado de `useMetaCampaigns`
- Combinar as campanhas de ambas as fontes na `CampaignsTable`
- Adicionar badge "Google Ads" / "Meta Ads" para diferenciar a origem de cada campanha
- O drill-down de ad groups/ads usara os hooks do Google quando a campanha for do Google Ads

### 7. Atualizar `CampaignsTable`
- Detectar automaticamente se a campanha e Meta ou Google para usar o hook correto no drill-down
- Adaptar os links externos para abrir no Google Ads Manager em vez do Meta Ads Manager
- Manter a mesma estrutura visual (hierarquia 3 niveis colapsavel)

## Detalhes Tecnicos

**Autenticacao OAuth2**: A Edge Function faz um POST para `https://oauth2.googleapis.com/token` com client_id, client_secret e refresh_token para obter um access_token temporario. Esse token e usado no header `Authorization: Bearer` das chamadas a API.

**Google Ads API v23**: Usa o endpoint REST `https://googleads.googleapis.com/v23/customers/{customerId}/googleAds:searchStream` com queries GAQL. O header `developer-token` e obrigatorio em todas as chamadas.

**Valores monetarios**: O Google Ads retorna valores em micros (1.000.000 = R$ 1,00), que serao convertidos para reais na transformacao.

**Cache**: Reutiliza a tabela `meta_ads_cache` com chaves prefixadas `google:campaigns:...` para evitar criar nova tabela.

## Arquivos Criados/Alterados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/fetch-google-campaigns/index.ts` | Criar |
| `supabase/functions/fetch-google-adgroups/index.ts` | Criar |
| `supabase/functions/fetch-google-ads/index.ts` | Criar |
| `supabase/config.toml` | Adicionar 3 funcoes |
| `src/hooks/useGoogleCampaigns.ts` | Criar |
| `src/hooks/useGoogleAdGroups.ts` | Criar |
| `src/hooks/useGoogleAds.ts` | Criar |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Alterar (adicionar Google Ads) |
| `src/components/planning/marketing-indicators/CampaignsTable.tsx` | Alterar (suportar ambas fontes) |
