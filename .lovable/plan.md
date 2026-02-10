

# Integracao de Atribuicao Pipefy na Aba Mkt Indicadores

## Resumo

Criar um novo hook que extrai os campos de atribuicao de marketing (Campanha, Conjunto/grupo, Fonte, fbclid, gclid, Origem do lead, etc.) do banco de dados externo (pipefy_moviment_cfos + pipefy_cards_movements), e usar esses dados para construir:

1. **Funil real por campanha** -- cada campanha do Pipefy com seus leads, MQLs, RMs, RRs, Propostas e Vendas
2. **ROI real por campanha** -- cruzando gasto da API do Meta Ads com receita real do Pipefy
3. **Atribuicao automatica por canal** -- Meta Ads (fbclid), Google Ads (gclid), Organico, Eventos

## Fontes de Dados

```text
Dados de CUSTO (investimento):
  API Meta Ads (fetch-meta-campaigns) --> gasto por campanha
  Google Sheets (read-marketing-sheet) --> gasto Google Ads

Dados de RESULTADO (leads/vendas):
  pipefy_moviment_cfos --> Modelo Atual (campos: Campanha, Conjunto/grupo, Fonte, fbclid, gclid)
  pipefy_cards_movements --> O2 TAX, Oxy Hacker, Franquia (mesmos campos)

CRUZAMENTO:
  Nome da campanha no Pipefy  <-->  Nome da campanha na API Meta Ads
  fbclid presente             -->  Canal = Meta Ads
  gclid presente              -->  Canal = Google Ads
  Nenhum tracking ID          -->  Canal = Organico/Outros
```

## Mudancas

### 1. Expandir o parsing dos dados para incluir campos de atribuicao

**Arquivo: `src/hooks/useModeloAtualAnalytics.ts`**

- Adicionar campos na interface `ModeloAtualCard`:
  - `campanha?: string` -- campo "Campanha" do banco
  - `conjuntoGrupo?: string` -- campo "Conjunto/grupo" do banco
  - `palavraChaveAnuncio?: string` -- campo "Palavra-chave/anúncio" do banco
  - `fonte?: string` -- campo "Fonte" do banco
  - `origemLead?: string` -- campo "Origem do lead" do banco
  - `tipoOrigem?: string` -- campo "Tipo de Origem do lead" do banco
  - `paginaOrigem?: string` -- campo "Página de origem" do banco
  - `posicionamento?: string` -- campo "Posicionamento" do banco
  - `fbclid?: string` -- campo "fbclid" do banco
  - `gclid?: string` -- campo "gclid" do banco
- Atualizar `parseCardRow()` para extrair esses campos de cada row

**Arquivo: `src/hooks/useExpansaoAnalytics.ts`** (similar)

- Adicionar os mesmos campos na interface `ExpansaoCard`
- Atualizar o parsing para extrair atribuicao

### 2. Novo hook `useMarketingAttribution`

**Novo arquivo: `src/hooks/useMarketingAttribution.ts`**

Este hook centraliza a logica de atribuicao, recebendo os cards de todas as BUs e produzindo:

```text
Interface CampaignFunnel {
  campaignName: string;
  channel: 'meta_ads' | 'google_ads' | 'organico' | 'eventos' | 'outros';
  leads: number;
  mqls: number;
  rms: number;
  rrs: number;
  propostas: number;
  vendas: number;
  receita: number;           // MRR + Setup + Pontual das vendas
  investimento: number;      // Vem da API Meta Ads (cruzamento por nome)
  roi: number;               // receita / investimento
  leadsList: CardRef[];      // IDs dos leads para drill-down
}
```

Logica de atribuicao de canal:
- Se `fbclid` preenchido --> `meta_ads`
- Se `gclid` preenchido --> `google_ads`
- Se `fonte` contem "facebook" ou "instagram" --> `meta_ads`
- Se `fonte` contem "google" --> `google_ads`
- Se `tipoOrigem` contem "Evento" --> `eventos`
- Demais --> `organico` ou `outros`

Logica de funil por campanha:
- Agrupar cards por `campanha` (campo do Pipefy)
- Para cada grupo, contar quantos atingiram cada etapa do funil usando a mesma logica de primeira entrada ja existente
- Somar receita (MRR + Setup + Pontual + Educacao) dos cards que chegaram a "Contrato assinado"

Cruzamento com Meta Ads:
- Receber a lista de `metaCampaigns` (da API Meta Ads) como parametro
- Fazer match por nome (fuzzy: normalizar acentos, caixa, espacos)
- Quando match encontrado, preencher `investimento` com o `spend` da campanha Meta

### 3. Novo componente `CampaignFunnelTable`

**Novo arquivo: `src/components/planning/marketing-indicators/CampaignFunnelTable.tsx`**

Tabela com as colunas:
| Canal | Campanha | Leads | MQLs | RM | RR | Proposta | Venda | Receita | Investimento | ROI |

Funcionalidades:
- Ordenavel por qualquer coluna
- Filtro por canal (Meta, Google, Organico)
- Linha de totais no rodape
- Clique em uma campanha abre drill-down com a lista de leads/cards
- Codigo de cores: ROI > 1 = verde, ROI < 1 = vermelho

### 4. Novo componente `AttributionSankeyChart` (opcional, pode ser segunda fase)

**Novo arquivo: `src/components/planning/marketing-indicators/AttributionSankeyChart.tsx`**

Grafico Sankey mostrando o fluxo:
```text
Canal --> Campanha --> Lead --> MQL --> RM --> RR --> Proposta --> Venda
```

Na primeira versao, podemos substituir por um grafico de barras empilhadas mais simples mostrando a distribuicao do funil por canal.

### 5. Novo componente `ChannelAttributionCards`

**Novo arquivo: `src/components/planning/marketing-indicators/ChannelAttributionCards.tsx`**

Cards resumo por canal (dados reais do Pipefy):
- **Meta Ads**: X leads, Y vendas, R$ Z receita, ROI W
- **Google Ads**: idem
- **Organico**: idem
- **Eventos**: idem

Esses cards substituem ou complementam os `ChannelMetricsCards` atuais (que usam dados da planilha), dando a visao real de resultado por canal.

### 6. Integrar na `MarketingIndicatorsTab`

**Arquivo: `src/components/planning/MarketingIndicatorsTab.tsx`**

- Importar `useModeloAtualAnalytics` (ja usado em outras abas, reutilizar)
- Importar o novo `useMarketingAttribution`
- Passar os cards de todas as BUs + metaCampaigns para o hook
- Adicionar novas secoes no layout:
  1. **"Atribuicao por Canal (Dados Reais)"** -- `ChannelAttributionCards`
  2. **"Funil por Campanha"** -- `CampaignFunnelTable`
  3. Manter as secoes existentes (dados da planilha + Meta API) abaixo

### 7. Expandir `query-external-db` para permitir busca de colunas de atribuicao

**Arquivo: `supabase/functions/query-external-db/index.ts`**

- Adicionar `allowedColumns` para busca: `'Campanha'`, `'Conjunto/grupo'`, `'Fonte'`, `'Origem do lead'`
- Isso permite buscas futuras por campanha especifica no drill-down

## Fluxo de Dados

```text
1. MarketingIndicatorsTab monta com dateRange
2. useModeloAtualAnalytics(dateRange) --> cards com atribuicao (Modelo Atual)
3. useExpansaoAnalytics(dateRange, 'O2 TAX') --> cards com atribuicao
4. useMetaCampaigns(dateRange) --> campanhas Meta com spend
5. useMarketingAttribution(allCards, metaCampaigns) --> CampaignFunnel[]
6. Renderiza:
   - ChannelAttributionCards (resumo por canal real)
   - CampaignFunnelTable (funil por campanha com ROI)
   - [existentes] ChannelMetricsCards, CostPerStageGauges, etc.
```

## Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `src/hooks/useModeloAtualAnalytics.ts` | Editar - adicionar campos de atribuicao no parsing |
| `src/hooks/useExpansaoAnalytics.ts` | Editar - adicionar campos de atribuicao no parsing |
| `src/hooks/useMarketingAttribution.ts` | Novo - logica central de atribuicao e cruzamento |
| `src/components/planning/marketing-indicators/CampaignFunnelTable.tsx` | Novo - tabela de funil por campanha |
| `src/components/planning/marketing-indicators/ChannelAttributionCards.tsx` | Novo - cards de canal com dados reais |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Editar - integrar novos componentes e hooks |
| `supabase/functions/query-external-db/index.ts` | Editar - expandir allowedColumns para busca |
| `src/components/planning/marketing-indicators/types.ts` | Editar - novos tipos CampaignFunnel, AttributionChannel |

## Consideracoes tecnicas

- Os dados de atribuicao ja existem no banco e ja sao carregados pelo `useModeloAtualAnalytics` -- so precisamos extrair os campos extras no parsing. Nao ha chamadas API adicionais.
- O cruzamento Meta Ads por nome de campanha usa normalizacao (lowercase, sem acentos, trim) para lidar com pequenas diferencas entre o nome no Pipefy e na API Meta.
- Para campanhas Google Ads, o investimento nao esta disponivel por campanha individual (so total da planilha). O ROI por campanha Google sera marcado como "N/D" ate ter integracao com a API do Google Ads.
- O hook `useMarketingAttribution` e puramente computacional (useMemo), sem chamadas extras ao backend -- recebe os cards ja carregados.

