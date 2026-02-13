

# Remover Premium MQL e Adicionar Ordenacao por Range no Grafico de Faixas

## O que muda

### 1. Remover "Premium" do drill-down de MQL
No arquivo `src/components/planning/IndicatorsTab.tsx`, no case `'mql'`:
- Remover o calculo de `premiumCount` e `premiumPct` (linhas 1234-1238)
- Remover o KPI "Premium" do array `kpis` (manter apenas "Total MQLs")
- Remover a mencao a "premium" na descricao do sheet (`premiumPct}% faixa premium (>R$50k)`)

### 2. Adicionar botao de ordenacao no grafico "Por Faixa de Faturamento"
O grafico de barras horizontais hoje ordena por quantidade (maior para menor). A solicitacao e adicionar um botao para alternar entre:
- **Por Quantidade** (padrao atual): maior para menor
- **Por Range**: ordem natural das faixas de faturamento (do menor para o maior)

**Implementacao:**
- Adicionar propriedade `sortable?: boolean` ao `ChartConfig` em `DrillDownCharts.tsx`
- Adicionar propriedade `sortOrder?: string[]` ao `ChartConfig` para definir a ordem alternativa (TIER_ORDER)
- No componente `DrillDownBarChart.tsx`:
  - Adicionar prop `sortable` e `sortOrder`
  - Adicionar estado local de toggle (quantidade vs range)
  - Renderizar um botao pequeno (icone ArrowUpDown) ao lado do titulo
  - Quando em modo "range", ordenar os dados pela posicao no array `sortOrder`
  - Remover o `maxItems` para mostrar todas as faixas quando em modo range
- No `IndicatorsTab.tsx`, ao configurar o chart de MQL:
  - Passar `sortable: true` e `sortOrder` com a ordem correta das faixas

## Detalhes Tecnicos

**TIER_ORDER para sortOrder:**
```text
['Ainda não fatura', '< R$ 100k', 'R$ 100k - 200k', 'R$ 200k - 350k', 
 'R$ 350k - 500k', 'R$ 500k - 1M', 'R$ 1M - 5M', '> R$ 5M']
```

**Arquivos editados:**
- `src/components/planning/IndicatorsTab.tsx` - remover premium, adicionar sortOrder ao chart config
- `src/components/planning/indicators/DrillDownBarChart.tsx` - adicionar toggle de ordenacao
- `src/components/planning/indicators/DrillDownCharts.tsx` - propagar props sortable/sortOrder no ChartConfig

