

## Priorizar API do Google Ads sobre planilha

Alteracao simples em `src/components/planning/MarketingIndicatorsTab.tsx`:

### `enrichedChannels` useMemo (~linha 161)

Remover a condicao `ch.investment === 0` para que os dados da API do Google Ads sejam **sempre** usados quando disponiveis:

```typescript
// De:
if (ch.id === 'google_ads' && ch.investment === 0 && googleAdsApiTotals.investment > 0)

// Para:
if (ch.id === 'google_ads' && googleAdsApiTotals.investment > 0)
```

Tambem incluir `clicks` e `impressions` da API no canal enriquecido.

Os `enrichedTotals` ja recalculam automaticamente com base nos canais enriquecidos, entao cards, gauges e graficos refletirao o valor real (R$ 21.7k).

| Arquivo | Acao |
|---------|------|
| `src/components/planning/MarketingIndicatorsTab.tsx` | Modificar condicao no `enrichedChannels` |

