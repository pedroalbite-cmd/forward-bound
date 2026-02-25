

# Correcao: Eventos na tabela "Conversao por Canal" + validacao da Atribuicao

## Problemas identificados

### 1. "Conversao por Canal" nunca mostra Eventos
A tabela "Conversao por Canal" usa `data.channels` do hook `useMarketingIndicators`, que constroi apenas dois canais (linhas 96-137 do arquivo):
- Meta Ads
- Google Ads

Nao existe um canal "Eventos" nesse array. Os dados de eventos nao vem da planilha do Google Sheets (que so tem Meta e Google), entao precisamos adicionar os dados de eventos a partir da atribuicao real (dados do Pipefy).

### 2. "Atribuicao por Canal" - validacao
A logica de `detectChannel` ja inclui `fonte.includes('evento')` apos a ultima correcao. Se os dados demoram para carregar (~60s para periodos longos), o card de Eventos so aparece apos o carregamento completo dos dados do Pipefy. Nao ha bug de codigo aqui - e questao de timing de carregamento.

## Solucao

### Arquivo 1: `src/components/planning/MarketingIndicatorsTab.tsx`

Enriquecer o array `data.channels` com dados de eventos vindos da atribuicao real (Pipefy). Criar um `useMemo` que:

1. Pega os `channelSummaries` da atribuicao
2. Encontra o summary do canal `eventos`
3. Se existir, adiciona um `MarketingChannel` com id `eventos` ao array de channels
4. Passa esse array enriquecido para o componente `ConversionsByChannelChart`

```typescript
const enrichedChannels = useMemo(() => {
  const channels = [...data.channels];
  const eventosSummary = channelSummaries.find(s => s.channel === 'eventos');
  if (eventosSummary && eventosSummary.leads > 0) {
    channels.push({
      id: 'eventos',
      name: 'Eventos',
      investment: 0, // Eventos nao tem investimento de midia
      leads: eventosSummary.leads,
      mqls: eventosSummary.mqls,
      rms: 0,
      rrs: 0,
      cpl: 0,
      cpmql: 0,
      conversionRate: eventosSummary.leads > 0
        ? Math.round((eventosSummary.mqls / eventosSummary.leads) * 100)
        : 0,
    });
  }
  return channels;
}, [data.channels, channelSummaries]);
```

Depois, substituir `data.channels` por `enrichedChannels` nos seguintes componentes:
- `<ChannelMetricsCards channels={enrichedChannels} ...>`
- `<InvestmentByChannelChart channels={enrichedChannels} />`
- `<ConversionsByChannelChart channels={enrichedChannels} />`

### Arquivo 2: `src/components/planning/marketing-indicators/ConversionsByChannelChart.tsx`

Nenhuma mudanca necessaria - o componente ja renderiza qualquer canal que receba no array `channels`. Basta passar o array enriquecido.

## Resultado esperado

- A tabela "Conversao por Canal" mostrara uma linha de "Eventos" com leads, MQLs e taxa de conversao
- O card "Eventos" na "Atribuicao por Canal" continuara aparecendo (ja funciona apos a correcao anterior, desde que os dados terminem de carregar)
- Os demais canais (Meta Ads, Google Ads) nao serao afetados

