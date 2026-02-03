

## Integrar Meta Ads API na Aba de Marketing Indicadores

### Objetivo

Criar uma integração real com a API do Meta (Facebook/Instagram Ads) para buscar e exibir campanhas ativas, conjuntos de anúncios (ad sets) e métricas de performance na tabela "Campanhas e Anúncios" que atualmente está vazia.

---

### Requisitos para Funcionar

Para integrar com o Meta Ads API, precisaremos de **2 informações**:

| Segredo | Descrição |
|---------|-----------|
| `META_ACCESS_TOKEN` | Token de acesso (System User ou User Token de longa duração) |
| `META_AD_ACCOUNT_ID` | ID da conta de anúncios (formato: act_XXXXX) |

O token precisa ter as permissões: `ads_read` e `ads_management`

---

### Arquitetura da Solução

```text
┌──────────────────┐      ┌─────────────────────────┐      ┌──────────────┐
│  Frontend React  │ ─────│  Edge Function          │ ─────│  Meta Graph  │
│  CampaignsTable  │      │  fetch-meta-campaigns   │      │  API v21.0   │
└──────────────────┘      └─────────────────────────┘      └──────────────┘
```

---

### Dados que Serão Retornados

A API do Meta permite buscar:

**1. Campanhas (Campaigns):**
- ID, nome, status (ACTIVE, PAUSED, DELETED)
- Objetivo (LEAD_GENERATION, CONVERSIONS, etc.)
- Budget (orçamento diário/vitalício)
- Insights: spend, impressions, clicks, actions

**2. Conjuntos de Anúncios (Ad Sets):**
- ID, nome, status
- Targeting (idade, localização, interesses)
- Budget
- Insights: reach, frequency, cost_per_result

**3. Anúncios (Ads):**
- ID, nome, status
- Creative (imagem/vídeo)
- Insights detalhados

---

### Implementação - Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/fetch-meta-campaigns/index.ts` | Criar Edge Function para buscar dados do Meta |
| `src/hooks/useMetaCampaigns.ts` | Criar hook para consumir a Edge Function |
| `src/components/planning/marketing-indicators/types.ts` | Expandir interface CampaignData |
| `src/components/planning/marketing-indicators/CampaignsTable.tsx` | Atualizar para mostrar dados reais + expandir conjuntos |
| `src/hooks/useMarketingIndicators.ts` | Integrar dados do Meta nas campanhas |
| `supabase/config.toml` | Adicionar configuração da nova função |

---

### Edge Function: fetch-meta-campaigns

```typescript
// supabase/functions/fetch-meta-campaigns/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_API_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("META_ACCESS_TOKEN");
    const adAccountId = Deno.env.get("META_AD_ACCOUNT_ID");
    
    if (!accessToken || !adAccountId) {
      throw new Error("META_ACCESS_TOKEN ou META_AD_ACCOUNT_ID não configurados");
    }

    const { startDate, endDate } = await req.json();

    // Buscar campanhas com insights
    const campaignsUrl = `${META_BASE_URL}/${adAccountId}/campaigns`;
    const campaignFields = [
      "id", "name", "status", "objective", "daily_budget", "lifetime_budget"
    ].join(",");
    
    const insightsFields = ["spend", "impressions", "clicks", "actions", "cpc", "cpm"].join(",");
    
    const campaignsResponse = await fetch(
      `${campaignsUrl}?fields=${campaignFields}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED"]}]&access_token=${accessToken}`
    );
    
    const campaignsData = await campaignsResponse.json();
    
    if (campaignsData.error) {
      throw new Error(campaignsData.error.message);
    }

    // Para cada campanha, buscar insights e ad sets
    const enrichedCampaigns = await Promise.all(
      campaignsData.data.map(async (campaign) => {
        // Buscar insights da campanha
        const insightsUrl = `${META_BASE_URL}/${campaign.id}/insights`;
        const insightsResponse = await fetch(
          `${insightsUrl}?fields=${insightsFields}&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${accessToken}`
        );
        const insightsData = await insightsResponse.json();
        
        // Buscar ad sets da campanha
        const adSetsUrl = `${META_BASE_URL}/${campaign.id}/adsets`;
        const adSetsResponse = await fetch(
          `${adSetsUrl}?fields=id,name,status,daily_budget,targeting&access_token=${accessToken}`
        );
        const adSetsData = await adSetsResponse.json();
        
        return {
          ...campaign,
          insights: insightsData.data?.[0] || null,
          adSets: adSetsData.data || [],
        };
      })
    );

    return new Response(JSON.stringify({ 
      success: true, 
      campaigns: enrichedCampaigns,
      dateRange: { startDate, endDate }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Erro ao buscar campanhas Meta:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

### Novo Hook: useMetaCampaigns

```typescript
// src/hooks/useMetaCampaigns.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CampaignData } from '@/components/planning/marketing-indicators/types';

interface MetaCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED';
  objective: string;
  daily_budget: string;
  insights: {
    spend: string;
    impressions: string;
    clicks: string;
    actions?: Array<{ action_type: string; value: string }>;
  } | null;
  adSets: Array<{
    id: string;
    name: string;
    status: string;
    daily_budget: string;
  }>;
}

export function useMetaCampaigns(startDate: Date, endDate: Date, enabled = true) {
  return useQuery({
    queryKey: ['meta-campaigns', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<CampaignData[]> => {
      const { data, error } = await supabase.functions.invoke('fetch-meta-campaigns', {
        body: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      // Transformar dados do Meta para o formato CampaignData
      return data.campaigns.map((c: MetaCampaign): CampaignData => ({
        id: c.id,
        name: c.name,
        channel: 'Meta Ads',
        status: c.status === 'ACTIVE' ? 'active' : 
                c.status === 'PAUSED' ? 'paused' : 'ended',
        investment: parseFloat(c.insights?.spend || '0'),
        leads: c.insights?.actions?.find(a => a.action_type === 'lead')?.value 
               ? parseInt(c.insights.actions.find(a => a.action_type === 'lead')!.value) 
               : 0,
        mqls: 0, // MQLs precisam vir do CRM (Pipefy)
        roas: 0, // Calcular com dados de vendas
        startDate: new Date().toISOString(),
        adSets: c.adSets, // Dados dos conjuntos
      }));
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}
```

---

### Tipos Expandidos

```typescript
// Adicionar ao types.ts
export interface AdSetData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'ended';
  dailyBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

export interface CampaignData {
  id: string;
  name: string;
  channel: string;
  status: 'active' | 'paused' | 'ended';
  investment: number;
  leads: number;
  mqls: number;
  roas: number;
  startDate: string;
  endDate?: string;
  objective?: string;        // NOVO
  adSets?: AdSetData[];      // NOVO - conjuntos aninhados
}
```

---

### CampaignsTable com Expansão de Conjuntos

A tabela será atualizada para:
1. Mostrar campanhas reais do Meta
2. Permitir expandir cada campanha para ver os conjuntos de anúncios
3. Mostrar métricas como spend, impressions, clicks, leads

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Campanhas e Anúncios                          [▼]      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Campanha                 │ Canal      │ Leads │ Gasto    │ CPL    │ Status    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ▶ Lead Gen - CFO Premium  │ Meta Ads   │  45   │ R$ 8.5k  │ R$ 189 │ 🟢 Ativo  │
│   ├─ Conjunto: Diretores  │            │  28   │ R$ 5.2k  │ R$ 186 │ 🟢 Ativo  │
│   └─ Conjunto: C-Level    │            │  17   │ R$ 3.3k  │ R$ 194 │ 🟢 Ativo  │
│ ▶ Remarketing - Isca      │ Meta Ads   │  32   │ R$ 4.2k  │ R$ 131 │ 🟢 Ativo  │
│ ▶ Brand Awareness         │ Meta Ads   │  12   │ R$ 2.8k  │ R$ 233 │ 🟡 Pausado│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Próximos Passos para Implementar

1. **Você me passa o token** (META_ACCESS_TOKEN e META_AD_ACCOUNT_ID)
2. **Eu configuro os secrets** via ferramenta
3. **Crio a Edge Function** para conectar com a API do Meta
4. **Atualizo o hook e a tabela** para consumir os dados reais

---

### Limitações e Considerações

| Aspecto | Consideração |
|---------|--------------|
| **Taxa de API** | Meta tem rate limits (~200 chamadas/hora por token) |
| **Token expira** | Tokens de usuário expiram em 60 dias. System User tokens são mais duráveis |
| **MQLs/ROAS** | Meta não sabe quais leads viraram MQL - precisamos cruzar com Pipefy |
| **Tempo real** | Dados do Meta podem ter delay de até 24h |

---

### Benefícios

1. Ver todas as campanhas ativas diretamente no dashboard
2. Monitorar gastos e leads por campanha/conjunto
3. Identificar campanhas com melhor CPL
4. Evitar ter que entrar no Gerenciador de Anúncios para checar performance

