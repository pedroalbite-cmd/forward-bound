

## Plano: Adicionar SLA (Tempo para Tentativas de Contato) nos Indicadores

### O que é SLA?

O SLA (Service Level Agreement) neste contexto mede o **tempo médio entre a criação do lead e a primeira tentativa de contato**. É um KR crítico que indica a velocidade de resposta da equipe comercial.

**Cálculo:**
```
SLA = Data de Entrada na fase "Tentativas de contato" - Data de Criação do Card
```

---

### Alterações Planejadas

#### 1. Substituir ROI por SLA nos indicadores monetários

| Antes | Depois |
|-------|--------|
| ROI, Faturamento, MRR, Setup, Pontual | **SLA**, Faturamento, MRR, Setup, Pontual |

O ROI permanecerá disponível apenas na aba de Marketing Indicators.

---

#### 2. Modificações no arquivo `src/components/planning/IndicatorsTab.tsx`

**A) Atualizar configuração de indicadores monetários (linhas 52-67)**

```typescript
// Antes
type MonetaryIndicatorKey = 'roi' | 'faturamento' | 'mrr' | 'setup' | 'pontual';

const monetaryIndicatorConfigs: MonetaryIndicatorConfig[] = [
  { key: 'roi', label: 'ROI', shortLabel: 'ROI', format: 'multiplier' },
  // ...
];

// Depois
type MonetaryIndicatorKey = 'sla' | 'faturamento' | 'mrr' | 'setup' | 'pontual';

const monetaryIndicatorConfigs: MonetaryIndicatorConfig[] = [
  { key: 'sla', label: 'SLA', shortLabel: 'SLA', format: 'duration' }, // Novo formato
  // ...
];
```

**B) Adicionar formato de duração para o SLA**

Criar nova função para formatar duração em horas/minutos:
```typescript
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

Adicionar suporte ao novo formato `'duration'`:
```typescript
interface MonetaryRadialCardProps {
  format: 'currency' | 'multiplier' | 'duration'; // Adicionar 'duration'
}

const formatValue = format === 'currency' 
  ? formatCompactCurrency 
  : format === 'duration' 
    ? formatDuration 
    : formatMultiplier;
```

**D) Implementar cálculo do SLA realizado**

Adicionar lógica no `getRealizedMonetaryForIndicator`:
```typescript
case 'sla': {
  // Buscar todos os movimentos para "Tentativas de contato" no período
  const cards = modeloAtualAnalytics.cards.filter(card => 
    card.fase === 'Tentativas de contato'
  );
  
  if (cards.length === 0) return 0;
  
  // Calcular média do SLA (em minutos)
  // Precisa acessar "Data Criação" que não está mapeado ainda
  // ...ver modificação no hook abaixo
  return averageSlaMinutes;
}
```

---

#### 3. Modificações no hook `src/hooks/useModeloAtualAnalytics.ts`

**A) Adicionar campo `dataCriacao` na interface `ModeloAtualCard`**

```typescript
export interface ModeloAtualCard {
  // ... campos existentes
  dataCriacao: Date | null; // Nova: "Data Criação" do card
}
```

**B) Fazer parse do campo ao processar os dados**

```typescript
cards.push({
  // ... campos existentes
  dataCriacao: parseDate(row['Data Criação']),
});
```

**C) Adicionar método para calcular SLA médio**

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

---

#### 4. Meta do SLA

O SLA ideal (meta) precisa ser definido. Sugestões:
- **15 minutos** (resposta ultra-rápida)
- **30 minutos** (padrão de mercado B2B)
- **60 minutos** (1 hora - margem maior)

O indicador será **invertido** - quanto MENOR o valor, melhor (similar ao CAC).

---

### Seção Técnica

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useModeloAtualAnalytics.ts` | Adicionar campo `dataCriacao` e método `getAverageSlaMinutes` |
| `src/components/planning/IndicatorsTab.tsx` | Substituir ROI por SLA, adicionar formato de duração |

#### Estrutura de Dados do Banco

A tabela `pipefy_moviment_cfos` contém:
- `"Data Criação"` (timestamp) - momento de criação do card no Pipefy
- `"Entrada"` (timestamp) - momento de entrada na fase atual
- `"Fase"` = `"Tentativas de contato"` - fase alvo para cálculo do SLA

#### Exemplo Real

| Campo | Valor |
|-------|-------|
| Data Criação | 2026-01-29 11:31:04 |
| Entrada (Tentativas) | 2026-01-29 11:35:28 |
| **SLA** | **4 min 24s** |

---

### Pergunta Pendente

Qual deve ser a **meta ideal do SLA** (tempo máximo para primeira tentativa de contato)?
- 15 minutos (agressivo)
- 30 minutos (padrão)
- 60 minutos (conservador)
- Outro valor?

