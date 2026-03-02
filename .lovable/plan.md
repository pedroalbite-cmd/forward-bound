
## Correcao dos indicadores para BU O2 TAX isolada

### Problemas identificados

#### 1. Acelerometro de Vendas mostra 0 mas drill-down mostra venda
**Causa raiz**: O `getRealizedForIndicator` e o `handleRadialCardClick` usam a mesma funcao `o2TaxAnalytics.getDetailItemsForIndicator('venda')`, mas o hook `useO2TaxAnalytics` faz 3 chamadas sequenciais a API (query_period -> card_history -> mql_by_creation). O radial card renderiza com 0 durante o carregamento e, embora devesse atualizar apos os dados chegarem, a logica de `useMemo` aninhada (getCardsForIndicator -> getDetailItemsForIndicator) pode causar um delay na re-renderizacao.

**Correcao**: Garantir que `getRealizedForIndicator` retorne 0 apenas se `o2TaxAnalytics.isLoading` for false. Se estiver carregando, mostrar loading state no radial card.

#### 2. Grafico de linha (chart) usa hook diferente do acelerometro
**Problema**: O grafico diario/semanal/mensal usa `getO2TaxGroupedData` do hook `useO2TaxMetas`, que faz `action: 'preview', limit: 5000` (sem filtro de data, tudo client-side). Enquanto isso, o acelerometro usa `useO2TaxAnalytics` com `action: 'query_period'` (filtrado no servidor com first-entry logic). Isso pode gerar divergencia entre chart e gauge.

**Correcao**: Para manter consistencia, o chart tambem deveria usar dados do analytics hook quando em modo single-BU O2 TAX, igual ao que ja acontece para o radial card.

#### 3. Indicadores monetarios (Faturamento, MRR, Setup, Pontual) usam hooks misturados
**Problema**: Na secao `getRealizedMonetaryForIndicator`:
- Faturamento O2 TAX: usa `getO2TaxValue('venda')` do `useO2TaxMetas` (hook antigo)
- MRR: usa `getO2TaxMrr()` do `useO2TaxMetas`
- Setup: usa `getO2TaxSetup()` do `useO2TaxMetas`
- Pontual: usa `getO2TaxPontual()` do `useO2TaxMetas`

Enquanto o acelerometro de volume usa `o2TaxAnalytics` (hook com first-entry). Isso causa divergencia: o faturamento pode contar uma venda que o acelerometro nao conta (ou vice-versa).

### Solucao proposta

#### 1. Adicionar loading state aos radial cards

No `IndicatorsTab.tsx`, verificar `o2TaxAnalytics.isLoading` antes de computar realized:

```text
- Se isLoading, exibir skeleton/spinner no radial card
- Se !isLoading, exibir o valor real
```

#### 2. Unificar fonte de dados para graficos O2 TAX

No `buildChartData` (linhas 874-889), quando single-BU O2 TAX, usar `o2TaxAnalytics.getCardsForIndicator` agrupado por periodo em vez de `getO2TaxGroupedData` do hook `useO2TaxMetas`. Isso alinha chart com acelerometro.

#### 3. Unificar fonte de dados para indicadores monetarios O2 TAX

No `getRealizedMonetaryForIndicator`, para faturamento/MRR/setup/pontual de O2 TAX, usar dados do `o2TaxAnalytics` (que aplica first-entry):

```text
case 'faturamento':
  if (includesO2Tax) {
    // Usar o2TaxAnalytics.getCardsForIndicator('venda') 
    // e somar card.valor de cada card
    const o2TaxVendas = o2TaxAnalytics.getCardsForIndicator('venda');
    total += o2TaxVendas.reduce((sum, c) => sum + c.valor, 0);
  }

case 'mrr':
  if (includesO2Tax) {
    const o2TaxVendas = o2TaxAnalytics.getCardsForIndicator('venda');
    total += o2TaxVendas.reduce((sum, c) => sum + c.valorMRR, 0);
  }
// Similar para setup e pontual
```

### Alteracoes por arquivo

| Arquivo | Alteracao |
|---------|-----------|
| `IndicatorsTab.tsx` | 1. Adicionar loading check para radial cards quando O2 TAX |
| `IndicatorsTab.tsx` | 2. `buildChartData` - usar analytics para O2 TAX single-BU |
| `IndicatorsTab.tsx` | 3. `getRealizedMonetaryForIndicator` - unificar com analytics |
| `IndicatorsTab.tsx` | 4. Verificar `getDealsWon` para drill-downs de Conversions tab |

### Resultado esperado
- Todos indicadores (volume + monetarios) usam a mesma fonte: `useO2TaxAnalytics` com first-entry logic
- Radial cards mostram loading enquanto dados carregam, evitando "0 falso"
- Graficos de evolucao temporal batem com acelerometros
- Drill-down sempre bate com valor exibido no gauge
