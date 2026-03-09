

## Problema

Campanhas com vendas que foram resolvidas via `resolve-names` (campanhas arquivadas) aparecem como linhas "CRM-only" na tabela `CampaignsTable`. Essas linhas são renderizadas sem chevron de expansão e sem drill-down (linhas 901-919 do `CampaignsTable.tsx`).

O `CampaignFunnel` dessas linhas tem `campaignId` — um ID válido da Meta que pode ser usado para buscar conjuntos de anúncios via `fetch-campaign-adsets`.

## Solução

Transformar as linhas CRM-only que possuem `campaignId` em linhas expandíveis, reutilizando o componente `CampaignRow` existente.

### Alteração: `src/components/planning/marketing-indicators/CampaignsTable.tsx`

1. **Para linhas CRM-only com `campaignId`**: Criar um `CampaignData` stub a partir do `CampaignFunnel` e renderizar como `CampaignRow` em vez de uma linha flat. Isso habilita automaticamente o drill-down de ad sets/ads via `useCampaignAdSets`.

2. **O stub terá**:
   - `id`: o `campaignId` do funnel
   - `name`: o `campaignName` do funnel
   - `channel`: derivado do `channel` do funnel (meta_ads → 'Meta Ads', google_ads → 'Google Ads')
   - `status`: 'ended'
   - `investment`: 0
   - `leads`: 0 (sem dados da API)

3. **Linhas CRM-only SEM `campaignId`** continuam como linhas flat (orgânico, eventos, etc. não têm drill-down).

### Resultado esperado

- As 3 campanhas com vendas terão chevron clicável
- Ao expandir, os conjuntos de anúncios serão carregados via Meta API
- Dentro dos conjuntos, os anúncios individuais também carregam
- As métricas CRM (MQL, Vendas, Receita) continuam aparecendo via `adSetFunnels`

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `CampaignsTable.tsx` | Converter CRM-only rows com `campaignId` para `CampaignRow` expandível |

