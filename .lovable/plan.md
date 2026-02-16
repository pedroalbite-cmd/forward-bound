

# Aplicar mesma logica de BU expansao no drill-down de Propostas do IndicatorsTab

## Problema

O ajuste feito anteriormente no `ClickableFunnelChart.tsx` (funil) funcionou corretamente: quando Franquia ou Oxy Hacker esta selecionada, o drill-down de propostas mostra "Valor Pontual" sem MRR. Porem, o **acelerometro** (radial cards) no `IndicatorsTab.tsx` tem sua propria implementacao duplicada do drill-down de propostas (linhas 1405-1472) que **nunca foi atualizada**. Essa versao continua mostrando MRR e Valor Total para todas as BUs.

## Solucao

### Arquivo: `src/components/planning/IndicatorsTab.tsx` (linhas 1405-1472)

Aplicar a mesma logica condicional que ja existe no `ClickableFunnelChart.tsx`:

1. **Detectar BU de expansao**: Verificar se apenas Franquia ou apenas Oxy Hacker esta selecionada (usando `selectedBUs`)
2. **KPIs**: Usar `item.pontual` em vez de `item.value` para Pipeline e Ticket Medio; renomear label para "Valor Pontual"
3. **Pipeline por Closer (grafico)**: Usar `item.pontual` em vez de `item.value`
4. **Colunas da tabela**: Remover coluna "MRR" e renomear "Valor Total" para "Valor Pontual" usando `pontual` como key

### Detalhes tecnicos

No `case 'proposta'` (linha 1405):

```typescript
// Adicionar no inicio do case:
const isExpansaoBU = selectedBUs.length === 1 && 
  (selectedBUs[0] === 'franquia' || selectedBUs[0] === 'oxy_hacker');
const getItemValue = (item: DetailItem) => 
  isExpansaoBU ? (item.pontual || 0) : (item.value || 0);

// Substituir i.value por getItemValue(i) em:
// - pipeline calculation (linha 1413)
// - valorEmRisco calculation (linha 1416)
// - closerTotals calculation (linha 1432)

// KPI label condicional (linha 1421):
// 'Pipeline' -> isExpansaoBU ? 'Valor Pontual' : 'Pipeline'

// Colunas condicionais (linhas 1460-1468):
// Se isExpansaoBU: remover MRR, usar key 'pontual' com label 'Valor Pontual'
// Senao: manter 'value'/'Valor Total' e 'mrr'/'MRR'
```

Nenhum outro arquivo precisa ser alterado. A correcao do `toDetailItem` no `useExpansaoAnalytics.ts` (que ja prioriza `taxaFranquia`) garante que os valores estarao corretos.
