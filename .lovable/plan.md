
## Vincular Metas Monetárias (Admin) com Plan Growth

### Problema Atual

Existem **duas fontes de metas desconectadas**:

1. **Plan Growth** (`MediaInvestmentTab`/`usePlanGrowthData`)
   - Calcula metas mensais via funil reverso
   - Publica no `MediaMetasContext`
   - Usado pelos Indicadores

2. **Admin > Metas Monetárias** (`MonetaryMetasTab`)
   - Armazena overrides no banco `monetary_metas`
   - **NÃO é consumido por nenhum dashboard**

Resultado: O admin pode configurar metas personalizadas, mas elas **nunca aparecem nos Indicadores**.

---

### Solução Proposta

Criar uma **hierarquia de prioridade**:

```text
┌─────────────────────────────────────────────────────────────────┐
│                   FONTE DA VERDADE PARA METAS                   │
├─────────────────────────────────────────────────────────────────┤
│  1. monetary_metas (banco)  → Se tiver valor > 0, usa           │
│                                                                 │
│  2. Plan Growth (funnelData) → Fallback se banco vazio          │
├─────────────────────────────────────────────────────────────────┤
│           IndicatorsTab & SalesGoalsTab consomem via            │
│                   hook centralizado                              │
└─────────────────────────────────────────────────────────────────┘
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useConsolidatedMetas.ts` | **CRIAR** | Hook que mescla banco + context |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Usar novo hook para metas monetárias |
| `src/components/planning/MonetaryMetasTab.tsx` | Modificar | Adicionar botão "Importar do Plan Growth" |
| `src/hooks/usePlanGrowthData.ts` | Modificar | Expor dados de faturamento por mês |

---

### Implementação Detalhada

#### 1. Criar `useConsolidatedMetas` Hook

```typescript
// src/hooks/useConsolidatedMetas.ts

import { useMonetaryMetas, BuType, MonthType } from './useMonetaryMetas';
import { useMediaMetas } from '@/contexts/MediaMetasContext';

export interface ConsolidatedMetaResult {
  faturamento: number;
  mrr: number;
  setup: number;
  pontual: number;
  source: 'database' | 'plan_growth' | 'calculated';
}

export function useConsolidatedMetas() {
  const { metas, getMeta } = useMonetaryMetas();
  const { metasPorBU, funnelData } = useMediaMetas();

  // Get consolidated meta for a specific BU/Month/Metric
  // Priority: 1) Database value > 0, 2) Plan Growth value
  const getConsolidatedMeta = (
    bu: BuType,
    month: MonthType,
    metric: 'faturamento' | 'mrr' | 'setup' | 'pontual'
  ): { value: number; source: 'database' | 'plan_growth' | 'calculated' } => {
    // Check database first
    const dbValue = getMeta(bu, month, metric);
    if (dbValue > 0) {
      return { value: dbValue, source: 'database' };
    }

    // Fallback to Plan Growth
    const planGrowthValue = getPlanGrowthMeta(bu, month, metric);
    if (planGrowthValue > 0) {
      return { value: planGrowthValue, source: 'plan_growth' };
    }

    return { value: 0, source: 'calculated' };
  };

  // Get meta from Plan Growth (funnelData + ticket médio)
  const getPlanGrowthMeta = (
    bu: BuType,
    month: string,
    metric: 'faturamento' | 'mrr' | 'setup' | 'pontual'
  ): number => {
    if (!funnelData) return 0;

    // Map BU to funnelData key
    const buToFunnel: Record<BuType, keyof typeof funnelData> = {
      modelo_atual: 'modeloAtual',
      o2_tax: 'o2Tax',
      oxy_hacker: 'oxyHacker',
      franquia: 'franquia',
    };

    const tickets: Record<BuType, number> = {
      modelo_atual: 17000,
      o2_tax: 15000,
      oxy_hacker: 54000,
      franquia: 140000,
    };

    const buData = funnelData[buToFunnel[bu]];
    const monthData = buData?.find(d => d.month === month);
    if (!monthData) return 0;

    const faturamento = (monthData.vendas || 0) * tickets[bu];
    
    // Para BUs pontual-only, 100% vai para pontual
    const isPontualOnly = bu === 'oxy_hacker' || bu === 'franquia';

    switch (metric) {
      case 'faturamento': return faturamento;
      case 'mrr': return isPontualOnly ? 0 : Math.round(faturamento * 0.25);
      case 'setup': return isPontualOnly ? 0 : Math.round(faturamento * 0.6);
      case 'pontual': return isPontualOnly ? faturamento : Math.round(faturamento * 0.15);
      default: return 0;
    }
  };

  // Get aggregated meta for a period (start to end dates)
  const getMetaForPeriod = (
    bus: BuType[],
    startDate: Date,
    endDate: Date,
    metric: 'faturamento' | 'mrr' | 'setup' | 'pontual'
  ): number => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    let total = 0;

    bus.forEach(bu => {
      months.forEach(month => {
        const { value } = getConsolidatedMeta(bu, month as MonthType, metric);
        total += value;
      });
    });

    // Apply period fraction (pro-rata)
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const periodFraction = daysInPeriod / 365;

    return Math.round(total * periodFraction);
  };

  return {
    getConsolidatedMeta,
    getMetaForPeriod,
    getPlanGrowthMeta,
    hasOverrides: metas.some(m => m.faturamento > 0 || m.mrr > 0 || m.setup > 0 || m.pontual > 0),
  };
}
```

#### 2. Modificar `IndicatorsTab` - Usar Hook Consolidado

Substituir a função `getMetaMonetaryForIndicator` para usar o novo hook:

```typescript
// Em IndicatorsTab.tsx

import { useConsolidatedMetas } from '@/hooks/useConsolidatedMetas';

// ... dentro do componente ...
const { getMetaForPeriod } = useConsolidatedMetas();

const getMetaMonetaryForIndicator = (indicator: MonetaryIndicatorConfig): number => {
  if (indicator.key === 'sla') return 30; // Mantém fixo

  const metric = indicator.key as 'faturamento' | 'mrr' | 'setup' | 'pontual';
  return getMetaForPeriod(selectedBUs, startDate, endDate, metric);
};
```

#### 3. Modificar `MonetaryMetasTab` - Importar do Plan Growth

Adicionar botão para preencher automaticamente com valores do Plan Growth:

```typescript
// Função de importação
const handleImportFromPlanGrowth = () => {
  if (!funnelData) {
    toast({ 
      variant: 'destructive', 
      title: 'Visite Plan Growth primeiro' 
    });
    return;
  }

  const newMetas = { ...localMetas };
  const buToFunnel = { modelo_atual: 'modeloAtual', o2_tax: 'o2Tax', oxy_hacker: 'oxyHacker', franquia: 'franquia' };
  const tickets = { modelo_atual: 17000, o2_tax: 15000, oxy_hacker: 54000, franquia: 140000 };

  const buFunnelData = funnelData[buToFunnel[selectedBu]];
  if (!buFunnelData) return;

  const isPontualOnly = selectedBu === 'oxy_hacker' || selectedBu === 'franquia';

  buFunnelData.forEach(item => {
    const key = `${selectedBu}-${item.month}`;
    const faturamento = (item.vendas || 0) * tickets[selectedBu];

    newMetas[key] = {
      faturamento,
      mrr: isPontualOnly ? 0 : Math.round(faturamento * 0.25),
      setup: isPontualOnly ? 0 : Math.round(faturamento * 0.6),
      pontual: isPontualOnly ? faturamento : Math.round(faturamento * 0.15),
    };
  });

  setLocalMetas(newMetas);
  setHasChanges(true);
  toast({ title: 'Valores importados do Plan Growth!' });
};
```

```tsx
{/* Botão na UI */}
<Button 
  variant="outline" 
  size="sm"
  onClick={handleImportFromPlanGrowth}
>
  <Download className="h-4 w-4 mr-2" />
  Importar do Plan Growth
</Button>
```

---

### Fluxo de Uso

```text
1. Usuário visita "Plan Growth" → Define metas trimestrais
                                   (publicadas no contexto)

2. Usuário acessa "Admin > Metas Monetárias"
   ├── Pode IMPORTAR valores do Plan Growth (1 clique)
   ├── Pode EDITAR valores manualmente (override)
   └── Salva no banco de dados

3. Indicadores leem via useConsolidatedMetas
   ├── Tenta banco primeiro (override)
   └── Fallback para Plan Growth
```

---

### Impacto

| Área | Antes | Depois |
|------|-------|--------|
| **Metas Monetárias (Admin)** | Dados isolados no banco | Sincroniza com Plan Growth |
| **Indicadores** | Usa % hardcoded (25/60/15) | Usa banco ou Plan Growth |
| **Consistência** | Valores podem divergir | Fonte única de verdade |

---

### Resumo Técnico

1. **Novo hook `useConsolidatedMetas`**: Mescla `monetary_metas` (banco) com `funnelData` (contexto)
2. **Prioridade**: Banco > Plan Growth > Cálculo default
3. **BUs Pontual-Only**: Oxy Hacker e Franquia automaticamente têm MRR=0, Setup=0
4. **Botão de Importação**: Preenche admin com valores do Plan Growth
5. **IndicatorsTab**: Consome via hook consolidado
