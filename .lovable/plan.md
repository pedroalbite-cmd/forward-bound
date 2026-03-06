

## Plano: Calcular ROAS, CAC, LTV e ROI LTV sem planilha

### Situação atual

Os 5 gauges de performance usam valores da planilha "Indicadores 26":
- `data.roas`, `data.roiLtv`, `data.cac`, `data.ltv` → vêm de `useMarketingSheetData`

### Dados reais já disponíveis

Todos os dados necessários já existem no código, sem precisar da planilha:

| Dado | Fonte real |
|------|-----------|
| Investimento | APIs Meta + Google (`enrichedTotals.totalInvestment`) |
| Receita (GMV) | Pipefy vendas assinadas (`realRevenue.gmv`) |
| Nº de Vendas | Pipefy cards "Contrato assinado" (`pipefyVolumes.vendas`) |
| MRR total vendas | Soma de `valorMRR` dos cards com "Contrato assinado" |

### Fórmulas calculadas

```text
ROAS       = Receita (GMV) / Investimento API
CAC        = Investimento API / Nº Vendas (Pipefy)
LTV        = MRR médio por venda × 12 meses
ROI LTV    = (LTV × Vendas) / Investimento API
```

### Alteração

**`src/components/planning/MarketingIndicatorsTab.tsx`**:

1. Criar um `useMemo` que calcula as métricas reais a partir dos dados já disponíveis:
   - Filtrar `allAttributionCards` com `fase === 'Contrato assinado'` para obter vendas
   - Somar `valorMRR` dessas vendas e dividir pela quantidade para obter MRR médio
   - Aplicar as fórmulas acima
2. Substituir `data.roas`, `data.roiLtv`, `data.cac`, `data.ltv` pelos valores calculados no `<PerformanceGauges>`

**Resultado**: Valores 100% baseados em dados reais (APIs + Pipefy), sem dependência da planilha manual. Sim, serão mais precisos porque refletem os dados atualizados em tempo real.

### Arquivo alterado
- `src/components/planning/MarketingIndicatorsTab.tsx`

