

## Diagnóstico: Por que a atribuição no dashboard está errada

Identifiquei **2 bugs** no código que explicam por que os dados que mapeamos manualmente não aparecem corretamente na tabela de campanhas.

### Bug 1: `detectChannel` não parseia UTM composto

A função `detectChannel` (linha 45) verifica `isMetaCampaignId(card.campanha)` com o campo **raw** do CRM. Para strings compostas como `120238862305660418,utm_content=120238863142690418`, o regex `^\d{10,}$` **falha** por causa das vírgulas. Se o card também não tiver `fbclid` nem `Fonte` = ig/fb, ele cai em `organico` — quando deveria ser `meta_ads`.

Resultado: vendas que vieram de Meta Ads aparecem como "Orgânico" na tabela.

### Bug 2: AdSet lookup compara IDs numéricos contra nomes textuais

O `adSetFunnels` do CRM usa IDs numéricos como chave do conjunto (ex: `120238863142690418`), enquanto a API Meta retorna nomes textuais (ex: `NX_CONVERSAO_CFOaaS_EVENTO_MQL_Interesses`). O `lookupAdSetFunnel` tenta match parcial entre esses valores — que nunca dá match porque um é número puro e outro é texto.

Resultado: ao expandir uma campanha, os ad sets da API aparecem mas sem nenhuma métrica CRM (MQL, Venda, Receita ficam zerados).

### Solução

| Arquivo | Mudança |
|---|---|
| `useMarketingAttribution.ts` | 1. Na `detectChannel`: extrair o primeiro segmento antes da vírgula e testar com `isMetaCampaignId` (3 linhas). 2. No `adSetFunnels` memo: ao construir as chaves, tentar resolver IDs numéricos de conjunto para o nome da API via um lookup reverso (id→name), de forma que a chave use o mesmo nome que o `lookupAdSetFunnel` vai procurar. |
| `CampaignsTable.tsx` | Nenhuma mudança necessária — os bugs são puramente na camada de dados. |

### Detalhes técnicos

**Fix 1 — detectChannel:**
```typescript
// Antes da checagem isMetaCampaignId, extrair primeira parte
const rawCampanha = (card.campanha || '').split(',')[0].trim();
if (rawCampanha && isMetaCampaignId(rawCampanha)) return 'meta_ads';
```

**Fix 2 — adSetFunnels key resolution:**
No memo `adSetFunnels`, quando `info.conjunto` é um ID numérico Meta (10+ dígitos), buscar no `allApiCampaigns` → `adSets` (ou usar o `campaignNamesMap` estendido para ad sets) o nome real do conjunto. Se não encontrar, manter o ID como chave. Isso permite que o `lookupAdSetFunnel` faça match por nome.

Como não temos um lookup de ad set names pré-carregado, a solução pragmática é inverter a lógica: no `lookupAdSetFunnel`, além de comparar por nome, **também comparar o ID do ad set da API** contra o valor numérico do CRM. Ou seja, adicionar ao `lookupAdSetFunnel` uma checagem: se o `adSet.id` (da API) === `normAdSet` (do CRM), retornar match.

Isso requer passar os IDs dos ad sets para o lookup, ou ajustar o `CampaignRow` para fornecer o `adSet.id` ao `lookupAdSetFunnel`.

### Resumo do impacto

- Fix 1 resolve a classificação errada de canal (Orgânico → Meta Ads)
- Fix 2 resolve as métricas CRM zeradas nos ad sets expandidos
- Juntos, as 3 campanhas com vendas de fevereiro vão aparecer corretamente com drill-down funcional

