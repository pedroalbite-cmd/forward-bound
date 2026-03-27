
Objetivo: corrigir o filtro de período do NPS para que realmente altere os indicadores quando o usuário escolhe ano/quarter/faixa de data.

1) Erros identificados no código atual
- `Q1/Q2/Q3/Q4` usam sempre `new Date().getFullYear()` em `NpsFilters.tsx`, então os quarters ficam presos ao ano atual (2026), não ao ano que o usuário quer analisar (ex.: 2025).
- Em `NpsTab.tsx`, `hasFilters` considera `selectedPeriod !== 'all'` mesmo sem intervalo completo (`from` e `to`), então parece “filtro ativo” mas a lista não é filtrada.
- O filtro por data usa `end` no início do dia (`00:00`), podendo excluir registros do último dia selecionado.

2) Correção proposta
- Em `NpsTab.tsx`:
  - Criar `hasDateFilter = Boolean(dateRange?.from && dateRange?.to)`.
  - Trocar `hasFilters` para usar `hasDateFilter` (e não apenas `selectedPeriod`).
  - Aplicar filtro de data somente quando `hasDateFilter` for true.
  - Normalizar intervalo para incluir o dia final inteiro (`startOfDay(from)` até `endOfDay(to)`).
- Em `NpsFilters.tsx`:
  - Adicionar filtro de **Ano** (ex.: Todos, 2026, 2025, 2024) e passar isso para o cálculo de quarter.
  - Fazer Q1/Q2/Q3/Q4 usarem o ano selecionado (não o ano do relógio).
  - Se período customizado estiver incompleto, não marcar como filtro efetivo.
- Em `NpsTab.tsx` (UX):
  - Exibir feedback claro quando o filtro retornar 0 resultados (ex.: “Nenhum card no período selecionado”), evitando sensação de que “não mudou nada”.

3) Arquivos a ajustar
- `src/components/planning/NpsTab.tsx`
  - Lógica de `hasFilters`, `filteredNpsData`, normalização de datas, estado de ano selecionado e empty state.
- `src/components/planning/nps/NpsFilters.tsx`
  - UI/handlers de Ano + quarter baseado no ano selecionado + validação de período custom.

4) Critérios de aceite (teste funcional)
- Selecionar um ano sem dados deve zerar KPIs e exibir estado “sem resultados”.
- Trocar de 2026 para 2025 deve alterar números visivelmente.
- Q1/Q2/Q3/Q4 devem responder ao ano escolhido.
- Filtro custom só deve impactar quando tiver data inicial e final válidas.
