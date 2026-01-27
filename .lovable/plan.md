

## Plano: Criar Aba "Indicadores Marketing"

### Objetivo

Criar uma nova aba de Indicadores de Marketing com estrutura modular e preparada para receber dados futuros. A aba seguirá os mesmos padrões visuais e de filtros da aba "Indicadores" (vendas).

---

### Indicadores a Serem Exibidos

Com base nas suas definições:

| Categoria | Indicadores |
|-----------|-------------|
| **Aquisição** | Leads, MQLs, RM (Reuniões Marcadas), RR (Reuniões Realizadas) |
| **Investimento por Canal** | Meta Ads, Google Ads, Eventos |
| **Performance** | ROAS+LTV, ROI LTV, CAC, LTV |
| **Eficiência** | MQL/Leads (taxa de conversão), Conversão Ads por Canal |
| **Investimento** | Investimento Total, Investimento por Fonte |
| **Detalhamento** | Tabela com info de Campanhas, Anúncios, etc. |

---

### Estrutura de Arquivos

```text
src/
├── components/
│   └── planning/
│       ├── MarketingIndicatorsTab.tsx  (NOVO - componente principal)
│       └── marketing-indicators/       (NOVA pasta)
│           ├── InvestmentByChannelChart.tsx
│           ├── AcquisitionFunnelChart.tsx
│           ├── PerformanceGauges.tsx
│           ├── ConversionsByChannelChart.tsx
│           ├── CampaignsTable.tsx
│           └── types.ts
├── hooks/
│   └── useMarketingIndicators.ts  (NOVO - hook para dados futuros)
├── pages/
│   └── Planning2026.tsx  (MODIFICAR - adicionar nova aba)
└── hooks/
    └── useUserPermissions.ts  (MODIFICAR - adicionar 'marketing_indicators')
```

---

### Componente Principal: MarketingIndicatorsTab.tsx

Layout seguindo o padrão da aba Indicadores de vendas:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Indicadores Marketing                                         [BU ▼] [📅 Data] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │    ROAS     │ │   ROI LTV   │ │     CAC     │ │     LTV     │ │ Investimento││
│  │    2.5x     │ │    4.2x     │ │   R$ 9.5k   │ │   R$ 38k    │ │  R$ 150k    ││
│  │  Meta: 3x   │ │  Meta: 5x   │ │ Meta: R$8k  │ │ Meta: R$40k │ │ Meta: R$180k││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                                 │
│  ┌───────────────────────────────────┐ ┌───────────────────────────────────────┐│
│  │   Investimento por Canal          │ │   Funil de Aquisição                  ││
│  │   ┌────┐ ┌────┐ ┌────┐            │ │   Leads → MQL → RM → RR               ││
│  │   │Meta│ │Goog│ │Even│            │ │                                       ││
│  │   │Ads │ │ Ads│ │tos │            │ │   ████████████████████████ 1200       ││
│  │   │ 80k│ │ 50k│ │ 20k│            │ │   █████████████████ 840               ││
│  │   └────┘ └────┘ └────┘            │ │   ███████████ 504                     ││
│  └───────────────────────────────────┘ │   ██████ 302                          ││
│                                        └───────────────────────────────────────┘│
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │   Conversão por Canal                                                        ││
│  │                                                                              ││
│  │   Canal        │ Leads │  MQLs │ Conversão │  CPL  │  CPMQL │    Gasto     ││
│  │   ───────────────────────────────────────────────────────────────────────── ││
│  │   Meta Ads     │  500  │  350  │   70%     │ R$ 80 │ R$ 114 │  R$ 40.000   ││
│  │   Google Ads   │  400  │  280  │   70%     │ R$ 75 │ R$ 107 │  R$ 30.000   ││
│  │   Eventos      │  100  │   85  │   85%     │ R$150 │ R$ 176 │  R$ 15.000   ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │   Campanhas e Anúncios                                      [Collapsible ▼]  ││
│  │                                                                              ││
│  │   Campanha              │ Canal    │ Leads │ MQLs │  Gasto  │  ROAS │ Status ││
│  │   ────────────────────────────────────────────────────────────────────────── ││
│  │   Black Friday 2026     │ Meta Ads │  120  │  84  │ R$ 8.5k │  2.8x │ Ativo  ││
│  │   Webinar Janeiro       │ Google   │   80  │  60  │ R$ 5.2k │  3.1x │ Pausado││
│  └─────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Detalhes Técnicos

#### 1. Tipos de Dados (marketing-indicators/types.ts)

```typescript
export interface MarketingChannel {
  id: string;
  name: string;
  investment: number;
  leads: number;
  mqls: number;
  cpl: number;    // Cost per Lead
  cpmql: number;  // Cost per MQL
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
}

export interface MarketingMetrics {
  roas: number;
  roasLtv: number;
  roiLtv: number;
  cac: number;
  ltv: number;
  totalInvestment: number;
  channels: MarketingChannel[];
  campaigns: CampaignData[];
}
```

#### 2. Hook de Dados (useMarketingIndicators.ts)

```typescript
// Hook preparado para receber dados futuros
// Por agora retorna dados mockados/placeholder

export function useMarketingIndicators(startDate: Date, endDate: Date, selectedBUs: string[]) {
  // Placeholder - será integrado com fonte de dados real
  const mockData: MarketingMetrics = {
    roas: 0,
    roasLtv: 0,
    roiLtv: 0,
    cac: 0,
    ltv: 0,
    totalInvestment: 0,
    channels: [],
    campaigns: [],
  };

  return {
    data: mockData,
    isLoading: false,
    refetch: () => {},
  };
}
```

#### 3. Componentes Modulares

| Componente | Descrição |
|------------|-----------|
| `PerformanceGauges.tsx` | 5 radial gauges: ROAS, ROI LTV, CAC, LTV, Investimento |
| `InvestmentByChannelChart.tsx` | Gráfico de barras por canal (Meta Ads, Google Ads, Eventos) |
| `AcquisitionFunnelChart.tsx` | Funil visual: Leads → MQL → RM → RR |
| `ConversionsByChannelChart.tsx` | Tabela com métricas por canal de aquisição |
| `CampaignsTable.tsx` | Tabela colapsável com detalhes de campanhas e anúncios |

#### 4. Filtros (mesmo padrão da aba Indicadores)

- **Período**: DatePicker com range de datas
- **BUs**: MultiSelect (Modelo Atual, O2 TAX, Oxy Hacker, Franquia)
- **Canal**: MultiSelect (Meta Ads, Google Ads, Eventos) - NOVO

---

### Modificações em Arquivos Existentes

#### 1. useUserPermissions.ts
```typescript
// Adicionar 'marketing_indicators' ao TabKey
export type TabKey = 'context' | 'goals' | 'monthly' | 'sales' | 'media' | 
                     'marketing' | 'structure' | 'admin' | 'indicators' | 
                     'marketing_indicators';  // NOVO

// Atualizar allowedTabs para admins
const allowedTabs: TabKey[] = isAdmin 
  ? ['context', 'goals', 'monthly', 'sales', 'media', 'marketing', 'structure', 
     'admin', 'indicators', 'marketing_indicators']  // Incluir novo
  : permissions || [];
```

#### 2. Planning2026.tsx
```typescript
// Adicionar import
import { MarketingIndicatorsTab } from "@/components/planning/MarketingIndicatorsTab";
import { TrendingUp } from "lucide-react";

// Adicionar à TAB_CONFIG
const TAB_CONFIG = [
  // ... tabs existentes ...
  { key: 'marketing_indicators', label: 'Mkt Indicators', icon: TrendingUp },
];

// Adicionar TabsContent
<TabsContent value="marketing_indicators" className="mt-0">
  <MarketingIndicatorsTab />
</TabsContent>
```

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useUserPermissions.ts` | Modificar | Adicionar 'marketing_indicators' ao TabKey |
| `src/pages/Planning2026.tsx` | Modificar | Adicionar nova aba e TabsContent |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Criar | Componente principal da aba |
| `src/components/planning/marketing-indicators/types.ts` | Criar | Tipos TypeScript |
| `src/components/planning/marketing-indicators/PerformanceGauges.tsx` | Criar | Radial gauges de performance |
| `src/components/planning/marketing-indicators/InvestmentByChannelChart.tsx` | Criar | Gráfico de investimento por canal |
| `src/components/planning/marketing-indicators/AcquisitionFunnelChart.tsx` | Criar | Funil de aquisição visual |
| `src/components/planning/marketing-indicators/ConversionsByChannelChart.tsx` | Criar | Tabela de conversões por canal |
| `src/components/planning/marketing-indicators/CampaignsTable.tsx` | Criar | Tabela de campanhas |
| `src/hooks/useMarketingIndicators.ts` | Criar | Hook para dados (placeholder) |

---

### Próximos Passos (Fora deste Plano)

Após a estrutura criada, a integração de dados reais poderá ser feita:
1. Conectar com APIs do Meta Ads / Google Ads
2. Integrar com Google Sheets para dados manuais de campanhas
3. Criar Edge Function para consolidar dados de múltiplas fontes

