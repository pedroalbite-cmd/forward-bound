
# Integrar Funil Real nas Campanhas e Anuncios (Meta Ads)

## Problema Atual

1. A tabela "Funil por Campanha" esta separada da tabela "Campanhas e Anuncios" -- devem ser uma coisa so
2. O campo `Campanha` no Pipefy guarda o **ID numerico da campanha Meta** (ex: "120238862305660418"), nao o nome. Por isso o cruzamento por nome nao funciona e muitas campanhas aparecem como "Organico" quando na verdade sao Meta Ads

## Solucao

Unificar tudo na tabela `CampaignsTable` existente, adicionando colunas do funil real (Leads Pipefy, MQLs, Vendas, Receita, ROI) diretamente em cada linha de campanha Meta. O cruzamento sera feito por **ID da campanha** (o que o Pipefy armazena) em vez de por nome.

## Mudancas

### 1. Corrigir o cruzamento no `useMarketingAttribution`

**Arquivo: `src/hooks/useMarketingAttribution.ts`**

- Alterar o matching de campanhas: em vez de comparar o campo `campanha` do Pipefy com o `name` da Meta, comparar com o `id` da campanha Meta
- Isso resolve o problema de campanhas classificadas como "Organico" quando tem ID Meta no campo Campanha
- Manter o fallback por nome para casos onde o Pipefy tem o nome e nao o ID
- Cards cujo campo `campanha` comeca com numeros longos (>10 digitos) --> tentar match por ID
- Se o campo `campanha` contem um ID Meta valido, automaticamente classificar como canal `meta_ads`

### 2. Adicionar dados do funil no `CampaignsTable`

**Arquivo: `src/components/planning/marketing-indicators/CampaignsTable.tsx`**

- Receber nova prop `campaignFunnels: CampaignFunnel[]` (dados do hook de atribuicao)
- Para cada campanha Meta na tabela, buscar o funil correspondente pelo ID
- Adicionar novas colunas apos as existentes: `Leads (Pipefy)`, `MQLs`, `Vendas`, `Receita`, `ROI`
- Na linha de totais no rodape, somar os valores do funil tambem
- As colunas de funil terao cor verde para ROI >= 1 e vermelho para ROI < 1

### 3. Remover a tabela separada `CampaignFunnelTable`

**Arquivo: `src/components/planning/MarketingIndicatorsTab.tsx`**

- Remover o import e uso de `CampaignFunnelTable`
- Passar `campaignFunnels` como prop para `CampaignsTable`
- Manter os `ChannelAttributionCards` (cards resumo por canal) como secao separada acima

### 4. Atualizar a interface `CampaignsTableProps`

**Arquivo: `src/components/planning/marketing-indicators/CampaignsTable.tsx`**

- Adicionar `campaignFunnels?: CampaignFunnel[]` na interface de props
- Criar funcao utilitaria `getFunnelForCampaign(campaignId: string)` que busca o funil correspondente

## Colunas finais da tabela unificada

| Expand | Preview | Nome | Tipo | Impressoes | Cliques | CTR | Alcance | Freq. | Leads (Meta) | Gasto | CPL | CPA | Status | **Leads (CRM)** | **MQLs** | **Vendas** | **Receita** | **ROI** |

As 5 ultimas colunas sao novas e vem do cruzamento com dados reais do Pipefy.

## Fluxo de cruzamento corrigido

```text
Pipefy card.campanha = "120238862305660418"
Meta API campaign.id = "120238862305660418"
                           |
                     MATCH POR ID
                           |
             Campanha "NX_CONVERSAO_FORMS"
             + Funil: 56 leads, 29 MQLs, 1 venda, R$ 52k receita
             + Gasto Meta: R$ 5k
             = ROI: 10.4x
```

## Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `src/hooks/useMarketingAttribution.ts` | Editar - cruzamento por ID + por nome, detectar canal meta_ads por ID numerico |
| `src/components/planning/marketing-indicators/CampaignsTable.tsx` | Editar - adicionar colunas de funil, receber `campaignFunnels` como prop |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Editar - remover `CampaignFunnelTable`, passar funnels para `CampaignsTable` |
| `src/components/planning/marketing-indicators/types.ts` | Editar - adicionar `campaignId` opcional em `CampaignFunnel` |

## Detalhes tecnicos

- O campo `Campanha` no Pipefy pode conter: um ID numerico Meta (ex: "120238862305660418"), um nome de campanha (ex: "inbound"), ou nada. A logica de deteccao sera: se o valor e um numero com mais de 10 digitos, tratar como ID Meta; caso contrario, tratar como nome
- O cruzamento por ID e exato (sem fuzzy matching), garantindo precisao
- Campanhas no Pipefy sem correspondencia na Meta API ficam como "campanha nao vinculada" e nao aparecem na tabela unificada (apenas nos ChannelAttributionCards)
- Cards com campo `campanha` contendo ID Meta serao automaticamente reclassificados como canal `meta_ads`, resolvendo o problema de aparecerem como "Organico"
