

# Vincular Google Ads API aos Indicadores de Marketing

## Problema Atual

Os dados do Google Ads ja aparecem na **tabela de campanhas** (drill-down), mas os **indicadores do dashboard** (cards de canal, gauges de custo, gauges de performance, graficos de funil) usam apenas dados da planilha Google Sheets. Quando a planilha nao tem dados do Google Ads para o periodo (ou tem valores desatualizados), os indicadores ficam zerados ou incorretos.

## Solucao

Enriquecer os indicadores de marketing com dados reais da API do Google Ads, usando a planilha como fonte primaria e a API como fallback/complemento.

### Fluxo de Dados Proposto

```text
Google Sheets (planilha)  -->  useMarketingIndicators  -->  Dashboard
                                      ^
Google Ads API            -->  useGoogleCampaigns  ----+
                                                       |
                              MarketingIndicatorsTab ---+--- Merge/Enrich
```

## Alteracoes

### 1. MarketingIndicatorsTab.tsx - Enriquecer canais com dados da API

No `enrichedChannels` (que ja enriquece com Eventos), adicionar logica para:
- Quando o canal Google Ads da planilha tem investimento = 0, usar os totais somados das campanhas da API
- Quando a planilha tem dados, manter como fonte primaria (pois inclui ajustes manuais)
- Somar investimento, leads e calcular CPL a partir das campanhas Google Ads reais

### 2. Atualizar totais e metricas derivadas

- Recalcular `totalInvestment` e `totalLeads` incluindo dados reais do Google Ads
- Atualizar `costPerStage` para usar o investimento total correto (incluindo Google Ads da API)
- Recalcular gauges de performance (ROAS, CAC) com investimento atualizado

### 3. Logica de merge

A logica segue o mesmo padrao ja usado para "Eventos":
- Se a planilha ja tem dados do Google Ads (investimento > 0), usa a planilha
- Se a planilha tem investimento = 0 para Google Ads, calcula a partir da API (somando `spend` e `conversions` de todas as campanhas)
- O CPL da API sera `totalSpend / totalConversions` das campanhas Google

## Detalhes Tecnicos

O merge sera feito no `useMemo` de `enrichedChannels` dentro de `MarketingIndicatorsTab.tsx`. Os dados de `googleCampaigns` (ja disponivel no componente via `useGoogleCampaigns`) serao agregados para calcular totais de investimento e leads do Google Ads. Isso tambem afetara os totais passados para `ChannelMetricsCards`, `CostPerStageGauges` e `PerformanceGauges`.

| Arquivo | Acao |
|---------|------|
| `src/components/planning/MarketingIndicatorsTab.tsx` | Modificar - adicionar merge de Google Ads API nos canais e recalcular totais |

