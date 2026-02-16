
# Fix: Mostrar SDRs (nao Closers) no drill-down de Reuniao Agendada

## Problema

Ao clicar no acelerometro de "Reuniao Agendada" (RM), o drill-down mostra "Ranking por Closer" e a coluna da tabela diz "Closer". Porem, quem agenda reunioes sao os SDRs, nao os Closers.

Alem disso, no `useExpansaoAnalytics.ts`, o campo `responsavel` prioriza "Closer responsavel" sobre "SDR responsavel", e nao ha campo `sdr` separado no `ExpansaoCard` nem no `toDetailItem`.

## Alteracoes

### 1. `src/hooks/useExpansaoAnalytics.ts`

- Adicionar campo `sdr` e `closer` separados no `ExpansaoCard` interface
- No `parseRawCard`, popular ambos os campos independentemente
- No `toDetailItem`, mapear o campo `sdr` para o `DetailItem`

```
// Interface
sdr?: string;
closer?: string;

// parseRawCard  
sdr: row['SDR responsável'] || null,
closer: row['Closer responsável'] || null,

// toDetailItem
sdr: card.sdr || undefined,
closer: card.closer || undefined,
```

### 2. `src/components/planning/IndicatorsTab.tsx`

No bloco `case 'rm'` (linhas 1275-1338):

- Trocar `findTopPerformer(items, 'closer')` por `findTopPerformer(items, 'sdr')`
- Trocar chart title "Ranking por Closer" por "Ranking por SDR"
- Trocar a coluna `{ key: 'responsible', label: 'Closer' }` por `{ key: 'sdr', label: 'SDR' }`
- No ranking chart, usar campo `sdr` em vez de `responsible`/`closer`

## Resultado esperado

- Ao clicar no acelerometro de RM, o KPI "Top" mostra o SDR com mais reunioes agendadas
- O grafico de barras mostra "Ranking por SDR" com Amanda, Carol, Carlos
- A tabela mostra coluna "SDR" em vez de "Closer"
