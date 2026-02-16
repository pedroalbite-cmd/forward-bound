
# Ajustar acelerometro de Propostas Enviadas para Oxy Hacker e Franquia

## Problema

No drill-down de "Propostas Enviadas" do funil, as BUs Oxy Hacker e Franquia mostram KPIs de Pipeline e Ticket Medio usando o campo `valor` (que pode incluir MRR, Setup, Pontual misturados) e exibem a coluna "MRR" na tabela. Para essas BUs, o unico valor relevante e o "Valor Pontual" que vem do campo "Taxa de franquia".

## Mudanca

### Arquivo: `src/components/planning/ClickableFunnelChart.tsx`

Na funcao `buildPropostaMiniDashboard` (linhas ~301-368):

**1. KPIs condicionais** - Quando a BU selecionada for Oxy Hacker ou Franquia:
- Pipeline = soma de `item.pontual` (ou `item.value` como fallback se pontual nao existe)
- Ticket Medio = Pipeline / qtd propostas
- Remover KPIs que nao fazem sentido (MRR)
- Manter: Propostas (qtd), Valor Pontual (pipeline), Ticket Medio, Envelhecidas, em Risco

**2. Colunas condicionais na tabela** - Quando BU for Oxy Hacker ou Franquia:
- Remover coluna "MRR"
- Renomear coluna "Valor Total" para "Valor Pontual"
- Manter: Produto, Empresa, Valor Pontual, Closer, Dias em Proposta, Data Envio

**3. Pipeline por Closer (grafico de barras)** - Usar `item.pontual` em vez de `item.value` para calcular o pipeline quando BU for expansao

### Detalhes tecnicos

A funcao `buildPropostaMiniDashboard` sera atualizada para verificar as flags `useExpansaoData` e `useOxyHackerData` (ja existentes no componente) e ajustar:

```
const isExpansaoBU = useExpansaoData || useOxyHackerData;

// Para BUs de expansao, usar pontual; para demais, usar value
const getItemValue = (item) => isExpansaoBU ? (item.pontual || 0) : (item.value || 0);

// Pipeline e Ticket Medio recalculados
const pipeline = items.reduce((sum, i) => sum + getItemValue(i), 0);

// Colunas sem MRR para expansao
const columns = isExpansaoBU 
  ? [Produto, Empresa, 'Valor Pontual', Closer, Dias em Proposta, Data Envio]
  : [Produto, Empresa, 'Valor Total', 'MRR', Closer, Dias em Proposta, Data Envio]
```

Para o modo consolidado (multiplas BUs), o comportamento atual sera mantido pois mistura BUs com logicas diferentes.

## Resultado esperado

- Oxy Hacker e Franquia: KPIs mostram apenas valor pontual (Taxa de franquia), sem MRR
- Modelo Atual e O2 TAX: comportamento inalterado (Pipeline = valor total, coluna MRR visivel)
- Consolidado: comportamento inalterado
