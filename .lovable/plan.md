

## Plano: Expandir Métricas do Mkt Indicadores

### Objetivo

Adicionar as seguintes informações que ainda não estão presentes:

| Categoria | Métricas Novas |
|-----------|---------------|
| **Mídia por Canal** | Mídia Google Ads, Leads Google Ads, CPL Google Ads, Mídia Meta Ads, Leads Meta Ads, CPL Meta Ads |
| **Instagram** | Instagram O2, Instagram Pedro, Instagram Total |
| **Totais** | Mídia Total, Leads Totais, CPL Total |
| **Receita** | MRR, Setup, Pontual, Educação, GMV |
| **Custos por Etapa** | CPL, CPMQL, CPRM, CPRR, CPP (proposta), CPV (venda) |

---

### Estrutura Visual Proposta

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Indicadores de Marketing                                   [Filtros: BU, Data, Canal]│
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  MÍDIA E LEADS POR CANAL                                                       │  │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │  │
│  │  │  Meta Ads      │ │  Google Ads    │ │  Instagram     │ │  TOTAIS        │  │  │
│  │  │  Mídia: R$ 85k │ │  Mídia: R$ 62k │ │  O2: R$ 8k     │ │  Mídia: R$ 175k│  │  │
│  │  │  Leads: 520    │ │  Leads: 380    │ │  Pedro: R$ 5k  │ │  Leads: 995    │  │  │
│  │  │  CPL: R$ 163   │ │  CPL: R$ 163   │ │  Total: R$ 13k │ │  CPL: R$ 176   │  │  │
│  │  └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  RECEITA                                                                       │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐│  │
│  │  │    MRR      │ │   Setup     │ │  Pontual    │ │  Educação   │ │    GMV    ││  │
│  │  │  R$ 125k    │ │  R$ 45k     │ │  R$ 22k     │ │  R$ 18k     │ │  R$ 210k  ││  │
│  │  │ Meta: R$150k│ │ Meta: R$50k │ │ Meta: R$30k │ │ Meta: R$25k │ │Meta: R$250k│  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘│  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  CUSTO POR ETAPA DO FUNIL                                                      │  │
│  │                                                                                │  │
│  │  CPL (Lead) ──▶ CPMQL ──▶ CPRM ──▶ CPRR ──▶ CPP (Proposta) ──▶ CPV (Venda)   │  │
│  │    R$ 176        R$ 246     R$ 402    R$ 497       R$ 625          R$ 9.200   │  │
│  │                                                                                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ┌──────────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │  Performance (existente)         │  │  Funil de Aquisição (existente)         │  │
│  │  ROAS | ROI LTV | CAC | LTV      │  │  Leads → MQL → RM → RR                  │  │
│  └──────────────────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Conversão por Canal (existente - adicionar colunas)                          │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  Campanhas e Anúncios (existente)                                             │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Novos Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `ChannelMetricsCards.tsx` | Cards com Mídia/Leads/CPL por canal (Meta Ads, Google Ads, Instagram, Totais) |
| `RevenueMetricsCards.tsx` | Cards com MRR, Setup, Pontual, Educação, GMV |
| `CostPerStageChart.tsx` | Visualização de custo por etapa do funil (CPL → CPV) |

---

### Modificações em Arquivos Existentes

#### 1. types.ts - Novos tipos

```typescript
// Adicionar ao MarketingChannel
export interface MarketingChannel {
  // ... campos existentes ...
  propostas?: number;
  vendas?: number;
  cprm?: number;    // Cost per RM
  cprr?: number;    // Cost per RR
  cpp?: number;     // Cost per Proposta
  cpv?: number;     // Cost per Venda
}

// Novo tipo para Instagram
export interface InstagramMetrics {
  instagramO2: number;
  instagramPedro: number;
  instagramTotal: number;
}

// Novo tipo para Receita
export interface RevenueMetrics {
  mrr: number;
  setup: number;
  pontual: number;
  educacao: number;
  gmv: number;
}

// Atualizar MarketingMetrics
export interface MarketingMetrics {
  // ... campos existentes ...
  
  // Novas métricas de receita
  revenue: RevenueMetrics;
  
  // Instagram breakdown
  instagram: InstagramMetrics;
  
  // Custo por etapa (agregado)
  costPerStage: {
    cpl: number;
    cpmql: number;
    cprm: number;
    cprr: number;
    cpp: number;
    cpv: number;
  };
  
  // Propostas e Vendas totais
  totalPropostas: number;
  totalVendas: number;
}
```

#### 2. useMarketingIndicators.ts - Dados fictícios

Adicionar dados mockados para as novas métricas:

```typescript
// Instagram
instagram: {
  instagramO2: 8000,
  instagramPedro: 5000,
  instagramTotal: 13000,
},

// Receita
revenue: {
  mrr: 125000,
  setup: 45000,
  pontual: 22000,
  educacao: 18000,
  gmv: 210000,
},

// Custo por etapa
costPerStage: {
  cpl: 176,      // Investimento / Leads
  cpmql: 246,    // Investimento / MQLs
  cprm: 402,     // Investimento / RMs
  cprr: 497,     // Investimento / RRs
  cpp: 625,      // Investimento / Propostas
  cpv: 9200,     // Investimento / Vendas (CAC)
},

totalPropostas: 280,
totalVendas: 19,
```

#### 3. MarketingIndicatorsTab.tsx - Layout atualizado

Reorganizar para incluir os novos componentes:

```typescript
// Novo layout
<div className="space-y-6">
  {/* Filtros (existente) */}
  
  {/* NOVO: Cards de Mídia por Canal */}
  <ChannelMetricsCards 
    channels={data.channels} 
    instagram={data.instagram}
    totalInvestment={data.totalInvestment}
    totalLeads={data.totalLeads}
  />
  
  {/* NOVO: Cards de Receita */}
  <RevenueMetricsCards 
    revenue={data.revenue}
    goals={goals.revenue}
  />
  
  {/* NOVO: Custo por Etapa do Funil */}
  <CostPerStageChart costPerStage={data.costPerStage} />
  
  {/* Performance Gauges (existente) */}
  <PerformanceGauges ... />
  
  {/* Charts existentes */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <InvestmentByChannelChart ... />
    <AcquisitionFunnelChart ... />
  </div>
  
  {/* Tabelas existentes */}
  <ConversionsByChannelChart ... />
  <CampaignsTable ... />
</div>
```

---

### Componente: ChannelMetricsCards.tsx

Grid de 4 cards mostrando:

| Card | Conteúdo |
|------|----------|
| **Meta Ads** | Mídia R$ 85k, Leads 520, CPL R$ 163 |
| **Google Ads** | Mídia R$ 62k, Leads 380, CPL R$ 163 |
| **Instagram** | O2 R$ 8k, Pedro R$ 5k, Total R$ 13k |
| **TOTAIS** | Mídia R$ 175k, Leads 995, CPL R$ 176 |

---

### Componente: RevenueMetricsCards.tsx

Grid de 5 cards com:
- MRR (com barra de progresso vs meta)
- Setup (com barra de progresso vs meta)
- Pontual (com barra de progresso vs meta)
- Educação (com barra de progresso vs meta)
- GMV (com barra de progresso vs meta)

---

### Componente: CostPerStageChart.tsx

Visualização horizontal tipo "pipeline" mostrando:

```text
Lead ────▶ MQL ────▶ RM ────▶ RR ────▶ Proposta ────▶ Venda
R$176      R$246     R$402    R$497      R$625        R$9.2k
```

Cada etapa mostra o custo acumulado por chegada nessa fase.

---

### Dados Fictícios Completos

**Meta Ads:**
- Mídia: R$ 85.000
- Leads: 520
- CPL: R$ 163

**Google Ads:**
- Mídia: R$ 62.000
- Leads: 380
- CPL: R$ 163

**Instagram:**
- O2: R$ 8.000
- Pedro: R$ 5.000
- Total: R$ 13.000

**Totais:**
- Mídia Total: R$ 175.000
- Leads Totais: 995
- CPL Total: R$ 176

**Receita:**
- MRR: R$ 125.000 (Meta: R$ 150.000)
- Setup: R$ 45.000 (Meta: R$ 50.000)
- Pontual: R$ 22.000 (Meta: R$ 30.000)
- Educação: R$ 18.000 (Meta: R$ 25.000)
- GMV: R$ 210.000 (Meta: R$ 250.000)

**Custo por Etapa:**
- CPL: R$ 176
- CPMQL: R$ 246
- CPRM: R$ 402
- CPRR: R$ 497
- CPP: R$ 625
- CPV: R$ 9.200

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `marketing-indicators/types.ts` | Modificar | Adicionar InstagramMetrics, RevenueMetrics, costPerStage |
| `useMarketingIndicators.ts` | Modificar | Adicionar dados fictícios para todas as novas métricas |
| `marketing-indicators/ChannelMetricsCards.tsx` | Criar | Cards com Mídia/Leads/CPL por canal + Instagram + Totais |
| `marketing-indicators/RevenueMetricsCards.tsx` | Criar | Cards com MRR, Setup, Pontual, Educação, GMV |
| `marketing-indicators/CostPerStageChart.tsx` | Criar | Visualização de custo por etapa do funil |
| `MarketingIndicatorsTab.tsx` | Modificar | Integrar novos componentes no layout |

