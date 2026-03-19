

## Reverter Rollover: Usar Apenas Metas Originais

### O que muda

Hoje, `getMetasFromDb(bu, true)` busca as **metas efetivas** (original + gap acumulado) do `useEffectiveMetas`. Isso infla o faturamento "A Vender" e, consequentemente, todos os MQLs, vendas, propostas etc. do funil reverso.

### Valores: Com Rollover vs Sem Rollover (exemplo Modelo Atual, Março)

```text
                    COM rollover        SEM rollover
Meta Faturamento    ~1.565.356          1.334.610 (valor original do banco)
MRR Base            755.000             755.000
A Vender            ~810.356            579.610
Vendas (A Vender    ~48                 ~34
  / ticket 17k)
MQLs (funil reverso) ~414               ~295
```

Os valores exatos de cada mês dependem do que está na tabela `monetary_metas`, mas a lógica é: sem rollover, todas as metas voltam ao planejamento original.

### Alterações

**1. `src/hooks/usePlanGrowthData.ts`**
- Remover import de `useEffectiveMetas`
- Remover a chamada `useEffectiveMetas()` 
- Na função `getMetasFromDb`, remover o bloco que usa `effectiveMetas` — sempre ler direto da tabela `monetary_metas` via `metas`
- Remover `effectiveMetas` das dependências dos `useMemo`

**2. `src/components/planning/MonetaryMetasTab.tsx`**
- Remover import e uso de `useEffectiveMetas`
- Remover exibição de "Meta Efetiva" e "Gap" na UI (se houver)
- Manter apenas os valores originais do banco

**3. `src/hooks/useEffectiveMetas.ts`**
- Manter o hook (usado pela aba Financeiro para `realizedDRE`), mas ele deixa de ser consumido pelo Plan Growth e pela aba de Metas Monetárias

### Resultado
- Faturamento, MQLs, vendas, propostas, leads — tudo volta aos valores planejados originais do banco
- O funil reverso recalcula com base no "A Vender" original (meta - MRR Base), sem gap acumulado

