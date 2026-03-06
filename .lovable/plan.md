

## Plano: Cards de Atribuição por Canal clicáveis com drill-down

### Resumo
Tornar cada card de canal (Meta Ads, Google Ads, Eventos, Orgânico/Direto, Outros) clicável. Ao clicar, abre o `DetailSheet` existente mostrando a lista de leads/cards daquele canal, com colunas relevantes (nome, empresa, fase, BU, valor, data).

### Alterações

**1. Exportar `detectChannel` do `useMarketingAttribution.ts`**
- Tornar a função `detectChannel` exportável para ser reutilizada no filtro de cards por canal.

**2. Atualizar `ChannelAttributionCards.tsx`**
- Aceitar nova prop `onChannelClick(channel: ChannelId)`.
- Adicionar `cursor-pointer`, hover effect e ícone de drill-down nos cards (mesmo padrão do `ClickableRadialCard`).

**3. Atualizar `MarketingIndicatorsTab.tsx`**
- Adicionar estado para o drill-down de canal (`channelDrillDown: { isOpen, channel }`).
- Ao clicar num card, filtrar `allAttributionCards` pelo canal usando `detectChannel` (considerando a reclassificação com API campaigns).
- Mapear os cards filtrados para `DetailItem[]` com colunas: Nome, Empresa, Fase, BU, Valor, Data de Entrada.
- Renderizar `DetailSheet` com título "Leads — {Nome do Canal}" e os dados filtrados.

### Arquivos alterados
- `src/hooks/useMarketingAttribution.ts` — exportar `detectChannel` + lógica de reclassificação como helper
- `src/components/planning/marketing-indicators/ChannelAttributionCards.tsx` — prop `onChannelClick`, estilos clicáveis
- `src/components/planning/MarketingIndicatorsTab.tsx` — estado drill-down, filtro de cards, renderizar `DetailSheet`

