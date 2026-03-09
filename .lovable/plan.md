

## Diagnóstico: Campanhas mostra 2 vendas vs ~38 nas origens

### Causa raiz confirmada

A tabela "Campanhas e Anúncios" (linha 654) itera **apenas sobre campanhas da API** com investimento > 0:

```typescript
campaigns.filter(c => c.investment > 0).map((campaign) => ...)
```

Para cada campanha da API, `getFunnel(campaign)` tenta achar o `CampaignFunnel` CRM correspondente. Cards CRM cujo campo `campanha` não bate com nenhuma campanha da API (ex: "(Sem campanha)", campanha com nome diferente, ou cards orgânicos) **nunca aparecem**.

A tabela de "Conversão por Tipo de Origem" usa `allCards` diretamente — por isso mostra todas as vendas.

### Solução

**Arquivo**: `src/components/planning/marketing-indicators/CampaignsTable.tsx`

Após renderizar as campanhas da API, identificar e renderizar **funnels CRM órfãos** — aqueles com dados (leads/vendas > 0) que não foram consumidos por nenhum `getFunnel()`.

1. **Rastrear funnels consumidos**: Guardar num Set quais funnels foram matched durante o render das campanhas API
2. **Filtrar órfãos**: `campaignFunnels.filter(f => !consumed && (f.leads > 0 || f.vendas > 0))`
3. **Renderizar linhas simples**: Para cada funnel órfão, uma linha com badge "CRM", nome da campanha do CRM, sem gasto/CPL da API, e as colunas CRM (MQL, RM, RR, PE, Venda, ROAS)
4. **Footer**: Incluir totais dos órfãos nos totais gerais

### Detalhes de implementação

- Criar componente `CrmOnlyRow` simplificado (sem expand/drill-down de ad sets)
- Usar badge com estilo diferente (ex: "CRM" cinza/roxo) para distinguir
- Colunas Gasto, Leads (API), CPL ficam com "-" pois não há dados da API
- Colunas MQL, CPMQL, RM, RR, PE, Venda, ROAS vêm do CampaignFunnel normalmente

