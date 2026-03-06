

## Auditoria: Custo por Etapa do Funil

### Fluxo atual dos dados

Existem **3 camadas** de cálculo que podem gerar divergências:

```text
Planilha "Indicadores 26"        useMarketingIndicators         MarketingIndicatorsTab
┌──────────────────────┐    ┌───────────────────────┐    ┌──────────────────────────┐
│ CPL, CPMQL, CPRM...  │───▶│ Prioriza valor da     │───▶│ SOBRESCREVE tudo com:    │
│ (calculados na sheet) │    │ sheet. Se 0, calcula:  │    │ investimento API / volume │
│                       │    │ investSheet / volume   │    │ sheet (enrichedTotals)   │
│ Volume: MQLs, RM...   │    │                       │    │                          │
│ Investimento: Mídia   │    │ data.costPerStage     │    │ enrichedTotals.costPerStage│
└──────────────────────┘    └───────────────────────┘    └──────────────────────────┘
                                                              ▲ ESTE é exibido
```

### Problema identificado

Na linha 371-378 de `MarketingIndicatorsTab.tsx`, o cálculo final **sempre recalcula** o custo por etapa:
- **Investimento** = vem da API (Meta + Google), que é mais preciso
- **Volumes** (MQLs, RM, RR, Propostas, Vendas) = vem da **planilha** (`data.totalMqls`, etc.)

Isso significa que se a planilha tiver volumes desatualizados ou diferentes dos dados reais do Pipefy, o custo estará errado. A planilha pode dizer "10 vendas" enquanto o Pipefy tem "8 vendas", resultando em CPV diferente.

### Proposta de correção

Usar os **volumes reais do Pipefy** (que já estão disponíveis via `allAttributionCards`) como fonte de verdade para os denominadores, em vez dos volumes da planilha:

**`src/components/planning/MarketingIndicatorsTab.tsx`** — no cálculo de `enrichedTotals`:
- Contar leads, MQLs, RMs, RRs, propostas e vendas diretamente dos `allAttributionCards` (mesma lógica da aba Indicadores)
- Manter o investimento da API (numerador correto)
- Resultado: CPL = investimento API / leads Pipefy, etc.

Isso garante consistência entre:
- Os números de volume exibidos nos cards de atribuição
- Os custos por etapa calculados nos gauges
- Os drill-downs de cada etapa

### Arquivos alterados
- `src/components/planning/MarketingIndicatorsTab.tsx` — substituir `data.totalMqls/totalRms/etc` por contagens reais dos `allAttributionCards` no cálculo de `enrichedTotals.costPerStage`

