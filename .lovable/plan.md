

## Plano: Mostrar dados CRM nos sub-níveis (Conjuntos/Grupos e Anúncios)

### Problema
Ao expandir uma campanha, os sub-níveis (conjuntos de anúncios Meta / grupos Google) não mostram as colunas CRM (Leads CRM, MQLs, Vendas, Receita, TCV, ROI) — aparecem zerados ou sem colunas. Isso ocorre porque a atribuição CRM só é feita no nível da campanha.

### Causa raiz
1. Os cards do Pipefy têm o campo `conjuntoGrupo` (mapeado de "Conjunto/grupo") que identifica o ad set/ad group de origem
2. O hook `useMarketingAttribution` agrupa apenas por campanha, ignorando esse campo
3. Os sub-rows (AdSetRow, GoogleAdGroupRow, AdRow) não renderizam as 6 colunas CRM extras, causando desalinhamento

### Solução

**1. `src/hooks/useMarketingAttribution.ts`**
- Criar um segundo agrupamento por `campaign::conjuntoGrupo::channel` que produz `adSetFunnels: Map<string, CampaignFunnel>` com a mesma estrutura de dados (leads, mqls, vendas, receita, etc.)
- A chave de lookup será o nome normalizado do conjunto/grupo
- Retornar `{ campaignFunnels, channelSummaries, adSetFunnels }`

**2. `src/components/planning/marketing-indicators/CampaignsTable.tsx`**
- Receber `adSetFunnels` como prop e criar um helper `getAdSetFunnel(campaignName, adSetName)` para buscar o funnel do sub-nível
- Em `AdSetRow` e `GoogleAdGroupRow`: adicionar 6 `<TableCell>` extras para Leads CRM, MQLs, Vendas, Receita, TCV e ROI
- Em `AdRow` e `GoogleKeywordRow`: adicionar 6 `<TableCell>` vazios para manter alinhamento da tabela (não há dados CRM nesse nível de granularidade)

**3. Passagem de dados**
- `CampaignRow` recebe `adSetFunnels` e passa para cada `AdSetRow`/`GoogleAdGroupRow`
- Matching por nome normalizado do ad set/ad group contra o `conjuntoGrupo` do card

### Limitação
- O nível mais granular com dados CRM será o **conjunto/grupo**. Anúncios individuais e palavras-chave mostrarão "—" nas colunas CRM (o Pipefy não registra qual anúncio específico gerou o lead)

