

## Seção de Operação na aba NPS

### O que será feito

Adicionar uma seção completa de **Operação** na aba NPS com dados em tempo real do banco externo, cobrindo visão geral dos clientes e tratativas. O conteúdo atual de NPS ficará em um bloco colapsável (clicável para mostrar/esconder).

### Layout final da aba NPS

```text
┌─────────────────────────────────────┐
│  Header (Q4 2025 / Customer Success)│
├─────────────────────────────────────┤
│  ▼ Operação (seção nova, aberta)    │
│  ┌─ KPIs: Clientes ativos,         │
│  │  Em onboarding, Em tratativa,    │
│  │  Churn, MRR total               │
│  ├─ Distribuição por fase (barras)  │
│  ├─ Clientes por CFO (tabela)      │
│  ├─ Tratativas ativas (tabela)     │
│  │  Motivo, Decisão, Tempo médio   │
│  └─ Motivos de churn (gráfico)     │
├─────────────────────────────────────┤
│  ▼ NPS (colapsável, fechado)        │
│  ┌─ NpsKpiCards                     │
│  ├─ NpsGauges                       │
│  ├─ NpsScoreCards                   │
│  ├─ NpsDistributions                │
│  ├─ CfoPerformanceTable             │
│  ├─ QualitativeFeedback             │
│  └─ ExecutiveSummary                │
└─────────────────────────────────────┘
```

### Alterações

**1. Edge Function — `supabase/functions/query-external-db/index.ts`**
- Adicionar `pipefy_central_projetos`, `pipefy_moviment_tratativas`, `pipefy_db_clientes`, `pipefy_db_pessoas` ao array `validTables`

**2. Novo hook — `src/hooks/useOperationsData.ts`**
- Buscar dados de `pipefy_central_projetos` (cards na fase atual) e `pipefy_moviment_tratativas` (tratativas ativas)
- Calcular KPIs: clientes por fase, MRR total, distribuição por CFO
- Calcular métricas de tratativas: ativos por motivo, decisões finais, tempo médio por fase

**3. Novo componente — `src/components/planning/nps/OperationsSection.tsx`**
- KPI cards: Total clientes ativos, Em onboarding, Em tratativa, Churn
- Tabela de distribuição por CFO (nome, qtd clientes, MRR)
- Tabela de tratativas ativas (empresa, motivo, CFO responsável, dias em tratativa)
- Distribuição de motivos de churn (barras horizontais)

**4. Alterar — `src/components/planning/NpsTab.tsx`**
- Importar `OperationsSection` e `Collapsible`
- Adicionar `OperationsSection` no topo
- Envolver todo o conteúdo NPS existente em um `Collapsible` com trigger clicável "Resultados NPS" (inicialmente fechado)

### Dados que serão buscados

**pipefy_central_projetos** (WHERE "Fase" = "Fase Atual"):
- Fase atual → contagem por fase (Onboarding, Em Operação Recorrente, Em Tratativa, Churn)
- CFO Responsavel → agrupamento
- Valor CFOaaS → soma MRR
- Produtos → segmentação

**pipefy_moviment_tratativas** (WHERE "Fase" = "Fase Atual"):
- Título, CFO Responsavel, Motivo, Decisao Final, Motivo Churn
- Duração na fase atual (tempo em tratativa)
- Fase Atual → distribuição (Em Tratativa com CS, Plano de Ação, etc.)

