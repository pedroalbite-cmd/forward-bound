

## Plano: Incluir receita Oxy Hacker e Franquia nos cards de Receita do Mkt Indicadores

### O que muda

Atualmente `realRevenue` (linhas 102-137 do `MarketingIndicatorsTab.tsx`) soma apenas Modelo Atual e O2 TAX. Oxy Hacker e Franquia são BUs de receita exclusivamente **Pontual** (sem MRR/Setup), e já possuem hooks instanciados (`useExpansaoMetas` e `useOxyHackerMetas`) com `getValueForPeriod('venda', start, end)` que retorna o valor monetário das vendas no período.

### Implementação

**Arquivo:** `src/components/planning/MarketingIndicatorsTab.tsx`

1. **Importar e instanciar os hooks** (se ainda não retornam valor monetário diretamente):
   - `useExpansaoMetas` (Franquia) - já instanciado na linha 142 via `useExpansaoAnalytics`, mas precisa do hook de metas para `getValueForPeriod`
   - `useOxyHackerMetas` (Oxy Hacker) - já instanciado na linha 143, mesmo caso

2. **Expandir o `realRevenue` useMemo** para incluir:
   - Se `selectedBUs` inclui 'Oxy Hacker': somar `oxyHacker.getValueForPeriod('venda', start, end)` ao `pontual`
   - Se `selectedBUs` inclui 'Franquia': somar `franquia.getValueForPeriod('venda', start, end)` ao `pontual`
   - Remover a condição que faz fallback para sheet data quando nenhuma BU com dados reais está selecionada (agora todas as 4 BUs têm dados reais)

3. **Ajustar condição de fallback** (linha 108): em vez de `!includesModeloAtual && !includesO2Tax`, verificar se nenhuma das 4 BUs está selecionada.

### Impacto

O card "Pontual" passará a refletir a soma de todas as BUs selecionadas. Como Oxy Hacker e Franquia não têm MRR nem Setup, apenas o Pontual será afetado.

