

## Plano: Adicionar SLA (Tempo para Tentativas de Contato) nos Indicadores

### O que é SLA?

O SLA (Service Level Agreement) neste contexto mede o **tempo médio entre a criação do lead e a primeira tentativa de contato**. É um KR crítico que indica a velocidade de resposta da equipe comercial.

**Cálculo:**
```
SLA = Data de Entrada na fase "Tentativas de contato" - Data de Criação do Card
```

**Exemplo Real do Banco:**
| Campo | Valor |
|-------|-------|
| Data Criação | 2026-01-29 11:31:04 |
| Entrada (Tentativas) | 2026-01-29 11:53:15 |
| **SLA** | **22 min** |

---

### Alterações Planejadas

#### 1. Substituir ROI por SLA nos indicadores monetários

| Antes | Depois |
|-------|--------|
| ROI, Faturamento, MRR, Setup, Pontual | **SLA**, Faturamento, MRR, Setup, Pontual |

O ROI permanecerá disponível apenas na aba de Marketing Indicators.

---

### Seção Técnica

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useModeloAtualAnalytics.ts` | Adicionar campo `dataCriacao` na interface e método `getAverageSlaMinutes` |
| `src/components/planning/IndicatorsTab.tsx` | Substituir ROI por SLA, adicionar formato de duração, implementar lógica de cálculo |

---

#### 1. Modificações no hook `src/hooks/useModeloAtualAnalytics.ts`

**A) Adicionar campo `dataCriacao` na interface `ModeloAtualCard`**

```typescript
export interface ModeloAtualCard {
  // ... campos existentes
  dataCriacao: Date | null; // Nova: "Data Criação" do card
}
```

**B) Atualizar o mapeamento de fases para incluir "Tentativas de contato"**

```typescript
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  // ... fases existentes
  'Tentativas de contato': 'mql', // Fase usada para cálculo do SLA
};
```

**C) Fazer parse do campo ao processar os dados**

```typescript
cards.push({
  // ... campos existentes
  dataCriacao: parseDate(row['Data Criação']),
});
```

**D) Adicionar método para calcular SLA médio**

```typescript
// Calcular SLA médio em minutos para cards que entraram em "Tentativas de contato"
const getAverageSlaMinutes = useMemo(() => {
  const tentativasCards = cardsInPeriod.filter(card => 
    card.fase === 'Tentativas de contato' && card.dataCriacao
  );
  
  if (tentativasCards.length === 0) return 0;
  
  const totalMinutes = tentativasCards.reduce((sum, card) => {
    const diffMs = card.dataEntrada.getTime() - card.dataCriacao!.getTime();
    return sum + (diffMs / 1000 / 60); // Converter para minutos
  }, 0);
  
  return totalMinutes / tentativasCards.length;
}, [cardsInPeriod]);
```

**E) Exportar o método no retorno do hook**

```typescript
return {
  // ... retorno existente
  getAverageSlaMinutes,
};
```

---

#### 2. Modificações no arquivo `src/components/planning/IndicatorsTab.tsx`

**A) Atualizar tipo e configuração de indicadores monetários**

```typescript
// Antes
type MonetaryIndicatorKey = 'roi' | 'faturamento' | 'mrr' | 'setup' | 'pontual';

const monetaryIndicatorConfigs: MonetaryIndicatorConfig[] = [
  { key: 'roi', label: 'ROI', shortLabel: 'ROI', format: 'multiplier' },
  // ...
];

// Depois
type MonetaryIndicatorKey = 'sla' | 'faturamento' | 'mrr' | 'setup' | 'pontual';

interface MonetaryIndicatorConfig {
  key: MonetaryIndicatorKey;
  label: string;
  shortLabel: string;
  format: 'currency' | 'multiplier' | 'duration'; // Adicionar 'duration'
}

const monetaryIndicatorConfigs: MonetaryIndicatorConfig[] = [
  { key: 'sla', label: 'SLA', shortLabel: 'SLA', format: 'duration' },
  { key: 'faturamento', label: 'Faturamento', shortLabel: 'Fat.', format: 'currency' },
  { key: 'mrr', label: 'MRR', shortLabel: 'MRR', format: 'currency' },
  { key: 'setup', label: 'Setup', shortLabel: 'Setup', format: 'currency' },
  { key: 'pontual', label: 'Pontual', shortLabel: 'Pont.', format: 'currency' },
];
```

**B) Adicionar função para formatar duração**

```typescript
// Format duration in hours/minutes
const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(minutes)}m`;
};
```

**C) Atualizar o MonetaryRadialCard para suportar formato de duração**

```typescript
interface MonetaryRadialCardProps {
  format: 'currency' | 'multiplier' | 'duration'; // Adicionar 'duration'
}

const MonetaryRadialCard = ({ title, realized, meta, format, onClick, isClickable = false }: MonetaryRadialCardProps) => {
  // Para SLA, quanto MENOR melhor (inverter a lógica de cores)
  const isInverted = format === 'duration';
  const percentage = meta > 0 ? (realized / meta) * 100 : 0;
  const isAboveMeta = isInverted ? percentage <= 100 : percentage >= 100;
  
  const formatValue = format === 'currency' 
    ? formatCompactCurrency 
    : format === 'duration' 
      ? formatDuration 
      : formatMultiplier;
  
  // ... resto do componente
};
```

**D) Implementar cálculo do SLA realizado**

```typescript
case 'sla': {
  // Para Modelo Atual: usar o método do hook de analytics
  if (includesModeloAtual) {
    return modeloAtualAnalytics.getAverageSlaMinutes;
  }
  // Para outras BUs: implementar lógica similar ou retornar 0
  return 0;
}
```

**E) Definir meta do SLA**

```typescript
case 'sla':
  return 30; // Meta de 30 minutos para primeira tentativa de contato
```

---

### Resultado Visual

O indicador SLA será exibido assim:

| Título | Realizado | Meta | Cor |
|--------|-----------|------|-----|
| SLA | 22m | 30m | Verde (73% ✓) |
| SLA | 45m | 30m | Vermelho (150% ✗) |

**Lógica de cores invertida**: Para o SLA, valores MENORES que a meta são verdes (bom), valores MAIORES são vermelhos (ruim).

---

### Observações

1. **Fase-alvo**: A fase "Tentativas de contato" existe no banco e é a primeira ação ativa do SDR após a criação do lead
2. **Meta sugerida**: 30 minutos (padrão B2B) - pode ser ajustado posteriormente
3. **ROI**: Permanece disponível na aba Marketing Indicators
4. **Escopo**: Inicialmente implementado apenas para Modelo Atual (BU que tem a fase "Tentativas de contato" no Pipefy)

