

# Mover Controle de Metas para dentro do Plan Growth (cascata por mes)

## Resumo

Remover a aba "Controle Metas" como aba separada e integrar os dados de realizado (previsto vs realizado, variacao, status) diretamente nas tabelas de detalhamento por BU do Plan Growth. Cada linha de mes na tabela tera um botao expansivel (collapsible) que abre uma cascata mostrando o resultado realizado daquele mes.

## O que muda para o usuario

- A aba "Controle Metas" some do menu principal
- No Plan Growth, na secao "Detalhamento por BU", cada mes tem um icone clicavel (chevron)
- Ao clicar, abre uma linha expandida abaixo mostrando:
  - Valor Realizado do mes
  - Variacao % (realizado vs meta)
  - Status (icone verde/amarelo/vermelho)
  - Barra de progresso visual
- O hero section com KPIs consolidados (meta anual, realizado, taxa de atingimento, gap) sera adicionado no topo do Plan Growth

## Mudancas tecnicas

### 1. `BUInvestmentTable` - Adicionar cascata de realizado por mes

**Novas props:**
- `realizedByMonth`: `Record<string, number>` - dados realizados por mes para esta BU
- `isLoadingRealized`: boolean

**Cada linha de mes ganha:**
- Um `ChevronDown`/`ChevronUp` clicavel na primeira coluna
- Ao clicar, expande uma `TableRow` extra abaixo com:
  - Realizado: valor em R$
  - Meta: valor previsto (ja disponivel no `funnelData`)
  - Variacao: badge colorido com %
  - Progresso: barra visual
  - Status: icone check/x

**State local:** `expandedMonths: Set<string>` para controlar quais meses estao abertos

### 2. `MediaInvestmentTab` - Integrar dados realizados

**Importar `useIndicatorsRealized`** para obter os dados realizados por BU.

**Passar `realizedByMonth` para cada `BUInvestmentTable`:**
- Modelo Atual: `realizedByBU.modelo_atual`
- O2 TAX: `realizedByBU.o2_tax`
- Oxy Hacker: `realizedByBU.oxy_hacker`
- Franquia: `realizedByBU.franquia`

**Adicionar um bloco de KPIs resumo** (similar ao hero do SalesGoalsTab) no topo do Plan Growth ou na secao de detalhamento, mostrando:
- Meta Anual consolidada
- Total Realizado
- Taxa de Atingimento
- Gap para meta

### 3. `Planning2026.tsx` - Remover aba "Controle Metas"

- Remover `SalesGoalsTab` do import e do render
- Remover `sales` da lista de abas visibles no `TAB_CONFIG`
- Remover o `TabsContent value="sales"`

### 4. `useUserPermissions.ts` - Remover permissao `sales`

- Remover `'sales'` do tipo `TabKey`
- Remover da lista de abas do admin

### 5. Arquivos que podem ser mantidos (sem deletar)

Os componentes `SalesGoalsTab`, `SalesGoalsCards`, `SalesGoalsTable`, `SalesGoalsCharts`, `ExpansaoBreakdown` continuam existindo no codigo mas nao serao mais referenciados. Podem ser removidos em uma limpeza futura.

### 6. `AdminTab.tsx` - Remover `sales` das opcoes de permissao

Remover a entrada `{ key: 'sales', label: 'Controle Metas' }` do array `TAB_OPTIONS`.

## Detalhes da cascata expandida

A linha expandida por mes mostrara algo como:

```text
| Jan | R$ 1.100.000 | R$ 700.000 | R$ 400.000 | 24 | 39 | ... |
|     [Realizado: R$ 85.000  |  Meta: R$ 1.100.000  |  7.7%  |  ████░░░░  |  Gap: R$ 1.015.000]  |
```

- A linha expandida ocupa toda a largura da tabela (colspan total)
- Fundo levemente diferente (muted/30) para diferenciar visualmente
- Mostra: Realizado, Meta, % Atingimento, barra de progresso, gap
- Icone de status colorido (check verde >= 80%, amarelo >= 50%, vermelho < 50%)

