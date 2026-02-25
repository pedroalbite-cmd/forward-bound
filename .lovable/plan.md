

# Correcao: Eventos nao aparecem na atribuicao de Marketing

## Problema

O campo `origemLead` (que contem valores como "Evento | Gestao e Estrategia G4") nao esta sendo passado para os cards de atribuicao. Existem dois problemas:

1. **Interface `AttributionCard`** (types.ts): nao declara o campo `origemLead`
2. **Mapeamento no `MarketingIndicatorsTab`**: ao construir `allAttributionCards`, o campo `origemLead` nao e copiado dos cards originais (`ModeloAtualCard` / `ExpansaoCard`)

Resultado: `detectChannel()` faz `(card as any).origemLead` que sempre retorna `undefined`, entao leads de eventos nunca sao detectados por esse caminho.

## Solucao

### 1. Adicionar `origemLead` na interface `AttributionCard` (types.ts)

Adicionar o campo opcional `origemLead?: string` na interface, junto dos outros campos de marketing.

### 2. Passar `origemLead` no mapeamento (MarketingIndicatorsTab.tsx)

Nos tres blocos onde os cards sao construidos (Modelo Atual, O2 TAX, Oxy Hacker), incluir `origemLead: c.origemLead`.

### 3. Remover cast `as any` no detectChannel (useMarketingAttribution.ts)

Com o campo declarado na interface, trocar `(card as any).origemLead` por `card.origemLead`.

## Arquivos alterados

- `src/components/planning/marketing-indicators/types.ts` - adicionar campo `origemLead`
- `src/components/planning/MarketingIndicatorsTab.tsx` - passar `origemLead` nos 3 blocos de mapeamento
- `src/hooks/useMarketingAttribution.ts` - remover cast `as any`

## Resultado esperado

Leads cujo campo "Origem do lead" contenha "Evento" ou "G4" serao corretamente classificados como canal "Eventos" nos cards de atribuicao.

