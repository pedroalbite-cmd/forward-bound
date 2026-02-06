
# Plano: Corrigir Lógica de MQL Baseada em Faturamento

## Problema Identificado

A lógica atual conta MQLs apenas verificando se o card entrou na fase "MQLs" no Pipefy. Porém, a regra de negócio correta é:

**MQL = Lead com faturamento mensal >= R$ 200 mil**

Isso significa:
- Cards com faturamento "Entre R$ 100 mil e R$ 200 mil" **NÃO são MQLs**, mesmo que entrem na fase "MQLs"
- Cards podem ser MQLs baseado no faturamento mesmo sem passar explicitamente pela fase "MQLs"

### Faixas de Faturamento no Banco

```text
| Valor no Banco                           | É MQL? |
|------------------------------------------|--------|
| "Ainda não faturamos"                    | Não    |
| "Menos de R$ 100 mil"                    | Não    |
| "Entre R$ 100 mil e R$ 200 mil"          | Não    |
| "Entre R$ 200 mil e R$ 350 mil"          | Sim    |
| "Entre R$ 350 mil e R$ 500 mil"          | Sim    |
| "Entre R$ 500 mil e R$ 1 milhão"         | Sim    |
| "Entre R$ 1 milhão e R$ 5 milhões"       | Sim    |
| "Acima de R$ 5 milhões"                  | Sim    |
```

## Arquivos a Modificar

### 1. `src/hooks/useModeloAtualMetas.ts`

Adicionar lógica de validação de faturamento na contagem de MQLs:

```text
Mudanças:
- Adicionar campo "faixaFaturamento" no interface ModeloAtualMovement
- Criar constante MQL_QUALIFYING_TIERS com as faixas >= R$ 200k
- Criar função isMqlQualified(faixaFaturamento) que valida o tier
- Modificar lógica de contagem de MQLs para:
  1. Verificar se card entrou na fase MQLs
  2. Verificar se a faixa de faturamento é >= R$ 200k
  3. Só contar como MQL se AMBAS condições forem verdadeiras
```

### 2. `src/hooks/useModeloAtualAnalytics.ts`

Adicionar mesma validação para drill-down:

```text
Mudanças:
- Importar/criar mesma função isMqlQualified()
- Modificar getCardsForIndicator para aplicar filtro de faturamento
- Modificar getDetailItemsWithFullHistory para aplicar mesmo filtro
```

### 3. `src/components/planning/indicators/FunnelConversionByTierWidget.tsx`

Adicionar faixa faltante no mapeamento de tiers:

```text
Mudanças no TIER_NORMALIZATION:
+ 'Entre R$ 100 mil e R$ 200 mil': 'R$ 100k - 200k',

Mudanças no TIER_ORDER:
+ 'R$ 100k - 200k', (entre '< R$ 100k' e 'R$ 200k - 350k')

Mudanças no TIER_COLORS:
+ 'R$ 100k - 200k': 'hsl(30, 70%, 50%)', (cor laranja)
```

## Lógica de Implementação

```text
// Faixas que qualificam como MQL (faturamento >= R$ 200k)
const MQL_QUALIFYING_TIERS = [
  'Entre R$ 200 mil e R$ 350 mil',
  'Entre R$ 350 mil e R$ 500 mil',
  'Entre R$ 500 mil e R$ 1 milhão',
  'Entre R$ 1 milhão e R$ 5 milhões',
  'Acima de R$ 5 milhões',
];

// Verifica se o card qualifica como MQL baseado no faturamento
function isMqlQualified(faixaFaturamento?: string): boolean {
  if (!faixaFaturamento) return false;
  return MQL_QUALIFYING_TIERS.includes(faixaFaturamento);
}
```

## Impacto nas Contagens

Após a correção:
- Cards na fase "MQLs" com faturamento < R$ 200k serão EXCLUÍDOS da contagem de MQL
- A contagem de Leads permanece inalterada (todos os leads independente de faturamento)
- A conversão Lead → MQL passará a refletir a qualificação real por faturamento

## Resultado Esperado

Antes (com erro):
- MQL = 26 (contando todos que entraram na fase "MQLs")

Depois (corrigido):
- MQL = Apenas os que têm faturamento >= R$ 200k
- Cards como o "😤😤😤😤" com faturamento "Entre R$ 100 mil e R$ 200 mil" serão excluídos

## Notas Técnicas

1. A validação usa o campo `Faixa de faturamento mensal` do banco de dados
2. Cards sem faixa de faturamento preenchida NÃO serão contados como MQL
3. A lógica é aplicada em ambos os hooks para garantir paridade entre:
   - Números nos cards/gráficos (useModeloAtualMetas)
   - Listas de drill-down (useModeloAtualAnalytics)
