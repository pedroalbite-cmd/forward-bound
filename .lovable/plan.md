
# Plano: Corrigir Inconsistência de MQL entre Card Radial e Drill-Down

## Problema Identificado

O número de MQLs está diferente em dois lugares:
- **Card Radial (acelerômetro)**: 50 MQLs
- **Drill-Down (ao clicar)**: 72 MQLs (correto)

### Causa Raiz

Os dois hooks usam mapeamentos diferentes de fases para MQL:

| Hook | Fases mapeadas para 'mql' | Resultado |
|------|---------------------------|-----------|
| `useModeloAtualMetas.ts` | Apenas "MQLs" | 50 MQLs |
| `useModeloAtualAnalytics.ts` | "MQLs" + "Tentativas de contato" | 72 MQLs |

A fase "Tentativas de contato" representa leads qualificados que estão em processo de contato inicial. Pela regra de negócio, se um lead tem faturamento >= R$ 200k, ele é MQL independente de estar na fase "MQLs" ou "Tentativas de contato".

## Solução Proposta

Adicionar a fase "Tentativas de contato" ao mapeamento de MQL no hook `useModeloAtualMetas.ts` para garantir consistência com o drill-down.

### Arquivo a Modificar

**`src/hooks/useModeloAtualMetas.ts`**

```text
Antes (linhas 42-48):
const PHASE_TO_INDICATOR: Record<string, ModeloAtualIndicator> = {
  // Leads
  'Novos Leads': 'leads',
  
  // MQL - Leads qualificados
  'MQLs': 'mql',
  
  // RM...
```

```text
Depois (adicionar "Tentativas de contato"):
const PHASE_TO_INDICATOR: Record<string, ModeloAtualIndicator> = {
  // Leads
  'Novos Leads': 'leads',
  
  // MQL - Leads qualificados (inclui fase de tentativa de contato)
  'MQLs': 'mql',
  'Tentativas de contato': 'mql',
  
  // RM...
```

## Por Que Esta É a Solução Correta

1. **Consistência**: O mapeamento ficará idêntico nos dois hooks
2. **Regra de Negócio**: A fase "Tentativas de contato" é uma etapa intermediária onde SDRs tentam contato com leads qualificados. Se o lead tem faturamento >= R$ 200k, ele é MQL
3. **Drill-Down Já Funciona**: O `useModeloAtualAnalytics` já usa este mapeamento e mostra 72 MQLs (número correto)

## Resultado Esperado

- Card radial de MQL: **72** (antes: 50)
- Drill-down de MQL: **72** (sem mudança)
- Ambos usando a mesma lógica: fase "MQLs" ou "Tentativas de contato" + faturamento >= R$ 200k

## Notas Técnicas

- A lógica de filtro por faturamento (`isMqlQualified`) permanece inalterada
- Apenas cards com faturamento >= R$ 200k serão contados como MQL
- A fase "Tentativas de contato" é contada apenas para MQL, não afeta o indicador de Leads
