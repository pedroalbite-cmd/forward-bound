

## Plano: Distribuir dados CRM do Conjunto de Anúncios para os Anúncios individuais

### Problema
`AdRow` sempre passa `funnel={undefined}` para `CrmCells` (linha 326). Os anúncios individuais nunca mostram MQL, RM, RR, PE, Venda, ROAS.

### Solução
Distribuir o funnel do ad set pai proporcionalmente pelo gasto de cada anúncio (mesma lógica já usada campanha→ad set).

### Alterações em `CampaignsTable.tsx`

1. **`AdRow`**: Adicionar prop `adFunnel?: CampaignFunnel` e passar para `CrmCells`
2. **`AdSetRow`**: Calcular distribuição proporcional dos dados CRM do `adSetFunnel` pelos anúncios filhos usando `ad.spend / totalAdsSpend`, e passar o funnel proporcional para cada `AdRow`
3. **`GoogleAdGroupRow`**: Mesma lógica para os anúncios/keywords do Google (se aplicável — keywords já não mostram CRM, manter assim)

