
# Adicionar TCV por Campanha na Tabela de Campanhas

## O que e TCV

TCV (Total Contract Value) = (MRR x 12) + Setup + Pontual. Representa o valor projetado de 12 meses do contrato.

## Mudancas

### 1. Atualizar o tipo `CampaignFunnel` (types.ts)
Adicionar campo `tcv: number` ao tipo.

### 2. Calcular TCV no hook `useMarketingAttribution.ts`
Ao processar cards na fase "vendas", calcular o TCV como `(valorMRR * 12) + valorSetup + valorPontual` e acumular no campo `tcv` do funnel.

### 3. Exibir coluna TCV na tabela (`CampaignsTable.tsx`)
- Adicionar coluna "TCV" no header entre "Receita" e "ROI"
- Exibir o valor de TCV por campanha na `CampaignRow`
- Adicionar total de TCV no footer da tabela
- Ajustar `colSpan` das linhas de loading/erro de 13 para 14

## Resultado

Cada campanha com vendas atribuidas mostrara o TCV total dos contratos, e o footer da tabela mostrara o TCV consolidado de todas as campanhas.
