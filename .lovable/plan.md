

## Plano: Adicionar 5 Novos Acelerômetros na Aba Indicadores

### Objetivo

Adicionar 5 novos acelerômetros (radial gauges) na aba "Indicadores" para monitorar métricas financeiras:
1. **ROI** - Retorno sobre Investimento 
2. **Faturamento** - Total de faturamento realizado
3. **MRR** - Receita Recorrente Mensal
4. **SETUP** - Valor de Setup (implantação)
5. **PONTUAL** - Valor Pontual (receitas não recorrentes)

---

### Arquitetura dos Dados

Os dados para estes novos indicadores virão de diferentes fontes:

| Indicador | Fonte de Dados Realizado | Fonte de Meta |
|-----------|-------------------------|---------------|
| ROI | Calculado: Faturamento / Investimento | Fixa (ex: 10x) ou sem meta |
| Faturamento | `useModeloAtualMetas.getValueForPeriod('venda')` + outras BUs | `funnelData.faturamentoMeta` do MediaMetasContext |
| MRR | Cards na fase 'Ganho': soma de `valorMRR` | Meta baseada em % do faturamento |
| SETUP | Cards na fase 'Ganho': soma de `valorSetup` | Meta baseada em % do faturamento |
| PONTUAL | Cards na fase 'Ganho': soma de `valorPontual` | Meta baseada em % do faturamento |

---

### Modificações no Hook `useModeloAtualMetas.ts`

**1. Adicionar novas funções para extrair valores por tipo:**

```typescript
// Já existe a função getValueForPeriod que retorna o valor total (MRR + Pontual + Educação + Setup)
// Adicionar funções específicas para cada tipo de valor

const getMrrForPeriod = (start?: Date, end?: Date): number => {
  // Filtrar cards na fase 'Ganho' e somar apenas valorMRR
};

const getSetupForPeriod = (start?: Date, end?: Date): number => {
  // Filtrar cards na fase 'Ganho' e somar apenas valorSetup
};

const getPontualForPeriod = (start?: Date, end?: Date): number => {
  // Filtrar cards na fase 'Ganho' e somar apenas valorPontual
};
```

---

### Modificações no `IndicatorsTab.tsx`

**1. Adicionar nova interface para indicadores monetários:**

```typescript
interface MonetaryIndicatorConfig {
  key: 'roi' | 'faturamento' | 'mrr' | 'setup' | 'pontual';
  label: string;
  shortLabel: string;
  format: 'currency' | 'multiplier'; // 'currency' para R$, 'multiplier' para ROI (ex: "10x")
}

const monetaryIndicatorConfigs: MonetaryIndicatorConfig[] = [
  { key: 'roi', label: 'ROI', shortLabel: 'ROI', format: 'multiplier' },
  { key: 'faturamento', label: 'Faturamento', shortLabel: 'Fat.', format: 'currency' },
  { key: 'mrr', label: 'MRR', shortLabel: 'MRR', format: 'currency' },
  { key: 'setup', label: 'Setup', shortLabel: 'Setup', format: 'currency' },
  { key: 'pontual', label: 'Pontual', shortLabel: 'Pont.', format: 'currency' },
];
```

**2. Criar novo componente `MonetaryRadialCard`:**

Similar ao `RadialProgressCard`, mas com formatação apropriada para valores monetários (R$ compacto) e ROI (ex: "4.2x").

**3. Adicionar segunda linha de acelerômetros na UI:**

```tsx
{/* Cards de Indicadores de Quantidade (existentes) */}
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
  {indicatorConfigs.map(...)}
</div>

{/* NOVO: Cards de Indicadores Monetários */}
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
  {monetaryIndicatorConfigs.map((indicator) => (
    <MonetaryRadialCard 
      key={indicator.key}
      title={indicator.label}
      realized={getRealizedMonetaryForIndicator(indicator)}
      meta={getMetaMonetaryForIndicator(indicator)}
      format={indicator.format}
      isClickable={indicator.key !== 'roi'} // ROI não tem drill-down
      onClick={() => handleMonetaryCardClick(indicator)}
    />
  ))}
</div>
```

**4. Implementar funções de cálculo:**

```typescript
const getRealizedMonetaryForIndicator = (indicator: MonetaryIndicatorConfig): number => {
  switch(indicator.key) {
    case 'roi':
      const faturamento = getRealizedMonetaryForIndicator({ key: 'faturamento', ... });
      const investimento = getInvestimentoPeriodo(); // Do funnelData
      return investimento > 0 ? faturamento / investimento : 0;
    
    case 'faturamento':
      // Soma de todas as BUs selecionadas
      let total = 0;
      if (includesModeloAtual) total += getModeloAtualValueForPeriod('venda', startDate, endDate);
      if (includesO2Tax) total += getO2TaxValueForPeriod('venda', startDate, endDate);
      // ... outras BUs
      return total;
    
    case 'mrr':
      return getMrrForPeriod(startDate, endDate);
    
    case 'setup':
      return getSetupForPeriod(startDate, endDate);
    
    case 'pontual':
      return getPontualForPeriod(startDate, endDate);
  }
};

const getMetaMonetaryForIndicator = (indicator: MonetaryIndicatorConfig): number => {
  switch(indicator.key) {
    case 'roi':
      return 10; // Meta de 10x ROI (ou calcular dinamicamente)
    
    case 'faturamento':
      // Soma das metas de faturamento das BUs selecionadas
      return calcularMetaFaturamento();
    
    case 'mrr':
    case 'setup':
    case 'pontual':
      // Distribuir proporcionalmente com base em histórico
      // Ex: MRR = ~60% do faturamento, Setup = ~25%, Pontual = ~15%
      return getMetaFaturamento() * getProporção(indicator.key);
  }
};
```

---

### Extensão dos Hooks de Metas

**Arquivo: `src/hooks/useModeloAtualMetas.ts`**

Adicionar funções para extrair valores individuais (MRR, Setup, Pontual) da mesma forma que `getValueForPeriod`, mas filtrando apenas o campo específico.

**Arquivos similares:**
- `src/hooks/useO2TaxMetas.ts`
- `src/hooks/useExpansaoMetas.ts` 
- `src/hooks/useOxyHackerMetas.ts`

Cada um precisará de funções equivalentes se possuírem campos de valor separados.

---

### Layout Visual Proposto

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Visão Meta Pace                    [BU ▼] [Closers ▼] [De:] [Até:] ⟳  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  MQLs    │ │ Reuniões │ │ Reuniões │ │Propostas │ │  Vendas  │      │
│  │   ⭕    │ │Agendadas │ │Realizadas│ │ Enviadas │ │   ⭕    │      │
│  │   42    │ │   ⭕    │ │   ⭕    │ │   ⭕    │ │   12    │      │
│  │ Meta:52 │ │  Meta:30 │ │  Meta:24 │ │  Meta:12 │ │ Meta:6  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   ROI   │ │Faturamen.│ │   MRR   │ │  Setup  │ │ Pontual │      │
│  │   ⭕    │ │   ⭕    │ │   ⭕    │ │   ⭕    │ │   ⭕    │      │
│  │  4.2x   │ │ R$ 850k │ │ R$ 510k │ │ R$ 213k │ │ R$ 127k │      │
│  │Meta:10x │ │Meta:1.2M │ │Meta:700k│ │Meta:300k│ │Meta:200k│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Resumo de Modificações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/hooks/useModeloAtualMetas.ts` | Modificar | Adicionar funções `getMrrForPeriod`, `getSetupForPeriod`, `getPontualForPeriod` |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Adicionar `monetaryIndicatorConfigs`, componente `MonetaryRadialCard`, funções de cálculo e segunda linha de cards |
| `src/contexts/MediaMetasContext.tsx` | Modificar (opcional) | Adicionar campos para investimento se necessário para ROI |

---

### Detalhes Técnicos

#### Formatação de Valores

- **ROI**: Exibir como "4.2x" (multiplicador)
- **Faturamento**: Exibir como "R$ 1.2M" (formato compacto)
- **MRR/Setup/Pontual**: Exibir como "R$ 510k" (formato compacto)

A função `formatCompact` já existe em `salesData.ts` e pode ser reutilizada.

#### Drill-down

- **ROI**: Não terá drill-down (é um cálculo agregado)
- **Faturamento**: Drill-down mostrará todos os cards de venda
- **MRR/Setup/Pontual**: Drill-down mostrará os mesmos cards de venda, mas com colunas específicas para o tipo de valor

#### Filtros

Os novos acelerômetros respeitarão os mesmos filtros da aba:
- Seleção de BUs
- Seleção de Closers (para Modelo Atual)
- Período de datas

