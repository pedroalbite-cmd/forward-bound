

## Integração Oxy Finance: DRE no Rollover + Aba Financeiro

### Contexto do Problema

Hoje o `useEffectiveMetas` usa `realizedByBU` do Pipefy (valor de venda nova) como "Realizado". Isso ignora o MRR recorrente acumulado dos meses anteriores --- a meta é de **faturamento total**, mas o realizado conta só incremento. A API Oxy Finance retorna o DRE contábil real com grupos mapeáveis às BUs.

### Mapeamento BU -> DRE

```text
modelo_atual  ->  CaaS
o2_tax        ->  Tax
oxy_hacker    ->  SaaS
franquia      ->  Expansão
```

---

### Parte 1: Hook `useOxyFinance`

**Novo arquivo:** `src/hooks/useOxyFinance.ts`

- Hook com React Query que chama a Edge Function `fetch-oxy-finance` para os 3 endpoints (DRE, cashflow_details, cashflow_chart)
- Parâmetros: `year` (default 2026)
- DRE: busca `startDate=YYYY-01-01`, `endDate=YYYY-12-31`
- Retorna:
  - `dreByBU`: `Record<BuType, Record<MonthType, number>>` --- faturamento contábil mensal por BU
  - `cashflowChart`: dados de entradas/saídas/saldo mensais
  - `cashflowDetails`: detalhamento por cliente
  - `isLoading`, `error`

### Parte 2: Integrar DRE no Rollover

**Arquivo:** `src/hooks/useEffectiveMetas.ts`

- Importar `useOxyFinance` e usar `dreByBU` como fonte do "Realizado" contábil
- Quando `dreByBU[bu][month]` tem valor > 0, usar esse valor no lugar do `realizedByBU[bu][month]` (Pipefy)
- Fallback: se DRE não retornou dados, manter Pipefy como está
- Expor ambos os valores (`realizedDRE` e `realizedPipefy`) para comparação

### Parte 3: Aba Financeiro

**Novos arquivos:**
- `src/components/planning/FinancialTab.tsx` --- componente principal da aba
- `src/components/planning/financial/DreTable.tsx` --- tabela DRE mensal por BU (CaaS, Tax, SaaS, Expansão) com linha de total
- `src/components/planning/financial/CashflowChart.tsx` --- gráfico de barras (Entradas vs Saídas) + linha de Saldo usando Recharts
- `src/components/planning/financial/MetaVsRealized.tsx` --- comparativo: meta (monetary_metas) vs realizado (DRE) por BU, com indicadores de cor (verde/vermelho)

**Arquivo modificado:** `src/pages/Planning2026.tsx`
- Adicionar `'financial'` ao `TAB_CONFIG` com ícone `DollarSign`
- Adicionar `TabsContent` para a aba
- Adicionar `'financial'` ao tipo `TabKey` em `useUserPermissions.ts`

**Arquivo modificado:** `src/hooks/useUserPermissions.ts`
- Adicionar `'financial'` ao union type `TabKey`

### Estrutura da Aba Financeiro

```text
┌─────────────────────────────────────────────┐
│  Financeiro                                 │
├─────────────────────────────────────────────┤
│  [Tabela DRE]                               │
│  Colunas: BU | Jan | Fev | ... | Dez | Total│
│  Linhas: CaaS, Tax, SaaS, Expansão, TOTAL  │
├─────────────────────────────────────────────┤
│  [Meta vs Realizado]                        │
│  Cards por BU: meta, realizado, gap (%)     │
├─────────────────────────────────────────────┤
│  [Fluxo de Caixa]                           │
│  Barras: Entradas (verde) vs Saídas (verm.) │
│  Linha: Saldo acumulado                     │
└─────────────────────────────────────────────┘
```

### Alterações Resumidas

| Arquivo | Tipo |
|---|---|
| `src/hooks/useOxyFinance.ts` | NOVO |
| `src/hooks/useEffectiveMetas.ts` | EDIT - usar DRE como realizado |
| `src/components/planning/FinancialTab.tsx` | NOVO |
| `src/components/planning/financial/DreTable.tsx` | NOVO |
| `src/components/planning/financial/CashflowChart.tsx` | NOVO |
| `src/components/planning/financial/MetaVsRealized.tsx` | NOVO |
| `src/pages/Planning2026.tsx` | EDIT - adicionar aba |
| `src/hooks/useUserPermissions.ts` | EDIT - adicionar TabKey |

