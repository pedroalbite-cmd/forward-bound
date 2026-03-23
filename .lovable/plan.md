

## Remover KPI "Diagnóstico Perdido" e confirmar MRR

### Confirmação sobre MRR
O cálculo de MRR Perdido usa exclusivamente o campo `Valor CFOaaS` do Pipefy (`d.mrr = parseNumber(card['Valor CFOaaS'])`). **Não está misturado** com diagnóstico. O valor de R$ 96k reflete apenas MRR.

### Alteração em `src/components/planning/nps/ChurnDossierSection.tsx`

1. **Remover o KPI card "Diagnóstico Perdido"** (linhas 149-156)
2. **Remover a variável `totalDiagnostico`** (linha 73) — não é mais usada
3. **Ajustar o grid** de `grid-cols-5` para `grid-cols-4` nos KPI cards (linha 129)

A coluna "Diagnóstico (R$)" na tabela permanece — apenas o card de KPI do topo é removido.

