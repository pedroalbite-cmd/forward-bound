

## Correção da Atribuição por Canal

### Problemas identificados

1. **ROI no Orgânico não faz sentido**: Cards classificados como "orgânico" pelo `detectChannel` (sem fbclid/gclid/fonte) estão sendo vinculados a campanhas da API via nome/ID no segundo passo (linhas 161-176). Quando o match acontece, o `investimento` da campanha é atribuído ao card orgânico, gerando um ROI artificial.

2. **"Orgânico" é um catch-all**: Qualquer card sem marcadores claros cai aqui — incluindo indicações, parceiros, leads sem fonte preenchida, etc.

### Correções

**1. Não atribuir investimento a cards orgânicos** (`useMarketingAttribution.ts`)
- Na construção dos funnels (linha ~178), se `data.channel === 'organico'`, forçar `investimento = 0` e `roi = 0`. Orgânico por definição não tem gasto de mídia.
- Isso resolve o ROI 0.6x absurdo.

**2. Melhorar detecção de canal usando a campanha da API** (`useMarketingAttribution.ts`)  
- Após o match da campanha (linhas 161-176), se `apiCampaign` foi encontrada E `data.channel === 'organico'`, reclassificar o canal baseado no `apiCampaign.channel` (que já vem como `'meta'` ou `'google'`). Isso corrige cards que têm campanha paga mas sem tracking parameters.

**3. Renomear "Orgânico" para "Orgânico / Direto"** (labels e ícone)
- Em `types.ts`: `organico: 'Orgânico / Direto'`
- Reflete melhor que inclui tráfego direto, indicações, e leads sem fonte

### Arquivos alterados
- `src/hooks/useMarketingAttribution.ts` — reclassificar canal quando API campaign é encontrada; forçar investimento=0 para orgânico
- `src/components/planning/marketing-indicators/types.ts` — renomear label

