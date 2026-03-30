

## Bug: Cards não aparecem com filtro de SDR

### Diagnóstico

Verifiquei no banco externo — os dois cards **têm** o campo `"SDR responsável"` preenchido com **"Amanda Teixeira Serafim"**. O campo NÃO está vazio.

**Resumo dos dados no banco:**

| Card | SDR responsável | Closer responsável |
|------|----------------|--------------------|
| Balbúrdia Cervejeira (1271088855) | Amanda Teixeira Serafim | Daniel Trindade |
| Working Capital (1316876736) | Amanda Teixeira Serafim | Daniel Trindade |

O problema é um bug no código de conversão `toDetailItem` em `useModeloAtualAnalytics.ts`:

```text
// Linha 475 - BUG: "responsible" recebe o CLOSER primeiro
responsible: card.closer || card.responsavel || undefined
```

Quando o filtro de SDR roda no `getItemsForIndicator`, ele verifica `item.responsible || item.sdr`. Como `item.responsible` = "Daniel Trindade" (o closer), o valor é truthy e o `item.sdr` nunca é consultado. O filtro procura "Amanda" em "Daniel Trindade" e falha.

### Correção

**Arquivo:** `src/components/planning/IndicatorsTab.tsx`

Na função `getItemsForIndicator` (linha ~1146), mudar de:
```typescript
const matchSdr = effectiveSelectedSDRs.length === 0 || matchesSdrFilter(item.responsible || item.sdr);
```
Para:
```typescript
const matchSdr = effectiveSelectedSDRs.length === 0 || matchesSdrFilter(item.sdr || item.responsible);
```

Isso garante que o campo `sdr` (que contém o valor correto "Amanda Teixeira Serafim") seja verificado primeiro, em vez de `responsible` (que contém o closer "Daniel Trindade").

A mesma correção deve ser aplicada em todas as ocorrências de `matchesSdrFilter(item.responsible || item.sdr)` dentro do `getItemsForIndicator`.

### Nota adicional

A fase "Enviar proposta" ainda não está no mapeamento `PHASE_TO_INDICATOR` do Modelo Atual (pendente da aprovação anterior). Esse é um fix separado.

