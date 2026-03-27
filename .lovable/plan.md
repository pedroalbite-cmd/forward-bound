

## Adicionar filtros de Produto, CFO e Período na seção NPS

### Problema
A seção de Resultados NPS não possui filtros — mostra sempre todos os dados agregados sem possibilidade de segmentar por produto, consultor (CFO) ou período.

### Solução

**1. Expandir o fetch de dados para incluir "Produtos"**

- Adicionar `'Produtos': string | null` à interface `CentralProjeto` em `useNpsData.ts`
- Criar um `produtoMap: Record<string, string>` (NPS card ID → produto) análogo ao `cfoMap` e `titleMap`
- Retornar `produtoMap` junto com os demais maps no `fetchNpsData()`

**2. Separar fetch dos dados brutos do processamento**

- O hook `useNpsData` passará a retornar os dados brutos (`npsRows`, `cfoMap`, `titleMap`, `produtoMap`, `npsPipeId`) além dos dados processados
- Criar uma função `useFilteredNpsData` ou mover a lógica de `processNpsData` para ser chamada com filtros aplicados
- Alternativamente: retornar os raw data e aplicar `useMemo` no componente com os filtros

**3. Criar componente de filtros `NpsFilters`**

Barra de filtros no topo da seção NPS com:
- **Produto** — Multi-select extraído dos valores únicos do `produtoMap`
- **CFO** — Multi-select extraído dos valores únicos do `cfoMap`
- **Período** — Preset buttons: "Todos", "Q1", "Q2", "Q3", "Q4", "Personalizado" (com date range picker para o caso personalizado)

O filtro usa o campo `Entrada` do card NPS para filtrar por data.

**4. Aplicar filtros antes do processamento**

No `NpsTab.tsx`:
- Manter estado dos filtros (`selectedProdutos`, `selectedCfos`, `dateRange`)
- Filtrar `npsRows` baseado nos filtros antes de chamar `processNpsData`
- Usar `useMemo` para recalcular apenas quando filtros ou dados mudam

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useNpsData.ts` | Adicionar `Produtos` ao `CentralProjeto`, criar `produtoMap`, exportar `processNpsData` e retornar raw data |
| `src/components/planning/nps/NpsFilters.tsx` | **Novo** — componente de filtros (Produto, CFO, Período) |
| `src/components/planning/NpsTab.tsx` | Adicionar estado de filtros, usar `NpsFilters`, aplicar filtros com `useMemo` antes de processar |

### Detalhes técnicos

- Filtro por data usa o campo `Entrada` do NPS card (já disponível na interface `NpsCard`)
- Produto vem da `pipefy_central_projetos` via connections (mesmo padrão do CFO)
- Os filtros são client-side (dados já carregados, sem chamadas adicionais à API)
- Quarters são calculados com base no ano corrente: Q1=Jan-Mar, Q2=Abr-Jun, Q3=Jul-Set, Q4=Out-Dez

