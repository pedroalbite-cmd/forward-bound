

## Plano: Usar MRR Base como "Realizado" nas Metas Monetárias

### O que muda

Trocar a fonte de dados da linha "✅ Realizado" de `useIndicatorsRealized` (incremento Pipefy) para `useMrrBase` (faturamento total real do mês).

### Alteração

**Arquivo**: `src/components/planning/MonetaryMetasTab.tsx`

1. Importar `useMrrBase` no lugar de (ou além de) `useIndicatorsRealized`
2. Chamar `const { getMrrBaseForMonth, isLoading: mrrLoading } = useMrrBase()`
3. Na linha "✅ Realizado": usar `getMrrBaseForMonth(month, 2026)` em vez de `realizedFunnelByBU[selectedBu][month].valor`
4. Na linha "📊 Gap": comparar `getMrrBaseForMonth(month, 2026)` contra `getFaturamento(selectedBu, month)`
5. Considerar que o MRR base é global (não por BU) — mostrar apenas quando a BU selecionada for `modelo_atual`, ou mostrar para todas com nota

### Detalhe importante

O `mrr_base_monthly` não tem coluna de BU — é o faturamento total da empresa. Os valores atuais:
- Jan: R$ 967.968,89
- Fev: R$ 809.975,81
- Mar: R$ 939.408,18

Isso significa que o "Realizado" e o "Gap" farão sentido como visão consolidada (todas as BUs somadas), não por BU individual. Quando uma BU específica estiver selecionada, a linha pode mostrar "—" ou o valor proporcional.

### Alternativa simples

Mostrar as linhas de Realizado/Gap apenas na visão "Total" (todas as BUs), usando o MRR base como valor total realizado da empresa.

