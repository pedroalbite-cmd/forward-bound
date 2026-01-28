
## Plano: Adicionar Colunas MRR, Setup e Pontual nos Drill-Downs

### Contexto

Atualmente, os modais de drill-down (DetailSheet) exibem apenas a coluna "Valor" (que é a soma de MRR + Setup + Pontual + Educação). O usuário deseja visualizar essas informações **separadamente** para melhor análise.

---

### Análise do Código Atual

| Componente | Arquivo | Colunas Atuais |
|------------|---------|----------------|
| **IndicatorsTab** (radial cards) | `IndicatorsTab.tsx` | Produto, Empresa/Contato, Data, Tempo na Fase, Valor ou Faixa, Responsável |
| **ClickableFunnelChart** | `ClickableFunnelChart.tsx` | Produto, Título, Empresa, Fase, Data, Tempo, Valor ou Faixa, Responsável |
| **LeadsMqlsStackedChart** | `LeadsMqlsStackedChart.tsx` | Título, Empresa, Fase, Data, Faixa Faturamento |

O `DetailItem` já possui os campos `mrr`, `setup` e `pontual` definidos, e o hook `useModeloAtualAnalytics` já popula esses campos no `toDetailItem`. Porém, os hooks `useO2TaxAnalytics` e `useExpansaoAnalytics` **NÃO** populam esses campos.

---

### Solução Proposta

#### 1. Atualizar Hooks de Analytics para Popular MRR, Setup e Pontual

**Arquivo:** `src/hooks/useO2TaxAnalytics.ts`

Atualizar a função `toDetailItem` para incluir os valores monetários:

```typescript
const toDetailItem = (card: O2TaxCard): DetailItem => ({
  id: card.id,
  name: card.titulo,
  company: card.contato || card.titulo,
  phase: PHASE_DISPLAY_MAP[card.faseAtual] || card.faseAtual,
  date: card.dataEntrada.toISOString(),
  value: card.valor,
  reason: card.motivoPerda || undefined,
  revenueRange: card.faixa || undefined,
  responsible: card.responsavel || undefined,
  closer: card.closer || undefined,
  duration: card.duracao,
  product: 'O2 TAX',
  mrr: card.valorMRR,        // ← ADICIONAR
  setup: card.valorSetup,    // ← ADICIONAR
  pontual: card.valorPontual, // ← ADICIONAR
});
```

**Arquivo:** `src/hooks/useExpansaoAnalytics.ts`

Atualizar a função `toDetailItem` para incluir os valores monetários:

```typescript
const toDetailItem = (card: ExpansaoCard): DetailItem => ({
  id: card.id,
  name: card.titulo,
  company: card.titulo,
  phase: PHASE_DISPLAY_MAP[card.faseAtual] || card.faseAtual,
  date: card.dataEntrada.toISOString(),
  value: card.valor,
  reason: card.motivoPerda || undefined,
  responsible: card.responsavel || undefined,
  duration: card.duracao,
  product: card.produto,
  mrr: card.valorMRR,        // ← ADICIONAR
  setup: card.valorSetup,    // ← ADICIONAR
  pontual: card.valorPontual, // ← ADICIONAR
});
```

#### 2. Atualizar Colunas nos Componentes de Drill-Down

**Arquivo:** `src/components/planning/IndicatorsTab.tsx`

Na função `getColumnsForIndicator`, adicionar colunas MRR, Setup e Pontual para os indicadores de proposta e venda:

```typescript
const getColumnsForIndicator = (indicatorKey: IndicatorType) => {
  const baseColumns = [
    { key: 'product', label: 'Produto', format: columnFormatters.product },
    { key: 'company', label: 'Empresa/Contato' },
    { key: 'date', label: 'Data', format: columnFormatters.date },
    { key: 'duration', label: 'Tempo na Fase', format: columnFormatters.duration },
  ];

  if (indicatorKey === 'proposta' || indicatorKey === 'venda') {
    return [
      ...baseColumns,
      { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
      { key: 'setup', label: 'Setup', format: columnFormatters.currency },
      { key: 'pontual', label: 'Pontual', format: columnFormatters.currency },
      { key: 'responsible', label: 'Responsável' },
    ];
  }

  return [
    ...baseColumns,
    { key: 'revenueRange', label: 'Faixa Faturamento' },
    { key: 'responsible', label: 'Responsável' },
  ];
};
```

**Arquivo:** `src/components/planning/ClickableFunnelChart.tsx`

Na função `getColumnsForIndicator`, aplicar a mesma lógica:

```typescript
const getColumnsForIndicator = (indicator: IndicatorType) => {
  const baseColumns = [
    { key: 'product', label: 'Produto', format: columnFormatters.product },
    { key: 'name', label: 'Título' },
    { key: 'company', label: 'Empresa/Contato' },
    { key: 'phase', label: 'Fase', format: columnFormatters.phase },
    { key: 'date', label: 'Data', format: columnFormatters.date },
    { key: 'duration', label: 'Tempo na Fase', format: columnFormatters.duration },
  ];

  if (indicator === 'proposta' || indicator === 'venda') {
    return [
      ...baseColumns,
      { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
      { key: 'setup', label: 'Setup', format: columnFormatters.currency },
      { key: 'pontual', label: 'Pontual', format: columnFormatters.currency },
      { key: 'responsible', label: 'Responsável' },
    ];
  }

  return [
    ...baseColumns,
    { key: 'revenueRange', label: 'Faixa Faturamento' },
    { key: 'responsible', label: 'Responsável' },
  ];
};
```

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useO2TaxAnalytics.ts` | Modificar | Adicionar `mrr`, `setup`, `pontual` no `toDetailItem` |
| `src/hooks/useExpansaoAnalytics.ts` | Modificar | Adicionar `mrr`, `setup`, `pontual` no `toDetailItem` |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Atualizar `getColumnsForIndicator` para exibir colunas monetárias |
| `src/components/planning/ClickableFunnelChart.tsx` | Modificar | Atualizar `getColumnsForIndicator` para exibir colunas monetárias |

---

### Resultado Esperado

Ao clicar em **Proposta** ou **Venda** (nos radial cards ou no funil), o modal exibirá:

| Produto | Empresa/Contato | Data | Tempo | MRR | Setup | Pontual | Responsável |
|---------|-----------------|------|-------|-----|-------|---------|-------------|
| CaaS | Empresa ABC | 15/01/2026 | 5d 2h | R$ 8.500 | R$ 2.000 | R$ 500 | Pedro |
| O2 TAX | Empresa XYZ | 14/01/2026 | 3d 4h | R$ 15.000 | R$ 0 | R$ 0 | Lucas |

Para outros indicadores (Leads, MQL, RM, RR), as colunas permanecerão como estão (sem valores monetários detalhados).

---

### Observação sobre Expansão (Franquia/Oxy Hacker)

A tabela `pipefy_cards_movements_expansao` já possui os campos `Valor MRR`, `Valor Setup` e `Valor Pontual` sendo parseados no hook `useExpansaoAnalytics` (linhas 17-18), então os dados já estão disponíveis. Apenas precisamos adicioná-los ao `toDetailItem`.
