

## Mover filtros NPS para o topo da aba

### Problema
Os filtros de Produto, CFO e Período estão dentro da seção colapsável "Resultados NPS", que inicia fechada (`npsOpen = false`). Por isso não são visíveis ao abrir a aba.

### Solução
Mover o bloco `<NpsFilters>` para fora das seções colapsáveis, posicionando-o logo abaixo do header da aba (antes do Dossiê de Churn). Assim os filtros ficam sempre visíveis no topo.

Os filtros continuarão afetando apenas a seção de Resultados NPS (mesmo comportamento atual), mas estarão acessíveis independentemente de qual seção está aberta/fechada.

### Arquivo alterado
- `src/components/planning/NpsTab.tsx` — mover o `<NpsFilters ... />` de dentro do bloco `{npsOpen && ...}` para logo após o `<div>` do header (após o `<p>` de descrição), e envolver a renderização em uma checagem de `displayData` para garantir que os filtros só apareçam quando os dados estiverem carregados.

