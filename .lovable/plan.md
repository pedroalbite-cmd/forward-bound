

## Plano: Corrigir atribuicao de Leads/MQLs do Google Ads nas campanhas

### Problema

As campanhas do Google Ads na tabela "Campanhas e Anuncios" mostram "-" nas colunas de CRM (Leads, MQLs, Vendas, Receita, ROI). Isso ocorre porque o matching entre cards do Pipefy e campanhas da API do Google falha.

### Causa raiz

O fluxo de matching em `useMarketingAttribution.ts` funciona assim:
1. O campo `card.campanha` do Pipefy contem o nome da campanha (ex: "Modelo Atual - Busca")
2. O matching tenta: ID numerico (so Meta) → ID exato → nome normalizado
3. Para Google, o `campaignById` mapeia `google_12345` e `12345`, mas o card tem o **nome** da campanha, nao o ID
4. O fallback por nome normalizado pode falhar por diferencas sutis de formatacao entre Pipefy e a API do Google

Alem disso, cards com `gclid` mas **sem** campo `campanha` preenchido caem em "(Sem campanha)" e nunca sao atribuidos.

### Solucao

**Arquivo**: `src/hooks/useMarketingAttribution.ts`

1. **Matching parcial de nomes**: Alem do match exato normalizado, adicionar comparacao parcial (`.includes()`) entre o nome da campanha no Pipefy e os nomes das campanhas da API Google
2. **Fallback por canal**: Se um card tem `gclid` (detectado como `google_ads`) mas nao matchou nenhuma campanha, tentar atribuir pela campanha Google com nome mais similar
3. **Matching bidirecional**: Na funcao `getFunnel` do `CampaignsTable.tsx`, tambem iterar pelos funnels para encontrar matches parciais quando o lookup direto falha

**Arquivo**: `src/components/planning/marketing-indicators/CampaignsTable.tsx`

4. Melhorar `getFunnel` para tentar match parcial de nome quando os lookups por ID e nome exato falham

### Detalhes tecnicos

No `useMarketingAttribution.ts`, ao resolver a campanha (linhas 162-176), adicionar:
- Apos falha no match por ID e nome exato, iterar `allApiCampaigns` filtrando por canal Google e comparar nomes com `.includes()` bidirecional
- No `CampaignsTable.tsx`, no `getFunnel`, se nenhum match direto for encontrado para campanhas Google, fazer scan linear dos funnels comparando nomes normalizados com `.includes()`

Nenhuma alteracao de banco necessaria.

