

## Grafico de Incremento de Faturamento com Pace de Meta

### Objetivo
Criar um unico grafico (card com barra de progresso visual) posicionado entre os filtros e os acelerometros, mostrando:
- **Meta de Incremento** (faturamento esperado no periodo)
- **Realizado** (faturamento efetivo das vendas)
- **Pace** (se esta no ritmo para bater a meta, considerando dias decorridos vs dias totais do periodo)

O grafico deve respeitar todos os filtros existentes (BU, Closer, SDR, periodo).

### Dados utilizados

- **Meta**: `getMetaMonetaryForIndicator({ key: 'faturamento' })` -- ja calcula pro-rata por periodo e BU
- **Realizado**: `getRealizedMonetaryForIndicator({ key: 'faturamento' })` -- ja unificado com analytics
- **Pace esperado**: `meta * (diasDecorridos / diasTotaisPeriodo)` -- quanto deveria ter sido feito ate hoje proporcionalmente

### Design do componente

Um `Card` unico com:
1. **Header**: "Incremento de Faturamento" com os valores numericos (Realizado / Meta)
2. **Barra horizontal**: mostrando realizado vs meta, com marcador de pace
3. **Indicador de status**: 
   - Verde: realizado >= pace esperado
   - Amarelo: realizado >= 80% do pace
   - Vermelho: realizado < 80% do pace
4. **Texto auxiliar**: "Pace: R$ XXk de R$ YYk esperados ate hoje (ZZ%)"

### Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `IndicatorsTab.tsx` | Criar componente `RevenuePaceChart` inline (ou separado) e renderizar entre filtros e acelerometros |

### Detalhes tecnicos

#### Componente `RevenuePaceChart`

```text
Props:
  - realized: number (faturamento realizado)
  - meta: number (meta de faturamento do periodo)
  - paceExpected: number (meta pro-rata ate hoje)
  - isLoading: boolean

Layout:
  Card com:
    - Titulo "Incremento de Faturamento"
    - 3 mini KPIs lado a lado: Realizado | Meta Periodo | Pace Esperado
    - Barra de progresso horizontal (100% = meta total)
      - Preenchida ate o % realizado (cor baseada em pace)
      - Marcador vertical no ponto do pace esperado
    - Texto de status: "Acima do pace" / "No ritmo" / "Abaixo do pace"
```

#### Calculo do Pace

No `IndicatorsTab.tsx`, antes do return:

```text
const today = new Date();
const daysElapsed = Math.min(
  differenceInDays(today, startDate) + 1, 
  daysInPeriod
);
const paceFraction = daysInPeriod > 0 ? daysElapsed / daysInPeriod : 0;

const faturamentoMeta = getMetaMonetaryForIndicator({ key: 'faturamento', ... });
const faturamentoRealized = getRealizedMonetaryForIndicator({ key: 'faturamento', ... });
const paceExpected = faturamentoMeta * paceFraction;
```

#### Posicao na renderizacao

```text
{/* Filters */}
...

{/* NOVO: Grafico de Incremento com Pace */}
<RevenuePaceChart ... />

{/* Cards - Quantity Indicators (acelerometros) */}
...
```

O componente usa `recharts` (BarChart com uma barra horizontal) ou simplesmente um `Progress` customizado com marcador de pace, mantendo consistencia visual com o restante do dashboard.

