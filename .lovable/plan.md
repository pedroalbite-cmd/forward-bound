

## Mostrar contagem de MQLs excluídos no acelerômetro (sem remover do total)

### Mudança de comportamento
Hoje os MQLs com motivos de exclusão são **removidos** da contagem. A nova lógica:
- **Contar TODOS** os MQLs qualificados por faixa (≥ R$ 200k) no número principal
- **Exibir um badge/anotação** no card do MQL mostrando quantos desses têm motivo de exclusão (ex: "3 excluídos")

### Arquivos alterados

**1. `src/hooks/useModeloAtualAnalytics.ts`**
- Remover o filtro `excludedMqlIds` de `getCardsForIndicator('mql')` e de `firstEntryByCardAndIndicator` — MQLs excluídos voltam a ser contados
- Expor uma nova função `getExcludedMqlCount()` que retorna a quantidade de cards MQL cujo ID está no `excludedMqlIds`
- Retornar `getExcludedMqlCount` no objeto de retorno do hook

**2. `src/hooks/useModeloAtualMetas.ts`**
- Remover o filtro por `excludedMqlIds` em `getQtyForPeriod` e `countForWindow` para MQL — voltar a contar todos
- Manter `buildExcludedMqlCardIds` e `isMqlExcludedByLoss` disponíveis (usados pelo analytics para calcular a contagem)

**3. `src/hooks/useIndicatorsRealized.ts`**
- Remover o filtro de exclusão na contagem de MQL (se aplicável), mantendo consistência

**4. `src/components/planning/IndicatorsTab.tsx`**
- Adicionar prop `badge?: string` ao componente `RadialProgressCard`
- Renderizar o badge como um pequeno texto abaixo da meta (ex: `⚠ 3 excluídos`) com cor de alerta (amber/orange)
- Na renderização do card MQL, calcular o total de excluídos somando de todas as BUs selecionadas e passar como badge
- Exemplo visual: abaixo de "Meta: 120" aparece "⚠ 3 excluídos" em texto amber pequeno

### Detalhes técnicos

```text
┌──────────────────────┐
│        MQLs          │
│    ┌──────────┐      │
│    │   125    │      │  ← total (inclui excluídos)
│    │   104%   │      │
│    └──────────┘      │
│   Meta: 120          │
│   ⚠ 3 excluídos     │  ← badge novo
└──────────────────────┘
```

### O que NÃO muda
- Lista de motivos de exclusão (`MQL_EXCLUDED_LOSS_REASONS`) permanece igual
- Função `buildExcludedMqlCardIds` continua existindo para calcular o badge
- Lógica de normalização de acentos permanece

