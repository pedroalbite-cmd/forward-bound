

## Plano: Sincronizar Funil de Aquisição e Investimento por Canal com Indicadores

### Problema 1: Funil de Aquisição com números errados

O gráfico `AcquisitionFunnelChart` (linha 684-689) recebe dados misturados:
- **Leads** = `enrichedTotals.totalLeads` (Pipefy attribution cards, lógica cumulativa)
- **MQLs, RMs, RRs** = `data.totalMqls`, `data.totalRms`, `data.totalRrs` (planilha "Indicadores 26")

A aba Indicadores usa `getCardsForIndicator()` dos hooks de analytics com lógica "First Entry" por indicador. Os volumes da planilha podem ser completamente diferentes.

**Correção**: Substituir os 4 valores do funil pelos mesmos analytics hooks que a aba Indicadores usa. Os dados já estão disponíveis:
- Modelo Atual: `useModeloAtualAnalytics` (já instanciado como `modeloAtualAllCards`)
- O2 TAX: `useO2TaxAnalytics` (não instanciado ainda — precisa adicionar)
- Franquia: `useExpansaoAnalytics` (já instanciado)
- Oxy Hacker: `useExpansaoAnalytics` (já instanciado)

Porém, os hooks de Expansão e O2 TAX não estão sendo usados com `getCardsForIndicator` no `MarketingIndicatorsTab`. A solução mais simples e consistente:

1. Importar `useModeloAtualAnalytics`, `useO2TaxAnalytics`, `useExpansaoAnalytics` (já importados parcialmente)
2. Criar um `useMemo` chamado `indicatorsVolumes` que soma `getCardsForIndicator('leads')`, `.length` etc. de cada BU — **mesma lógica exata** da aba Indicadores (`getRealizedForIndicator`)
3. Passar esses valores para `AcquisitionFunnelChart` e também para `pipefyVolumes` (substituindo a contagem cumulativa atual que difere da contagem first-entry)

### Problema 2: Investimento por Canal incompleto

Atualmente `enrichedChannels` só tem Meta Ads, Google Ads e Eventos. O usuário quer a visão completa do comercial.

**Correção**: Adicionar canais "Orgânico / Direto" usando os dados já disponíveis via `channelSummaries` (que já calcula leads, MQLs, vendas e receita por canal a partir do Pipefy). Basta iterar os `channelSummaries` e adicionar ao `enrichedChannels` qualquer canal que não seja meta_ads, google_ads ou eventos (ex: `organico`).

### Alterações em `src/components/planning/MarketingIndicatorsTab.tsx`

1. **Importar `useO2TaxAnalytics`** (o único hook de analytics que falta)
2. **Criar `indicatorsVolumes`**: memo que soma `.getCardsForIndicator(indicator).length` das 4 BUs para cada indicador (leads, mql, rm, rr, proposta, venda) — replicando a lógica de `getRealizedForIndicator` da aba Indicadores
3. **Substituir `pipefyVolumes`** pela lógica de `indicatorsVolumes` (para custos por etapa e performance metrics também usarem os mesmos volumes)
4. **Atualizar props do `AcquisitionFunnelChart`**: passar `indicatorsVolumes.leads`, `.mqls`, `.rms`, `.rrs` em vez dos valores da planilha
5. **Enriquecer `enrichedChannels`** com canal "Orgânico / Direto" dos `channelSummaries` (investimento = 0, mas mostrando leads/MQLs/vendas)

### Resultado esperado
- Funil de Aquisição exibe os mesmos números que os radial cards da aba Indicadores
- Investimento por Canal mostra todos os canais detectados no CRM, incluindo orgânico

### Arquivos alterados
- `src/components/planning/MarketingIndicatorsTab.tsx`

