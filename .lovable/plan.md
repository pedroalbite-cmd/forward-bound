

## Plano: Reestruturar colunas da tabela Campanhas e Anúncios

### Situação atual
Colunas atuais: `expand | Preview | Nome | Leads | Gasto | CPL | CPA | Status | Leads (CRM) | MQLs | Vendas | Receita | TCV | ROI`

### Colunas desejadas
`expand | Preview | Nome | Gasto | Leads | CPL | MQL | CPMQL | RM | RR | PE | Venda | ROAS`

- **Gasto** = investimento da API (campaign.investment)
- **Leads** = leads da API (campaign.leads)
- **CPL** = campaign.cpl
- **MQL** = funnel.mqls (CRM)
- **CPMQL** = Gasto / MQLs (calculado)
- **RM** = funnel.rms (CRM)
- **RR** = funnel.rrs (CRM)
- **PE** = funnel.propostas (CRM)
- **Venda** = funnel.vendas (CRM)
- **ROAS** = funnel.roi ou receita/investimento

Remove: CPA, Status, Leads (CRM), Receita, TCV, ROI separado

### Alterações

**Arquivo**: `src/components/planning/marketing-indicators/CampaignsTable.tsx`

1. **TableHeader** (linhas 660-676): Substituir colunas por Gasto, Leads, CPL, MQL, CPMQL, RM, RR, PE, Venda, ROAS
2. **CampaignRow** (linhas 431-471): Atualizar células para mostrar as novas colunas, calcular CPMQL inline
3. **CrmCells** (linhas 151-177): Reescrever para renderizar MQL, CPMQL, RM, RR, PE, Venda, ROAS
4. **Sub-rows** (AdSetRow, GoogleAdGroupRow, AdRow, GoogleKeywordRow): Atualizar para manter mesmo número de colunas
5. **Footer** (linhas 695-722): Atualizar totais
6. **colSpan** em loading/error rows: Ajustar de 14 para o novo total de colunas

### Dados
O `CampaignFunnel` já possui `rms`, `rrs`, `propostas`, `vendas`, `receita`, `investimento`, `roi` — todos os campos necessários estão disponíveis.

