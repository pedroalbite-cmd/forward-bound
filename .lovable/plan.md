

# Fix: Campanhas antigas sem dados CRM (fallback por nome)

## Problema

Campanhas antigas no Pipefy armazenam o **nome** da campanha (ex: "inbound", "conversao_forms") em vez do ID numerico. O cruzamento atual funciona assim:

1. `useMarketingAttribution` tenta associar cada campanha do Pipefy com uma campanha Meta por ID ou nome normalizado
2. `CampaignsTable` usa `funnelMap.get(campaign.id)` para buscar o funil -- mas so funciona se o `campaignId` no funil corresponde ao `id` da campanha Meta

O problema e que quando o nome no Pipefy nao corresponde exatamente ao nome da API Meta (apos normalizacao), o funil e criado sem `campaignId`, e portanto nao aparece na tabela.

## Solucao

Duas mudancas complementares:

### 1. Melhorar o fallback por nome no `funnelMap` do `CampaignsTable`

**Arquivo: `src/components/planning/marketing-indicators/CampaignsTable.tsx`**

- Alem do lookup por `campaignId`, adicionar lookup por **nome normalizado** da campanha
- O `funnelMap` passa a ter duas entradas por funil: uma pelo ID e outra pelo nome normalizado
- Isso garante que mesmo campanhas sem match de ID encontrem seu funil pela correspondencia de nomes

### 2. Melhorar a normalizacao no `useMarketingAttribution`

**Arquivo: `src/hooks/useMarketingAttribution.ts`**

- Alem de normalizar acentos/caixa/espacos, remover tambem underscores e hifens para matching mais flexivel
- Exemplo: "NX_CONVERSAO_FORMS" e "nx conversao forms" devem dar match
- Adicionar lookup reverso: para cada campanha Meta, tentar encontrar se algum funil do Pipefy contem parte do nome como substring

## Detalhes tecnicos

No `CampaignsTable`, o `funnelMap` sera construido assim:

```
// Lookup por ID (existente)
map.set(funnel.campaignId, funnel)

// Lookup por nome normalizado (novo)
map.set(normalize(funnel.campaignName), funnel)
```

E o lookup na renderizacao:

```
const funnel = funnelMap.get(campaign.id) || funnelMap.get(normalize(campaign.name))
```

Na funcao `normalizeName` do hook, adicionar:

```
.replace(/[_-]/g, ' ')  // underscores e hifens viram espaco
```

## Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `src/components/planning/marketing-indicators/CampaignsTable.tsx` | Editar - adicionar fallback por nome normalizado no funnelMap |
| `src/hooks/useMarketingAttribution.ts` | Editar - melhorar normalizacao (underscores, hifens) |

