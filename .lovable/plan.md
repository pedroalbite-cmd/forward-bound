

## Plano: Conversão por Tipo de Origem do Lead

### Objetivo
Substituir o agrupamento por canal (Meta Ads, Google Ads...) na tabela "Conversão por Canal" por um agrupamento por **Tipo de Origem do Lead** (`tipoOrigem`), mostrando cada tipo de origem com seus volumes de funil (Leads, MQLs, RM, RR, Propostas, Vendas).

### Alteracoes

**1. `ConversionsByChannelChart.tsx`** — Reescrever para aceitar `AttributionCard[]` em vez de `MarketingChannel[]`

- Nova prop: `cards: AttributionCard[]` (os `allAttributionCards` já disponíveis no tab)
- Agregar cards por `tipoOrigem` (valor do campo, ex: "Mídia Paga", "Indicação", "Evento"...)
- Para cada grupo, contar leads, MQLs, RMs, RRs, Propostas e Vendas usando a mesma lógica de `PHASE_FUNNEL_MAP` do `useMarketingAttribution`
- Renomear título para "Conversão por Tipo de Origem"
- Coluna "Canal" vira "Tipo de Origem"
- Remover colunas de CPL/CPMQL/Gasto (não faz sentido por tipo de origem)
- Adicionar coluna "Vendas" e "Conv. Lead→Venda"
- Linha de totais no rodapé

**2. `MarketingIndicatorsTab.tsx`** — Passar os dados corretos

- Linha ~708: trocar `<ConversionsByChannelChart channels={enrichedChannels} />` por `<ConversionsByChannelChart cards={allAttributionCards} />`

### Estrutura da tabela

```text
┌─────────────────┬───────┬──────┬────┬────┬──────────┬───────┬──────────┐
│ Tipo de Origem  │ Leads │ MQLs │ RM │ RR │ Propostas│Vendas │Conv. L→V │
├─────────────────┼───────┼──────┼────┼────┼──────────┼───────┼──────────┤
│ Mídia Paga      │  120  │  80  │ 45 │ 30 │    15    │   8   │  6.7%    │
│ Indicação       │   40  │  25  │ 18 │ 12 │     6    │   4   │ 10.0%    │
│ Evento          │   30  │  20  │ 10 │  8 │     5    │   3   │ 10.0%    │
│ (Sem tipo)      │   15  │   5  │  2 │  1 │     0    │   0   │  0.0%    │
├─────────────────┼───────┼──────┼────┼────┼──────────┼───────┼──────────┤
│ Total           │  205  │ 130  │ 75 │ 51 │    26    │  15   │  7.3%    │
└─────────────────┴───────┴──────┴────┴────┴──────────┴───────┴──────────┘
```

