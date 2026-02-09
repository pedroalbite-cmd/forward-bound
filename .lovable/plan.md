

# Corrigir SLA nulo na BU O2 TAX

## Verificacao no banco

Confirmado que a fase **"Tentativas de Contato"** (com C maiusculo) existe na tabela `pipefy_cards_movements` do O2 TAX. Os campos `Data Criacao` e `Entrada` estao presentes e populados. Exemplo real do banco:
- Fase: `"Tentativas de Contato"`
- Data Criacao: `2026-02-08T15:08:23.000Z`
- Entrada: `2026-02-08T15:21:11.000Z`

No Modelo Atual, a fase equivalente e `"Tentativas de contato"` (c minusculo). A diferenca e apenas de capitalizacao.

## Mudancas

### 1. `src/hooks/useO2TaxAnalytics.ts`

Adicionar `getAverageSlaMinutes` como `useMemo`:
- Filtrar `cards` onde `fase.toLowerCase() === 'tentativas de contato'` e `dataCriacao` existente
- Calcular media: `sum(dataEntrada - dataCriacao) / count` em minutos
- Retornar 0 se nenhum card encontrado
- Exportar `getAverageSlaMinutes` e `cards` no return do hook

### 2. `src/components/planning/IndicatorsTab.tsx`

**No `case 'sla'` (linhas 1860-1866):**
- Adicionar: se `includesO2Tax`, somar `o2TaxAnalytics.getAverageSlaMinutes`
- Media ponderada quando ambas BUs selecionadas

**No drill-down de SLA (linhas 1968-2056):**
- Quando `includesO2Tax`, incluir cards O2 TAX da fase `"Tentativas de Contato"` (case-insensitive) com `dataCriacao`
- Concatenar com cards do Modelo Atual
- Recalcular KPIs sobre o conjunto combinado
- Produto: `'O2 TAX'` para cards O2 TAX

## Detalhes tecnicos

- Match case-insensitive via `.toLowerCase() === 'tentativas de contato'` para robustez
- O campo `empresa` nao existe no `O2TaxCard` (usa `titulo`), ajustar no drill-down
- O campo `responsavel` no O2 TAX vem de `SDR responsavel` (ja parseado)

## Arquivos a modificar

1. `src/hooks/useO2TaxAnalytics.ts` - adicionar `getAverageSlaMinutes`, exportar `cards`
2. `src/components/planning/IndicatorsTab.tsx` - expandir `case 'sla'` e drill-down para incluir O2 TAX

