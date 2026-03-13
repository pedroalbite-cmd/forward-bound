

## Rollover Automático de Metas com Gap Acumulado

### Conceito

Quando uma BU não bate a meta de um mês, o déficit é automaticamente somado à meta do mês seguinte. Isso se acumula: se Fev também não bate, o gap de Jan + gap de Fev vai para Mar.

Exemplo (O2 TAX):
- Jan: meta 80k, realizado 60k → gap 20k
- Fev: meta original 80k → meta efetiva 100k (80k + 20k de Jan). Realizado 50k → gap 50k
- Mar: meta original 100k → meta efetiva 150k (100k + 50k acumulado)

### Onde isso se aplica

A "meta efetiva" (com rollover) deve ser usada nos **Indicadores** (acelerômetros, gauges, funnel) como a meta real do mês. A meta original (do banco) continua sendo a meta de planejamento editável no Admin.

### Arquitetura

```text
monetary_metas (DB)          useIndicatorsRealized
     │ (meta original)              │ (realizado por BU)
     └──────────┬───────────────────┘
                ▼
      useEffectiveMetas (NOVO HOOK)
                │
                ├─ effectiveMetas: Record<BU, Record<Month, number>>
                ├─ rolloverLog: { month, bu, originalMeta, gap, accumulated }[]
                └─ isMonthClosed(month): boolean
                │
                ▼
         usePlanGrowthData (usa effectiveMetas em vez de raw metas)
                │
                ▼
         MediaMetasContext → Indicadores
```

### Alterações

| Arquivo | Mudança |
|---|---|
| `src/hooks/useEffectiveMetas.ts` | **NOVO** — Hook que cruza `monetary_metas` com `realizedByBU` e calcula metas efetivas com rollover. Expõe `effectiveMetas`, `rolloverLog` e `originalMetas`. |
| `src/hooks/usePlanGrowthData.ts` | Usar `useEffectiveMetas` para obter as metas mensais em vez de ler direto do `monetary_metas`. As metas efetivas alimentam o funil reverso. |
| `src/components/planning/MonetaryMetasTab.tsx` | Adicionar linhas visuais: "Meta Efetiva" (meta com rollover), "Gap Acumulado" por mês. Destacar meses com rollover. A edição continua alterando a meta original. |
| `src/components/planning/DistributionBar.tsx` ou inline | Ao redistribuir, respeitar que a meta global não muda — redistribui a meta original, o rollover é recalculado automaticamente. |

### Hook `useEffectiveMetas` — Lógica

```typescript
function useEffectiveMetas(year = 2026) {
  const { metas } = useMonetaryMetas(year);
  const { realizedByBU } = useIndicatorsRealized(year);

  // Para cada BU:
  //   gapAcumulado = 0
  //   para cada mês em ordem:
  //     metaOriginal = metas[bu][month]
  //     metaEfetiva = metaOriginal + gapAcumulado
  //     realizado = realizedByBU[bu][month] (valor de venda)
  //     se mês fechado (realizado > 0 ou mês passado):
  //       gap = max(0, metaEfetiva - realizado)  // só rollover se não bateu
  //       gapAcumulado = gap
  //     else:
  //       gapAcumulado permanece (meta efetiva = original + acumulado anterior)
}
```

Regra de "mês fechado": um mês é considerado fechado quando tem dados de realizado (realizedByBU[bu][month] > 0) **e** o mês já passou (data atual > último dia do mês). Isso evita que meses parciais gerem rollover prematuro.

### Visualização no Admin (MonetaryMetasTab)

Novas linhas na tabela:

| Métrica | Jan | Fev | Mar | ... |
|---|---|---|---|---|
| 🎯 Meta (Fat.) | 80k | 80k | 100k | (editável) |
| ⚡ Meta Efetiva | 80k | **100k** | **150k** | (calculada) |
| ✅ Realizado | 60k | 50k | — | |
| 📊 Gap Acumulado | **-20k** | **-50k** | — | |

- "Meta Efetiva" em negrito/amarelo quando difere da original
- "Gap Acumulado" em vermelho quando negativo

### Rollover Log

Array de ajustes para auditoria:
```typescript
[
  { bu: 'o2_tax', month: 'Fev', originalMeta: 80000, rolledOver: 20000, effectiveMeta: 100000, source: 'Jan gap' },
  { bu: 'o2_tax', month: 'Mar', originalMeta: 100000, rolledOver: 50000, effectiveMeta: 150000, source: 'Fev gap' },
]
```

Exibido como tooltip ou seção colapsável abaixo da tabela.

### Edição manual continua funcionando

- O usuário edita a **meta original** (que vai para o banco)
- A redistribuição (DistributionBar) opera sobre metas originais
- A meta global consolidada valida contra o `TARGET_TOTAL` usando metas originais
- O rollover é **sempre recalculado** automaticamente a partir do cruzamento meta original × realizado

### Impacto nos Indicadores

Como `usePlanGrowthData` passará a usar as metas efetivas, os acelerômetros e gauges automaticamente refletirão as metas ajustadas com rollover. Se Mar tem meta efetiva de 150k (original 100k + 50k de gap), o acelerômetro mostrará progresso contra 150k.

