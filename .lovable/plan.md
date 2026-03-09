

## Plano: Adicionar ordenação por coluna na tabela de Campanhas e Anúncios

### Objetivo
Permitir clicar nos cabeçalhos das colunas para ordenar a tabela (ex: ver campanhas com mais vendas primeiro).

### Alterações

**Arquivo**: `src/components/planning/marketing-indicators/CampaignsTable.tsx`

1. **Estado de ordenação**: Adicionar `sortKey` e `sortAsc` (similar ao `CampaignFunnelTable`)
2. **Cabeçalho clicável**: Substituir os `<TableHead>` estáticos por um componente `SortHeader` com ícone `ArrowUpDown` — colunas: Gasto, Leads, CPL, MQL, CPMQL, RM, RR, PE, Venda, ROAS
3. **Lógica de ordenação**: Criar lista unificada de linhas (campanhas API + funnels órfãos) com valores normalizados para cada coluna, ordenar antes de renderizar. Para campanhas API, os valores CRM vêm do `getFunnel()`. Para órfãos, Gasto/Leads/CPL ficam como 0
4. **Manter expand/collapse**: A ordenação reorganiza as linhas-pai; sub-rows (ad sets, ads) continuam aninhados dentro de cada campanha

### Colunas ordenáveis
`Gasto | Leads | CPL | MQL | CPMQL | RM | RR | PE | Venda | ROAS`

Nome e Preview não precisam de ordenação.

