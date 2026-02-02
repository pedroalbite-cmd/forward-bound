# Integração Automática: Admin Metas Monetárias ↔ Plan Growth

## ✅ Implementado

A integração automática entre o Admin de Metas Monetárias e o Plan Growth foi concluída.

### Fluxo de Dados

```text
┌───────────────────────────────────────────────────────────────────┐
│                    FONTE DA VERDADE                               │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  monetary_metas (Banco)  ───────────────────────────────────────► │
│         ↓                                                         │
│  [Se valor > 0] ─────► Plan Growth EXIBE esses valores           │
│         ↓               (tabelas, gráficos, funnelData)          │
│  [Se vazio] ─────────► Fallback para cálculos hardcoded          │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│  Admin edita Metas Monetárias → Salva no banco                   │
│                                 ↓                                │
│  React Query invalida cache → Plan Growth re-renderiza           │
│                                 ↓                                │
│  Indicadores usam useConsolidatedMetas                           │
└───────────────────────────────────────────────────────────────────┘
```

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/usePlanGrowthData.ts` | Adicionado `useMonetaryMetas` para ler metas do banco com fallback |
| `src/components/planning/MediaInvestmentTab.tsx` | Usa metas do banco para cálculos de faturamento mensal |
| `src/components/planning/MonetaryMetasTab.tsx` | Removido botão "Importar Plan Growth" - agora é automático |

### Como Funciona

1. **Admin edita Metas Monetárias**
   - Define valores de Incremento (faturamento) para cada mês/BU
   - Para BUs pontual-only (Oxy Hacker, Franquia): campo Pontual = 100% do valor
   - Salva no banco `monetary_metas`

2. **Plan Growth (MediaInvestmentTab)**
   - Lê metas do banco via `useMonetaryMetas`
   - Se banco tem valores > 0: usa esses valores
   - Se banco vazio: usa cálculos hardcoded (fallback)

3. **usePlanGrowthData Hook**
   - Mesmo comportamento: prioriza banco, fallback para cálculos
   - Publica dados no `MediaMetasContext` para outros componentes

4. **Indicadores**
   - `useConsolidatedMetas` lê do banco com fallback para Plan Growth
   - Gauges e métricas refletem os valores configurados no Admin

### BUs Pontual-Only

Para Oxy Hacker e Franquia:
- Não têm MRR/Setup (são vendas pontuais)
- Campo `pontual` = 100% do faturamento
- Lidos via campo `pontual` do banco
