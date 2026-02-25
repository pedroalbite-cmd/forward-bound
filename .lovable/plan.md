

# Correcao da deteccao de canal no Marketing Attribution

## Problema atual

A funcao `detectChannel()` em `useMarketingAttribution.ts` procura por strings completas como `facebook`, `instagram`, `google`, mas o banco de dados usa abreviacoes: `ig`, `fb`, `googleads`. Isso faz com que leads pagos sejam classificados incorretamente como "Organico".

## Solucao

Atualizar a funcao `detectChannel()` (linhas 25-38) para reconhecer as abreviacoes reais do banco:

### Arquivo: `src/hooks/useMarketingAttribution.ts`

Alterar a logica de deteccao de fonte (linha 32-33):

```typescript
function detectChannel(card: AttributionCard): ChannelId {
  // If campanha field contains a Meta campaign ID, it's Meta Ads
  if (card.campanha && isMetaCampaignId(card.campanha)) return 'meta_ads';
  if (card.fbclid) return 'meta_ads';
  if (card.gclid) return 'google_ads';

  const fonte = (card.fonte || '').toLowerCase().trim();
  // Abreviacoes reais do banco: 'ig', 'fb', 'googleads'
  if (fonte === 'ig' || fonte === 'fb' || fonte.includes('facebook') || fonte.includes('instagram') || fonte.includes('meta')) return 'meta_ads';
  if (fonte === 'googleads' || fonte.includes('google')) return 'google_ads';

  // Detectar eventos pelo tipoOrigem OU pelo campo origem do lead
  const tipo = (card.tipoOrigem || '').toLowerCase();
  const origem = ((card as any).origemLead || '').toLowerCase();
  if (tipo.includes('evento') || origem.includes('evento') || origem.includes('g4')) return 'eventos';

  return 'organico';
}
```

## Mudancas

- Adicionar comparacao exata para `ig` e `fb` (match de abreviacao)
- Adicionar comparacao exata para `googleads`
- Adicionar `.trim()` na fonte para evitar espacos extras
- Manter os matches anteriores (`facebook`, `instagram`, `meta`, `google`) como fallback
- Adicionar deteccao de eventos pelo campo `origemLead` (quando contem "evento" ou "g4")

## Resultado esperado

Leads que antes apareciam como "Organico" por terem fonte `ig` ou `fb` passarao a ser corretamente classificados como "Meta Ads", e leads com fonte `googleads` como "Google Ads".

