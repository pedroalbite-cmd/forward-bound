

## Plano: Adicionar Coluna de Produto nos Modais de Detalhes

### Objetivo

Adicionar uma nova coluna "Produto" em todos os modais de detalhes clicáveis (DetailSheet) mostrando de qual produto/BU o registro pertence:
- **CaaS** (CFO as a Service) - para Modelo Atual
- **O2 TAX** - para O2 TAX
- **Oxy Hacker** - para Oxy Hacker
- **Franquia** - para Franquia

---

### Estrutura da Mudança

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    Fluxo de Dados Atualizado                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. DetailSheet.tsx                                                │
│      └─► Adicionar "product?: string" ao DetailItem                │
│      └─► Adicionar formatador "product" para exibir badge colorido │
│                                                                     │
│   2. useModeloAtualAnalytics.ts                                     │
│      └─► toDetailItem: product: 'CaaS'                             │
│                                                                     │
│   3. useO2TaxAnalytics.ts                                           │
│      └─► toDetailItem: product: 'O2 TAX'                           │
│                                                                     │
│   4. useExpansaoAnalytics.ts                                        │
│      └─► toDetailItem: product: card.produto (Franquia/Oxy Hacker) │
│                                                                     │
│   5. IndicatorsTab.tsx / ClickableFunnelChart.tsx                   │
│      └─► Adicionar coluna 'product' ao baseColumns                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Mudanças por Arquivo

#### 1. `src/components/planning/indicators/DetailSheet.tsx`

**Adicionar campo ao DetailItem:**

```typescript
export interface DetailItem {
  id: string;
  name: string;
  company?: string;
  phase?: string;
  date?: string;
  value?: number;
  reason?: string;
  revenueRange?: string;
  responsible?: string;
  duration?: number;
  product?: string; // NOVO: CaaS, O2 TAX, Oxy Hacker, Franquia
}
```

**Adicionar formatador de produto com cores distintas:**

```typescript
export const columnFormatters = {
  // ... existentes ...
  product: (value: string) => {
    if (!value) return '-';
    
    const colorMap: Record<string, string> = {
      'CaaS': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'O2 TAX': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'Oxy Hacker': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Franquia': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    
    const colorClass = colorMap[value] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={`font-normal ${colorClass}`}>
        {value}
      </Badge>
    );
  },
};
```

---

#### 2. `src/hooks/useModeloAtualAnalytics.ts`

**Adicionar produto fixo no toDetailItem:**

```typescript
const toDetailItem = (card: ModeloAtualCard): DetailItem => ({
  id: card.id,
  name: card.titulo || card.empresa || 'Sem título',
  company: card.empresa || card.contato || undefined,
  phase: card.faseDestino,
  date: card.dataEntrada.toISOString(),
  value: card.valor,
  revenueRange: card.faixa || undefined,
  responsible: card.closer || card.responsavel || undefined,
  duration: card.duracao,
  product: 'CaaS', // NOVO: identificar como CaaS
});
```

---

#### 3. `src/hooks/useO2TaxAnalytics.ts`

**Adicionar produto fixo no toDetailItem:**

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
  duration: card.duracao,
  product: 'O2 TAX', // NOVO: identificar como O2 TAX
});
```

---

#### 4. `src/hooks/useExpansaoAnalytics.ts`

**Usar o campo `produto` do card (já existe):**

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
  product: card.produto, // NOVO: usar produto do card (Franquia ou Oxy Hacker)
});
```

---

#### 5. `src/components/planning/IndicatorsTab.tsx`

**Adicionar coluna 'Produto' como primeira coluna:**

```typescript
const getColumnsForIndicator = (indicatorKey: IndicatorType) => {
  const baseColumns = [
    { key: 'product', label: 'Produto', format: columnFormatters.product }, // NOVO
    { key: 'company', label: 'Empresa/Contato' },
    { key: 'date', label: 'Data', format: columnFormatters.date },
    { key: 'duration', label: 'Tempo na Fase', format: columnFormatters.duration },
  ];
  // ... resto igual
};
```

---

#### 6. `src/components/planning/ClickableFunnelChart.tsx`

**Adicionar coluna 'Produto' como primeira coluna:**

```typescript
const getColumnsForIndicator = (indicator: IndicatorType) => {
  const baseColumns = [
    { key: 'product', label: 'Produto', format: columnFormatters.product }, // NOVO
    { key: 'company', label: 'Empresa/Contato' },
    { key: 'date', label: 'Data', format: columnFormatters.date },
    { key: 'duration', label: 'Tempo na Fase', format: columnFormatters.duration },
  ];
  // ... resto igual
};
```

---

### Visualização da Tabela

**Antes:**

| Empresa/Contato | Data | Tempo na Fase | Faixa Faturamento | Responsável | Pipefy |
|-----------------|------|---------------|-------------------|-------------|--------|
| Empresa X | 26/01/2026 | 3d 5h | R$ 50k-200k | Pedro | link |
| Empresa Y | 25/01/2026 | 1d 8h | R$ 200k-500k | Daniel | link |

**Depois:**

| Produto | Empresa/Contato | Data | Tempo na Fase | Faixa Faturamento | Responsável | Pipefy |
|---------|-----------------|------|---------------|-------------------|-------------|--------|
| CaaS | Empresa X | 26/01/2026 | 3d 5h | R$ 50k-200k | Pedro | link |
| O2 TAX | Empresa Y | 25/01/2026 | 1d 8h | R$ 200k-500k | - | link |
| Oxy Hacker | Empresa Z | 20/01/2026 | 6d 12h | - | Carlos | link |
| Franquia | Empresa W | 18/01/2026 | 8d 3h | - | Maria | link |

---

### Cores dos Badges

| Produto | Cor Light Mode | Cor Dark Mode |
|---------|----------------|---------------|
| CaaS | Azul claro (bg-blue-100) | Azul escuro (bg-blue-900) |
| O2 TAX | Âmbar/Laranja (bg-amber-100) | Âmbar escuro (bg-amber-900) |
| Oxy Hacker | Roxo (bg-purple-100) | Roxo escuro (bg-purple-900) |
| Franquia | Verde (bg-green-100) | Verde escuro (bg-green-900) |

---

### Resumo de Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/planning/indicators/DetailSheet.tsx` | Modificar | Adicionar `product` ao tipo e formatador com badge colorido |
| `src/hooks/useModeloAtualAnalytics.ts` | Modificar | Adicionar `product: 'CaaS'` ao toDetailItem |
| `src/hooks/useO2TaxAnalytics.ts` | Modificar | Adicionar `product: 'O2 TAX'` ao toDetailItem |
| `src/hooks/useExpansaoAnalytics.ts` | Modificar | Adicionar `product: card.produto` ao toDetailItem |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Adicionar coluna 'Produto' ao getColumnsForIndicator |
| `src/components/planning/ClickableFunnelChart.tsx` | Modificar | Adicionar coluna 'Produto' ao getColumnsForIndicator |

---

### Observações Técnicas

1. **Fonte de dados do Expansão:** O hook `useExpansaoAnalytics` já recebe o campo `produto` do banco (`card.produto`), que já contém "Franquia" ou "Oxy Hacker"

2. **Posicionamento da coluna:** A coluna "Produto" será a primeira coluna da tabela para dar destaque imediato à identificação do registro

3. **Badges coloridos:** Cada produto terá uma cor distinta para facilitar a identificação visual rápida ao escanear a tabela

