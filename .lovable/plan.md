

## Simplificar RevenuePaceChart: Visao Geral de Faturamento com Pace

### O que muda

O grafico atual mostra cards individuais por BU (Modelo Atual, O2 TAX, Oxy Hacker, Franquia) e apenas o incremento. O usuario quer:

1. **Remover cards por BU** - sem breakdown por unidade de negocio
2. **Mostrar visao geral** com Faturamento Total (MRR Base + Incremento)
3. **Pace visual** comparando: Realizado (MRR Base + Incremento Realizado) vs Meta (MRR Base + Meta de Incremento)

### Layout novo

```text
Card "Faturamento"
  |
  +-- Header: "Faturamento" + Badge de status (Acima/Abaixo do pace)
  |
  +-- KPI simples:
  |     Realizado: R$ X (MRR Base + Incremento Realizado)
  |     Meta: R$ Y (MRR Base + Meta Incremento)  
  |     Pace Esperado: R$ Z
  |     Progress bar (realizado / meta)
  |
  +-- Grafico de barras por periodo:
  |     Barra "Realizado" = MRR Base pro-rata + incremento real do periodo
  |     Barra "Meta" = MRR Base pro-rata + meta incremento pro-rata do periodo
  |     Linha tracejada = Pace
  |
  +-- Legenda
```

### Dados

- **MRR Base**: Ja calculado em `faturamentoTotal` (que vem do `metasPorBU` - inclui MRR Base + Incremento para Modelo Atual). O MRR Base isolado sera: `faturamentoTotal - faturamentoMeta` (meta incremento)
- **Incremento Realizado**: `faturamentoRealized` (ja existe)
- **Incremento Meta**: `faturamentoMeta` (ja existe)
- **Faturamento Total Realizado**: MRR Base + Incremento Realizado
- **Faturamento Total Meta**: `faturamentoTotal` (MRR Base + Incremento Meta)

### Alteracoes por arquivo

| Arquivo | Alteracao |
|---------|-----------|
| `RevenuePaceChart.tsx` | Simplificar: remover cards por BU, remover props `selectedBUs`/`dataByBU`. Adicionar props `mrrBase` para calcular totais. Mostrar um unico card com Realizado Total vs Meta Total. No grafico de barras, as barras mostram MRR Base pro-rata + incremento por periodo. |
| `IndicatorsTab.tsx` | Calcular `mrrBase` (diferenca entre faturamentoTotal e faturamentoMeta). Passar para o componente. Remover calculo de `dataByBU` por BU. |

### Props simplificadas do RevenuePaceChart

```text
Props:
  - realized: number        (incremento realizado)
  - meta: number            (meta de incremento) 
  - mrrBase: number         (MRR base pro-rata do periodo)
  - paceExpected: number    (pace do faturamento total)
  - isLoading: boolean
  - chartData: { label, realized, meta }[]  (por periodo, ja incluindo MRR Base)
```

### Calculo no grafico

- **Faturamento Total Realizado** = mrrBase + realized (incremento)
- **Faturamento Total Meta** = mrrBase + meta (incremento) = faturamentoTotal
- **Pace** = faturamentoTotalMeta * paceFraction
- No grafico de barras, cada periodo mostra:
  - Barra Realizado = (mrrBase / periodos) + incremento real do periodo
  - Barra Meta = (mrrBase / periodos) + meta incremento do periodo

