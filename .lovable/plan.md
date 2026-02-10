
# Remover colunas da tabela Campanhas e Anuncios

Remover as colunas **Tipo**, **Impressoes**, **Cliques**, **CTR**, **Alcance** e **Frequencia** de todos os niveis da tabela (campanhas, conjuntos de anuncios e anuncios).

## Arquivo unico afetado

`src/components/planning/marketing-indicators/CampaignsTable.tsx`

## Mudancas

### 1. Header da tabela (linhas 465-471)
Remover os 6 `TableHead`: Tipo, Impressoes, Cliques, CTR, Alcance, Freq. Manter apenas: expand, Preview, Nome, Leads, Gasto, CPL, CPA, Status + colunas CRM.

### 2. CampaignRow (linhas 274-282)
Remover as 7 `TableCell` correspondentes: objective/tipo, impressions, clicks, ctr, reach, frequency. Manter apenas a celula de Leads.

### 3. AdSetRow (linhas 180-186)
Remover as 7 `TableCell`: tipo "Conjunto", impressions, clicks, ctr, reach, frequency. Manter apenas Leads.

### 4. AdRow (linhas 120-126)
Remover as 7 `TableCell`: tipo "Anuncio", impressions, clicks, ctr, reach, frequency. Manter apenas Leads.

### 5. Atualizar colSpan
As linhas com `colSpan={14}` (loading/error/empty states nos niveis AdSet e Campaign) devem ser ajustadas para `colSpan={8}` (14 - 6 colunas removidas).

Colunas finais da tabela:

| Expand | Preview | Nome | Leads (Meta) | Gasto | CPL | CPA | Status | Leads (CRM) | MQLs | Vendas | Receita | ROI |
