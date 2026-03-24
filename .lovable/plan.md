

## Franquia e Oxy Hacker: usar dados de vendas do Pipefy no gráfico de Faturamento

### Problema
Atualmente, quando `hasDailyRevenueData` é true, o gráfico usa `getDailyRevenueForBUs` para **todas** as BUs — inclusive Oxy Hacker e Franquia, que pegam o valor da coluna `expansao` da tabela `daily_revenue` (DRE). O usuário quer que essas duas BUs usem os dados de vendas do Pipefy (valor + data de assinatura do contrato), da mesma forma que já funciona no fallback (`allSetupPontualCards`).

### Solução

**Arquivo: `src/components/planning/IndicatorsTab.tsx`**

Separar o cálculo do realizado em duas partes:

1. **BUs com dados DRE** (modelo_atual, o2_tax): continuam usando `getDailyRevenueForBUs` quando `hasDailyRevenueData` é true
2. **BUs com dados Pipefy** (oxy_hacker, franquia): sempre usam os cards de venda do Pipefy (já disponíveis via `oxyHackerAnalytics` e `franquiaAnalytics`)

**Alterações concretas:**

- Modificar `getDailyRevenueForBUs` para **não incluir** `row.expansao` (remover linhas de oxy_hacker/franquia)
- Criar flag `hasDreBUs` = selectedBUs inclui modelo_atual ou o2_tax
- Criar `pipefy BUs` = filtrar selectedBUs para oxy_hacker/franquia
- Nos dois loops de cálculo (header e chart data), além do daily revenue para BUs DRE, **sempre somar** os cards de venda do Pipefy para oxy_hacker e franquia no período

Isso garante que o realizado de Franquia e Oxy Hacker venha dos cards do Pipefy com data de assinatura, enquanto Modelo Atual e O2 TAX continuam vindo do DRE.

### Arquivos alterados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Separar lógica de realizado: DRE para modelo_atual/o2_tax, Pipefy para oxy_hacker/franquia |

