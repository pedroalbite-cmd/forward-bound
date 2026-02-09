

# Corrigir acelerometro de Setup - remover "Contrato em elaboracao" do mapeamento monetario

## Problema
Removemos "Contrato em elaboracao" do mapeamento de venda no hook `useModeloAtualAnalytics.ts` (que controla contagens e drill-downs), mas o hook `useModeloAtualMetas.ts` (que calcula os valores monetarios dos acelerometros) ainda mapeia essa fase como "venda" na linha 69.

Resultado: o acelerometro de Setup mostra R$ 106k em vez dos R$ 76k corretos, porque inclui valores de cards que ainda nao assinaram contrato (como a Frutpolpas).

## Solucao
Remover a linha `'Contrato em elaboração': 'venda'` do `PHASE_TO_INDICATOR` em `src/hooks/useModeloAtualMetas.ts` (linha 69), alinhando com a mesma correcao ja feita no `useModeloAtualAnalytics.ts`.

## Arquivo a modificar
- `src/hooks/useModeloAtualMetas.ts` - remover linha 69

## Impacto
- Setup passara de R$ 106k para R$ 76k (valor correto)
- MRR e Pontual tambem serao corrigidos caso incluam valores de cards em elaboracao
- O acelerometro de Faturamento/Incremento tambem sera ajustado
- Consistencia total entre contagens e valores monetarios
