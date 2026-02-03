
## Híbrido: Planilha + Meta API para Meses Sem Dados

### Contexto

A planilha de marketing só tem dados até Janeiro/2026. Para Fevereiro em diante, o sistema precisa buscar o que conseguir da API do Meta Ads e deixar vazio o que não tiver fonte de dados.

### Mapeamento de Fontes de Dados

| Métrica | Planilha (Jan) | Meta API (Fev+) | Fallback |
|---------|----------------|-----------------|----------|
| **Mídia Meta** | midiaMeta | `spend` agregado | 0 |
| **Mídia Google** | midiaGoogle | - | 0 |
| **Leads Meta** | leadsMeta | `actions.lead` | 0 |
| **Leads Google** | leadsGoogle | - | 0 |
| **CPL** | calculado | calculado | 0 |
| **MQL** | mqlPorFaturamento | - | 0 |
| **Reunião Marcada** | reuniaoMarcada | - | 0 |
| **Reunião Realizada** | reuniaoRealizada | - | 0 |
| **Proposta** | propostaEnviada | - | 0 |
| **Vendas** | vendas | - | 0 |
| **MRR, Setup, etc** | mrr, setup... | - (Pipefy) | 0 |
| **GMV** | gmv | - | 0 |

**Resumo:** Para meses sem dados na planilha, a Meta API fornece:
- Mídia Meta (spend)
- Leads Meta (actions)
- Impressões, Cliques

O resto fica zerado ou vem de outras fontes (Pipefy para MRR/Setup/Pontual).

---

### Solução Proposta

Modificar a Edge Function `read-marketing-sheet` para:

1. Detectar quais meses não têm dados na planilha (valores zerados ou inexistentes)
2. Para esses meses, buscar dados agregados da Meta API
3. Combinar: dados da planilha + dados da Meta para meses faltantes
4. Deixar como 0 (não mock) as métricas que não têm fonte

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/read-marketing-sheet/index.ts` | Adicionar busca de fallback da Meta API para meses sem dados |
| `src/hooks/useMarketingIndicators.ts` | Ajuste menor se necessário |

---

### Lógica de Implementação

```text
Período Selecionado (ex: Jan-Mar 2026)
         │
         ▼
┌─────────────────────────────┐
│ Buscar dados da planilha    │
│ para todos os meses         │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Verificar: planilha tem     │
│ dados para cada mês?        │
│ (midiaTotal > 0?)           │
└────────────┬────────────────┘
             │
   ┌─────────┴─────────┐
   │                   │
  Sim                 Não
   │                   │
   ▼                   ▼
┌─────────┐    ┌─────────────────────┐
│Usar     │    │Buscar da Meta API:  │
│planilha │    │- spend (mídia)      │
└─────────┘    │- leads (actions)    │
               └──────────┬──────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │ Combinar resultados │
               │ Deixar 0 o que não  │
               │ tem fonte           │
               └─────────────────────┘
```

---

### Implementação Detalhada na Edge Function

```typescript
// Novo: buscar dados da Meta API para meses específicos
async function fetchMetaDataForPeriod(
  startDate: string, 
  endDate: string,
  metaAccessToken: string,
  metaAdAccountId: string
): Promise<{ spend: number; leads: number; impressions: number; clicks: number }> {
  
  const formattedAccountId = metaAdAccountId.startsWith('act_') 
    ? metaAdAccountId 
    : `act_${metaAdAccountId}`;
    
  const timeRange = JSON.stringify({ since: startDate, until: endDate });
  const fields = "spend,impressions,clicks,actions";
  
  const url = `https://graph.facebook.com/v21.0/${formattedAccountId}/insights?fields=${fields}&time_range=${encodeURIComponent(timeRange)}&access_token=${metaAccessToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    console.error("Meta API error:", data.error);
    return { spend: 0, leads: 0, impressions: 0, clicks: 0 };
  }
  
  const insights = data.data?.[0] || {};
  const spend = parseFloat(insights.spend || '0');
  const impressions = parseInt(insights.impressions || '0', 10);
  const clicks = parseInt(insights.clicks || '0', 10);
  
  // Extrair leads das actions
  let leads = 0;
  if (insights.actions) {
    const leadAction = insights.actions.find((a: any) => 
      a.action_type === 'lead' || 
      a.action_type === 'onsite_conversion.lead_grouped' ||
      a.action_type === 'offsite_conversion.fb_pixel_lead'
    );
    leads = leadAction ? parseInt(leadAction.value, 10) : 0;
  }
  
  return { spend, leads, impressions, clicks };
}

// No serve(), após buscar dados da planilha:
const sheetMetrics = mergeMetrics(data2025, data2026);

// Verificar se planilha retornou dados (indicador: midiaTotal > 0)
const hasSheetData = (sheetMetrics.midiaTotal || 0) > 0;

if (!hasSheetData && startDate && endDate) {
  // Buscar fallback da Meta API
  const metaToken = Deno.env.get("META_ACCESS_TOKEN");
  const metaAccount = Deno.env.get("META_AD_ACCOUNT_ID");
  
  if (metaToken && metaAccount) {
    console.log("Sheet has no data, fetching from Meta API as fallback");
    
    const metaData = await fetchMetaDataForPeriod(startDate, endDate, metaToken, metaAccount);
    
    // Preencher apenas Meta Ads (não Google)
    sheetMetrics.midiaMeta = metaData.spend;
    sheetMetrics.midiaTotal = metaData.spend; // Só Meta, Google = 0
    sheetMetrics.leadsMeta = metaData.leads;
    sheetMetrics.leadsTotais = metaData.leads;
    
    // Recalcular CPL
    if (metaData.leads > 0) {
      sheetMetrics.cplMeta = metaData.spend / metaData.leads;
      sheetMetrics.cplTotal = metaData.spend / metaData.leads;
    }
    
    // O resto fica 0 (não tem fonte)
    // MQL, RM, RR, Propostas, Vendas, MRR, Setup, etc = 0
  }
}
```

---

### Resultado Esperado

| Período | Fonte Mídia Meta | Fonte Leads Meta | Fonte MQL/RM/etc | Fonte MRR/Setup |
|---------|------------------|------------------|------------------|-----------------|
| Jan 2026 | Planilha | Planilha | Planilha | Planilha |
| Fev 2026 | Meta API | Meta API | 0 (sem fonte) | Pipefy (já integrado) |
| Mar 2026 | Meta API | Meta API | 0 (sem fonte) | Pipefy (já integrado) |

**Importante:** O MRR/Setup/Pontual já vem do Pipefy no frontend (hook `useModeloAtualMetas` e `useO2TaxMetas`), então continuará funcionando para Fev+.

---

### Tratamento de Erros

- Se Meta API falhar: retorna 0 para os campos
- Se planilha falhar: tenta Meta API como fallback completo
- Nunca usa dados mockados

---

### Observações

1. **Google Ads não tem API integrada** - ficará zerado para meses sem planilha
2. **Funil de vendas** (MQL, RM, RR, Proposta, Venda) vem do CRM - não disponível ainda, ficará zerado
3. **Revenue** (MRR, Setup, Pontual) já vem do Pipefy no frontend, não precisa de fallback
4. **GMV** não tem fonte alternativa - ficará zerado

Esta abordagem garante que:
- Dados reais são usados quando disponíveis
- Meta API complementa para mídia/leads
- Nenhum dado mockado é utilizado
