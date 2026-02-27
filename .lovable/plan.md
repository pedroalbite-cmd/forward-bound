

## Vincular dados do Pipefy (CRM) às campanhas Google Ads

### Problema

O `useMarketingAttribution` so faz matching de cards CRM com campanhas **Meta Ads** (por ID numerico e por nome). Cards com `gclid` ou `fonte=googleads` sao detectados como `google_ads`, mas o nome da campanha no Pipefy nao e cruzado com as campanhas da API do Google. Resultado: colunas CRM (Leads CRM, MQLs, Vendas, Receita, TCV, ROI) ficam vazias para campanhas Google.

### Alteracoes

#### 1. `src/hooks/useMarketingAttribution.ts`

- Renomear parametro `metaCampaigns` para `allApiCampaigns` (ja recebe Meta + Google)
- No bloco de lookup (linhas 141-149), incluir campanhas Google no mapa de nomes normalizados
- Para campanhas Google, mapear tanto `google_123` quanto o ID raw `123` e o nome normalizado
- Assim o matching por nome fuzzy funciona para ambas as plataformas

#### 2. `src/components/planning/marketing-indicators/CampaignsTable.tsx`

- No `funnelMap` (linha 504-520), adicionar lookup pelo `_googleId` raw para campanhas Google
- Ao buscar o funnel de uma campanha Google, tentar: `campaign.id` (`google_123`), `_googleId` (`123`), e nome normalizado

### Resultado esperado

```text
Campanha Google        | Leads | Gasto  | CPL  | ... | Leads(CRM) | MQLs | Vendas | Receita | ROI
├─ Campanha X          |   30  | R$10k  | R$33 | ... |     8      |  5   |   2    | R$ 15k  | 1.5x
```

| Arquivo | Acao |
|---------|------|
| `src/hooks/useMarketingAttribution.ts` | Incluir campanhas Google no lookup de matching |
| `src/components/planning/marketing-indicators/CampaignsTable.tsx` | Adicionar fallback por `_googleId` no `funnelMap` |

