
# Diagnostico: Eventos nao aparecem na aba Mkt Indicadores

## Problemas Identificados

Encontrei **4 causas distintas** que impedem os Eventos de aparecerem corretamente:

### Causa 1: Filtro muito restritivo no `enrichedChannels`
No `MarketingIndicatorsTab.tsx`, a condicao para adicionar Eventos aos canais exige `leads > 0`:
```
if (eventosSummary && eventosSummary.leads > 0)
```
Porem, muitos cards de eventos estao em fases avancadas (RM, Proposta, Venda) e nao sao contados como "leads" na atribuicao. Um card de evento na fase "Proposta enviada" so conta como proposta, nao como lead. Resultado: Eventos nao aparece nos graficos de Investimento, Funil e Conversoes.

### Causa 2: `ChannelMetricsCards` e hardcoded
O componente `ChannelMetricsCards` so mostra 3 cards fixos: Meta Ads, Google Ads e Totais. Nao ha nenhum card para Eventos, independente dos dados.

### Causa 3: Deteccao de "G4" incompleta
No banco de dados, existem cards com `Origem do lead: "Eventos G4"` (que funciona porque contem "evento"). Mas cards com apenas `Origem do lead: "G4"` (sem a palavra "evento") NAO sao detectados como eventos. A funcao `detectChannel` so verifica a palavra "evento".

### Causa 4: Atribuicao usa apenas fases pontuais, nao funil cumulativo
Na `useMarketingAttribution`, cada card so e contado na fase exata em que esta (ex: "propostas"). Diferente do funil de indicadores, nao ha logica cumulativa onde um card em proposta tambem conta como lead. Isso faz com que o canal Eventos tenha 0 leads mesmo tendo cards ativos.

## Evidencias do Banco de Dados

Confirmei que existem cards com atribuicao de eventos:
- Card "Grupo Lc" (ID 1023121218): `Fonte: "Evento"`, entrada agosto/2025
- Card "Dalle Incorporadora" (ID 1259442294): `Origem do lead: "Eventos G4"`, entrada fevereiro/2026, fase "Proposta enviada"
- Na tabela de expansao (`pipefy_cards_movements_expansao`): 0 cards com evento

## Solucao Proposta

### 1. Relaxar o filtro de `enrichedChannels` (MarketingIndicatorsTab.tsx)
Mudar a condicao de `leads > 0` para aceitar qualquer metrica relevante:
```
if (eventosSummary && (eventosSummary.leads > 0 || eventosSummary.mqls > 0 || eventosSummary.vendas > 0 || eventosSummary.receita > 0))
```

### 2. Adicionar card de Eventos no `ChannelMetricsCards`
Tornar o componente dinamico para exibir todos os canais presentes nos dados (incluindo Eventos), em vez de mostrar apenas Meta Ads e Google Ads fixos.

### 3. Adicionar deteccao de "g4" no `detectChannel` (useMarketingAttribution.ts)
```
if (fonte.includes('evento') || tipo.includes('evento') || origem.includes('evento')
  || fonte.includes('g4') || tipo.includes('g4') || origem.includes('g4')) return 'eventos';
```

### 4. Usar logica de funil cumulativo na atribuicao
Fazer com que cards em fases avancadas (RM, RR, Proposta, Venda) tambem contem como leads no canal. Isso garante que o canal Eventos sempre tenha um numero de leads condizente com a realidade.

## Arquivos a alterar

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useMarketingAttribution.ts` | Adicionar deteccao "g4", logica cumulativa no funil |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Relaxar condicao `leads > 0` no enrichedChannels |
| `src/components/planning/marketing-indicators/ChannelMetricsCards.tsx` | Tornar dinamico para exibir Eventos |
