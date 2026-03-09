

## Problema identificado

O campo `Campanha` do Pipefy NÃO contém apenas o ID da campanha — ele contém **strings compostas UTM** concatenadas:

- `120238862305660418,utm_content=120238863142690418,utm_term=120238863142760418`
- `null,utm_content=null,utm_term=null`
- `inbound,utm_content=null,utm_term=null`
- `21021732600,utm_content=154204355450,utm_term=cfo financeiro`
- `{{campaign.name}}`

O `sanitizeCampaignField` atual só checa valores exatos (`"1"`, `"inbound"`) e não parseia essas strings compostas. Por isso aparecem na tabela nomes como `null,utm_content=null,utm_term=null`.

## Solução

Criar um **parser de campo UTM composto** no `useMarketingAttribution.ts` que:

1. **Separa a string** por `,` para extrair: `campaignId`, `utm_content` (= conjunto/adset), `utm_term` (= anúncio/keyword)
2. **Sanitiza cada parte** — `"null"`, `"{{...}}"`, `"inbound"` → `undefined`
3. **Usa os valores parseados** como fallback para `conjuntoGrupo` e `palavraChaveAnuncio` quando esses campos estão vazios no card original

### Parsing esperado

| Campo Pipefy raw | → campaign | → conjunto | → anúncio |
|---|---|---|---|
| `120238862305660418,utm_content=120238863142690418,utm_term=120238863142760418` | `120238862305660418` | `120238863142690418` | `120238863142760418` |
| `null,utm_content=null,utm_term=null` | `(Sem campanha)` | `(Sem conjunto)` | `(Sem anúncio)` |
| `21021732600,utm_content=154204355450,utm_term=cfo financeiro` | `21021732600` | `154204355450` | `cfo financeiro` |
| `{{campaign.name}}` | `(Sem campanha)` | — | — |
| `Conversão \| CFOaaS` | `Conversão \| CFOaaS` | — | — |

### Alterações

| Arquivo | Mudança |
|---|---|
| `src/hooks/useMarketingAttribution.ts` | Nova função `parseCompositeUTM(raw)` que extrai campaign/content/term. Atualizar `sanitizeCampaignField` para detectar templates `{{...}}`. No `cardInfos`, parsear `card.campanha` com essa função e usar `utm_content`/`utm_term` como fallback para conjunto e anúncio. |

Isso vai:
- Eliminar as linhas lixo (`null,utm_content=null,...`)
- Resolver IDs de campanhas Meta que estavam "escondidos" dentro da string composta
- Permitir drill-down em conjuntos/anúncios usando os IDs extraídos do utm_content/utm_term
- Manter compatibilidade com campanhas que já têm nome limpo (ex: `Conversão | CFOaaS`)

