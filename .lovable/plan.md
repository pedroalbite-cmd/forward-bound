

# Remover "Contrato em elaboracao" do mapeamento de venda

## Problema
A fase "Contrato em elaboracao" esta mapeada como `venda` no dashboard, mas venda so deve ser contada quando o contrato eh efetivamente assinado (fase "Contrato assinado").

Isso faz com que o card da Frutpolpas (que esta em "Contrato em elaboracao") seja contado como venda quando ainda nao assinou.

## Solucao
Remover a linha `'Contrato em elaboração': 'venda'` do mapeamento `PHASE_TO_INDICATOR` no hook `useModeloAtualAnalytics.ts`.

## Impacto
- Vendas de fevereiro: passara de **5 para 4** (Frutpolpas deixa de ser contada)
- A Frutpolpas so sera contada como venda quando mover para "Contrato assinado"
- Todos os outros indicadores permanecem iguais

## Arquivo modificado
- `src/hooks/useModeloAtualAnalytics.ts` - remover uma linha do mapeamento
