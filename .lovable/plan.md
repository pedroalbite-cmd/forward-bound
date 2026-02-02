

## Plano: Alimentar Indicadores de Marketing com a Aba "Indicadores 26"

### Contexto

A aba **"Indicadores 26"** (gid=1310877066) da planilha contém todas as métricas de marketing organizadas por mês. A estrutura é uma tabela onde:
- **Coluna A**: Nome da métrica (ex: "Mídia Google Ads", "Leads - Meta Ads", "CPL total", etc.)
- **Colunas B-R**: Valores mensais (January/25, February/25, ..., December/25 + totais)

Esta planilha já contém:
- Investimento por canal (Google Ads, Meta Ads)
- Leads e CPL por canal
- Funil completo (MQLs, RM, RR, Propostas, Vendas)
- Custos por etapa (CPL, CPMQL, CPRM, CPRR, CPV)
- Taxas de conversão
- Receitas (MRR, Setup, Pontual, Educação, GMV)
- Métricas avançadas (CAC, LTV, TCV, ROAS, ROI, LTV/CAC, etc.)

---

### Arquivos a Criar/Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/read-marketing-sheet/index.ts` | **NOVA** Edge Function dedicada para ler a planilha de marketing |
| `src/hooks/useMarketingSheetData.ts` | **NOVO** Hook para buscar e processar dados da planilha |
| `src/hooks/useMarketingIndicators.ts` | Modificar para consumir dados reais via `useMarketingSheetData` |
| `supabase/config.toml` | Adicionar configuração da nova Edge Function |

---

### Mapeamento de Dados (Planilha → Tipos)

| Linha na Planilha | Campo no Sistema | Tipo |
|-------------------|------------------|------|
| Mídia Google Ads | `googleAds.investment` | R$ |
| Leads - Google Ads | `googleAds.leads` | número |
| CPL - Google Ads | `googleAds.cpl` | R$ |
| Mídia Meta Ads | `metaAds.investment` | R$ |
| Leads - Meta Ads | `metaAds.leads` | número |
| CPL - Meta Ads | `metaAds.cpl` | R$ |
| Mídia total | `totalInvestment` | R$ |
| Leads totais | `totalLeads` | número |
| CPL total | `costPerStage.cpl` | R$ |
| MQL por Faturamento | `totalMqls` | número |
| CPMQL por Faturamento | `costPerStage.cpmql` | R$ |
| Reunião marcada | `totalRms` | número |
| CPRM | `costPerStage.cprm` | R$ |
| Reunião realizada | `totalRrs` | número |
| CPRR | `costPerStage.cprr` | R$ |
| Proposta enviada | `totalPropostas` | número |
| Vendas | `totalVendas` | número |
| CPV | `costPerStage.cpv` | R$ |
| MRR | `revenue.mrr` | R$ |
| Setup | `revenue.setup` | R$ |
| Pontual | `revenue.pontual` | R$ |
| Educação | `revenue.educacao` | R$ |
| GMV | `revenue.gmv` | R$ |
| CAC | `cac` | R$ |
| LTV | `ltv` | R$ |
| TCV | `tcv` | R$ |
| ROAS | `roas` | decimal |
| ROAS LTV | `roasLtv` | decimal |
| ROI LTV | `roiLtv` | decimal |
| LTV/CAC | `ltvCac` | decimal |

---

### Seção Técnica

**1. Nova Edge Function `read-marketing-sheet`:**

Esta função lerá diretamente da planilha de marketing usando o ID hardcoded (já que você quer um segredo separado):

```typescript
// Planilha de Marketing Indicadores 26
const MARKETING_SHEET_ID = '1O27qvdplGeRGmnueUJOwk1FPN83hiUUf3-SZbR9x4ig';
const MARKETING_TAB_NAME = 'Indicadores 26';

// Busca dados via Google Visualization API
const sheetUrl = `https://docs.google.com/spreadsheets/d/${MARKETING_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MARKETING_TAB_NAME)}`;

// Retorna dados estruturados por linha:
// { rows: [{ metric: 'Mídia Google Ads', jan: 16531.02, feb: 0, ... }] }
```

**2. Novo Hook `useMarketingSheetData`:**

```typescript
export function useMarketingSheetData({ startDate, endDate }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['marketing-sheet', startDate, endDate],
    queryFn: async () => {
      const response = await supabase.functions.invoke('read-marketing-sheet', {
        body: { startDate, endDate }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutos
  });
  
  return { data, isLoading, refetch };
}
```

**3. Modificar `useMarketingIndicators`:**

Substituir dados mock por dados reais:

```typescript
export function useMarketingIndicators({ startDate, endDate, ... }) {
  const { data: sheetData, isLoading, refetch } = useMarketingSheetData({ startDate, endDate });
  
  const data = useMemo<MarketingMetrics>(() => {
    if (!sheetData) return mockData; // Fallback
    
    return {
      // Canais
      channels: [
        {
          id: 'meta_ads',
          name: 'Meta Ads',
          investment: sheetData.midiaMeta,
          leads: sheetData.leadsMeta,
          cpl: sheetData.cplMeta,
          // ... calcular demais métricas
        },
        {
          id: 'google_ads',
          name: 'Google Ads',
          investment: sheetData.midiaGoogle,
          leads: sheetData.leadsGoogle,
          cpl: sheetData.cplGoogle,
        },
      ],
      
      // Totais
      totalInvestment: sheetData.midiaTotal,
      totalLeads: sheetData.leadsTotais,
      totalMqls: sheetData.mqlPorFaturamento,
      totalRms: sheetData.reuniaoMarcada,
      totalRrs: sheetData.reuniaoRealizada,
      totalPropostas: sheetData.propostaEnviada,
      totalVendas: sheetData.vendas,
      
      // Custos por etapa (já calculados na planilha)
      costPerStage: {
        cpl: sheetData.cplTotal,
        cpmql: sheetData.cpmqlPorFaturamento,
        cprm: sheetData.cprm,
        cprr: sheetData.cprr,
        cpv: sheetData.cpv,
      },
      
      // Receitas
      revenue: {
        mrr: sheetData.mrr,
        setup: sheetData.setup,
        pontual: sheetData.pontual,
        educacao: sheetData.educacao,
        gmv: sheetData.gmv,
      },
      
      // Performance
      roas: sheetData.roas,
      roasLtv: sheetData.roasLtv,
      roiLtv: sheetData.roiLtv,
      cac: sheetData.cac,
      ltv: sheetData.ltv,
    };
  }, [sheetData]);
  
  return { data, goals, costGoals, costByChannel, isLoading, refetch };
}
```

---

### Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Google Sheets: "Indicadores 26" (gid=1310877066)                   │
│  Planilha: 1O27qvdplGeRGmnueUJOwk1FPN83hiUUf3-SZbR9x4ig            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│          read-marketing-sheet Edge Function                          │
│  - Lê aba "Indicadores 26" via Google Visualization API            │
│  - Parseia linhas: "Mídia Google Ads", "Leads - Meta Ads", etc.    │
│  - Retorna objeto estruturado com métricas por período             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  useMarketingSheetData Hook                          │
│  - Chama Edge Function via TanStack Query                           │
│  - Cache de 5 minutos                                               │
│  - Gerencia loading/error states                                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 useMarketingIndicators Hook                          │
│  - Transforma dados da planilha → MarketingMetrics                  │
│  - Mantém estrutura de channels, revenue, costPerStage              │
│  - Fallback para dados mock se erro                                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  MarketingIndicatorsTab                              │
│  - ChannelMetricsCards (Meta Ads, Google Ads)                       │
│  - RevenueMetricsCards (MRR, Setup, GMV)                            │
│  - CostPerStageGauges (CPL, CPMQL, CPRM, CPRR, CPV)                │
│  - PerformanceGauges (ROAS, CAC, LTV, LTV/CAC)                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Dados Disponíveis na Planilha (Janeiro/25)

| Métrica | Valor Real |
|---------|------------|
| Mídia Google Ads | R$ 16.531,02 |
| Leads Google Ads | 26 |
| CPL Google Ads | R$ 635,81 |
| Mídia Meta Ads | R$ 126.152,74 |
| Leads Meta Ads | 668 |
| CPL Meta Ads | R$ 188,85 |
| Mídia Total | R$ 142.683,76 |
| Leads Totais | 694 |
| CPL Total | R$ 205,60 |
| MQL por Faturamento | 357 |
| CPMQL | R$ 399,67 |
| Reunião Marcada | 157 |
| CPRM | R$ 908,81 |
| Reunião Realizada | 134 |
| CPRR | R$ 1.463,31 |
| Proposta Enviada | 93 |
| Vendas | 13 |
| CPV | R$ 10.975,67 |
| MRR | R$ 84.308,35 |
| Setup | R$ 196.264,00 |
| Pontual | R$ 8.690,00 |
| GMV | R$ 289.262,35 |
| CAC | R$ 15.083,37 |
| LTV | R$ 590.158,45 |
| TCV | R$ 1.216.654,20 |
| ROAS | 2,03 |
| ROAS LTV | 4,14 |
| LTV/CAC | 7,53 |

---

### Impacto

1. **Dados reais**: Dashboard de Marketing passará a exibir dados atualizados da planilha
2. **Sem segredo adicional**: O ID da planilha será hardcoded na Edge Function (planilha pública para leitura)
3. **Agregação por período**: Seletor de data filtrará os meses correspondentes
4. **Cache**: Dados serão cacheados por 5 minutos para performance
5. **Fallback**: Se a planilha falhar, dados mock serão exibidos como backup

