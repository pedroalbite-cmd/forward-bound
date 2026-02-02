

## ✅ Integrar Receita do Mkt Indicadores com Dados do Modelo Atual

**Status: CONCLUÍDO**

### Resumo

A seção de "Receita" na aba **Mkt Indicadores** agora usa dados reais de vendas do **Modelo Atual** (tabela `pipefy_moviment_cfos`), respeitando os filtros de período e BU selecionados.

---

### Arquitetura Implementada

```text
MarketingIndicatorsTab
    │
    ├── useMarketingIndicators (dados de mídia da planilha)
    │
    ├── useModeloAtualMetas (dados de vendas do Pipefy) ✅
    │       └── getMrrForPeriod, getSetupForPeriod, getPontualForPeriod, getEducacaoForPeriod
    │
    └── RevenueMetricsCards
            └── Exibe cards com valores do Modelo Atual (quando selecionado)
```

---

### Arquivos Modificados

| Arquivo | Ação |
|---------|------|
| `src/hooks/useModeloAtualMetas.ts` | ✅ Adicionada função `getEducacaoForPeriod` |
| `src/components/planning/MarketingIndicatorsTab.tsx` | ✅ Integrado `useModeloAtualMetas` e passando dados reais |

---

### Comportamento por Filtro de BU

| BU Selecionada | Fonte de Dados |
|----------------|----------------|
| Modelo Atual | `pipefy_moviment_cfos` (dados reais) ✅ |
| O2 TAX | Planilha (dados de mídia) |
| Oxy Hacker | Planilha (dados de mídia) |
| Franquia | Planilha (dados de mídia) |

---

### Nota sobre GMV

O **GMV** (Gross Merchandise Value) continua vindo da planilha de marketing — não está disponível na tabela `pipefy_moviment_cfos`.
