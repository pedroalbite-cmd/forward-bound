
# Correcao: Eventos nao aparecem na atribuicao

## Problema

A funcao `detectChannel()` em `useMarketingAttribution.ts` verifica o campo `fonte` para identificar Meta Ads e Google Ads, mas nao verifica se `fonte` contem "evento". Confirmei no banco que existem cards com:

- `Fonte = "Evento"` (com Posicionamento = "Presencial")
- `Origem do lead = "G4 Eventos"`

O segundo caso ja e tratado na linha 39 (`origem.includes('evento')`), mas o primeiro caso nao e tratado. Cards com `Fonte = "Evento"` passam pelos checks de Meta/Google sem match e caem direto em `return 'organico'` na linha 41, sem nunca verificar se `fonte` contem "evento".

## Solucao

Adicionar `fonte.includes('evento')` na verificacao de eventos na linha 39:

```typescript
if (tipo.includes('evento') || origem.includes('evento') || fonte.includes('evento')) return 'eventos';
```

Isso deve ser inserido ANTES do `return 'organico'` e DEPOIS dos checks de Meta/Google (para nao classificar erroneamente cards que sao de Meta com fonte "evento").

## Arquivo alterado

- `src/hooks/useMarketingAttribution.ts` - linha 39: adicionar `fonte.includes('evento')` na condicao

## Resultado esperado

Cards com qualquer um dos tres campos contendo "evento" (`Fonte`, `Tipo de Origem do lead`, `Origem do lead`) serao classificados como canal "Eventos".
