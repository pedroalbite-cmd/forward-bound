

## Remover Card do Instagram da Aba Mkt Indicadores

### Resumo

Vou remover o card do Instagram da seção "Mídia e Leads por Canal" na aba Marketing Indicadores. Com a remoção, o grid passará de 4 para 3 cards: Meta Ads, Google Ads e Totais.

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planning/marketing-indicators/ChannelMetricsCards.tsx` | Remover card Instagram e prop |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Remover prop `instagram` do componente |

---

### Detalhes Técnicos

**1. ChannelMetricsCards.tsx**

- Remover import do `Instagram` do lucide-react
- Remover import de `InstagramMetrics` do types
- Remover prop `instagram` da interface `ChannelMetricsCardsProps`
- Remover o bloco do card Instagram (linhas 84-106)
- Atualizar grid de `lg:grid-cols-4` para `lg:grid-cols-3`

**2. MarketingIndicatorsTab.tsx**

- Remover a prop `instagram={data.instagram}` do componente ChannelMetricsCards

---

### Resultado Visual

```
Antes (4 cards):
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Meta Ads   │ Google Ads  │  Instagram  │   TOTAIS    │
└─────────────┴─────────────┴─────────────┴─────────────┘

Depois (3 cards):
┌─────────────┬─────────────┬─────────────┐
│  Meta Ads   │ Google Ads  │   TOTAIS    │
└─────────────┴─────────────┴─────────────┘
```

---

### Nota

Os tipos e dados do Instagram no hook (`useMarketingIndicators.ts`) e em `types.ts` serão mantidos, pois podem ser utilizados futuramente ou por outras funcionalidades. Apenas a visualização será removida.

