

# Inverter logica: Meta (Faturamento) como campo editavel

## Contexto atual

Hoje no Admin "Metas Monetarias", o campo editavel e a **quantidade de vendas**. O sistema calcula faturamento = vendas x ticket. Isso causa inconsistencias porque no Plan Growth o fluxo e inverso (meta financeira gera vendas).

## Nova logica

Tornar o **Faturamento (meta)** o campo editavel principal. A quantidade de vendas e todos os splits serao derivados automaticamente:

- **Vendas** = Math.round(faturamento / ticket_medio)
- **MRR** = faturamento x 25% (para BUs nao-pontual)
- **Setup** = faturamento x 60%
- **Pontual** = faturamento x 15% (ou 100% para Oxy Hacker/Franquia)

## Mudancas

### 1. MonetaryMetasTab.tsx - Inverter campos editaveis

**Linha de Vendas**: passa de editavel para calculado (display only)
- Mostrar `Math.round(faturamento / ticket_medio)` como texto

**Linha de Faturamento**: passa de calculado para editavel
- Input numerico onde o admin digita o valor de faturamento mensal
- Formatar com R$ ao perder foco

**State local**: trocar `localVendas` por `localFaturamento`
- `getFaturamento(bu, month)` retorna o valor do state diretamente
- `getVendas(bu, month)` = `Math.round(getFaturamento(bu, month) / getTicket(bu))`

**handleSave**: derivar vendas do faturamento antes de salvar
- `vendas = Math.round(faturamento / ticket_medio)`
- Splits (MRR, Setup, Pontual) calculados sobre o faturamento

### 2. usePlanGrowthData.ts - Sem mudanca

O hook ja le `faturamento` do banco como meta principal. Nenhuma alteracao necessaria.

### 3. MediaInvestmentTab.tsx - Sem mudanca

A UI do Plan Growth ja usa a meta de faturamento como fonte. Nenhuma alteracao necessaria.

### 4. Banco de dados - Sem mudanca

A tabela `monetary_metas` ja tem o campo `faturamento`. So muda qual campo o admin edita na interface.

## Resultado esperado

- Admin edita **faturamento** (ex: R$ 1.125.000 para Jan)
- Sistema mostra vendas calculadas: Math.round(1.125.000 / 17.000) = 66
- Plan Growth usa esse faturamento como meta e calcula MRR Base, A Vender, e funil normalmente
- Consistencia total: a meta financeira e sempre a fonte de verdade

