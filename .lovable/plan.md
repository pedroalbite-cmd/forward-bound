

# Correcao: Eventos classificados como Meta Ads pela ordem de prioridade

## Problema raiz

Na funcao `detectChannel()` em `useMarketingAttribution.ts`, a verificacao de eventos (linha 39) acontece DEPOIS das verificacoes de Meta Ads (linhas 27-28, 33). Cards de eventos que possuem:
- `Fonte: "Evento"` 
- MAS tambem `Campanha: "120212747408800418"` (ID numerico do Meta preenchido automaticamente pelo Pipefy)

Sao capturados pela linha 27 (`isMetaCampaignId`) e classificados como `meta_ads` antes de chegarem na verificacao de evento.

## Solucao

Mover a deteccao de eventos para ANTES das verificacoes de Meta/Google. A logica deve ser:

1. Primeiro, checar se e evento (pelo campo `fonte`, `tipoOrigem` ou `origemLead`)
2. Depois, checar se e Meta Ads ou Google Ads

## Arquivo alterado

`src/hooks/useMarketingAttribution.ts` - funcao `detectChannel` (linhas 25-42)

Nova ordem:

```typescript
function detectChannel(card: AttributionCard): ChannelId {
  const fonte = (card.fonte || '').toLowerCase().trim();
  const tipo = (card.tipoOrigem || '').toLowerCase();
  const origem = (card.origemLead || '').toLowerCase();

  // Eventos tem prioridade - detectar ANTES de Meta/Google
  if (fonte.includes('evento') || tipo.includes('evento') || origem.includes('evento')) return 'eventos';

  // Meta Ads
  if (card.campanha && isMetaCampaignId(card.campanha)) return 'meta_ads';
  if (card.fbclid) return 'meta_ads';
  if (fonte === 'ig' || fonte === 'fb' || fonte.includes('facebook') || fonte.includes('instagram') || fonte.includes('meta')) return 'meta_ads';

  // Google Ads
  if (card.gclid) return 'google_ads';
  if (fonte === 'googleads' || fonte.includes('google')) return 'google_ads';

  return 'organico';
}
```

## Resultado esperado

Cards com `Fonte: "Evento"` serao corretamente classificados como canal "Eventos", mesmo que possuam um ID de campanha Meta no campo Campanha. Isso fara o card de Eventos aparecer tanto na "Atribuicao por Canal" quanto na tabela "Conversao por Canal".

