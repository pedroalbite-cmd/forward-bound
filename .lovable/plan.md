

# Tornar "A Vender" editavel no detalhamento por BU

## Objetivo

Permitir editar diretamente o valor de "A Vender" na tabela de detalhamento por BU (aba Plan Growth / Media Investment). Somente o mes atual e os proximos serao editaveis; meses anteriores ficam bloqueados.

## Como funciona

Quando o usuario edita "A Vender" de um mes:
- O sistema recalcula a **Meta (Faturamento)** = MRR Base + novo A Vender
- Salva o novo faturamento no banco de dados (`monetary_metas`)
- O funil inteiro (vendas, propostas, MQLs, leads, investimento) recalcula automaticamente
- Os meses seguintes tambem recalculam pois a cadeia de MRR depende do A Vender anterior

## Mudancas tecnicas

### 1. `MediaInvestmentTab.tsx` - Componente `BUInvestmentTable`

**Adicionar props para edicao:**
- `buKey` (string): identificador da BU no banco (modelo_atual, o2_tax, etc.)
- `onAVenderChange` (callback): funcao chamada ao editar A Vender de um mes
- `editable` (boolean): se permite edicao

**Coluna "A Vender" - transformar em Input editavel:**
- Meses com indice < mes atual: campo bloqueado (locked, fundo cinza, icone de cadeado)
- Mes atual e futuros: Input numerico editavel com formatacao ao perder foco
- Ao confirmar (blur), chamar `onAVenderChange(month, novoValor)`

**Logica de bloqueio de meses:**
- Reutilizar a mesma funcao `getCurrentMonthIndex()` ja usada no MonetaryMetasTab
- Fev 2026 = indice 1, Mar = 2, etc.

### 2. `MediaInvestmentTab.tsx` - Componente principal

**Adicionar handler `handleAVenderChange`:**
- Recebe (buKey, month, novoAVender)
- Calcula novo faturamento = MRR Base do mes + novo A Vender
- Faz upsert na tabela `monetary_metas` via `bulkUpdateMetas`
- Invalida queries para recalcular o funil automaticamente

**Importar `useMonetaryMetas`** para ter acesso ao `bulkUpdateMetas`

### 3. Fluxo de recalculo

Quando A Vender muda em um mes:
1. Novo faturamento = MRR Base + A Vender editado
2. Salva no banco
3. O `useMemo` que calcula `metasMensaisModeloAtual` detecta a mudanca
4. `calculateMrrAndRevenueToSell` recalcula toda a cadeia de MRR
5. O funil reverso recalcula vendas, propostas, leads, investimento
6. A tabela atualiza automaticamente

### 4. UX da edicao

- Campo A Vender mostra valor formatado (ex: "400k") quando nao esta em edicao
- Ao clicar, mostra o valor numerico puro para editar
- Ao sair do campo, formata e salva
- Feedback via toast de sucesso/erro
- Meses bloqueados mostram valor com opacidade reduzida
