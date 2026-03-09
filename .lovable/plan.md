

## Plano: Usar Faturamento Total Realizado para Jan e Fev 2026

### Problema

Os valores na tabela `mrr_base_monthly` para Jan/2026 (539.569,60) e Fev/2026 (607.534,59) são apenas MRR base. O gráfico soma Setup + Pontual por cima, resultando no valor "Previsto". O usuário quer que esses dois meses mostrem o **Realizado total**: Jan = R$ 967.968,89 e Fev = R$ 809.975,81.

### Solução

Adicionar uma coluna `is_total_override` (boolean, default false) na tabela `mrr_base_monthly`. Quando `true`, o valor é usado diretamente como faturamento total (sem somar Setup/Pontual). Quando `false`, mantém a lógica atual (MRR base + Setup + Pontual).

### Alterações

**1. Migração SQL**
- Adicionar coluna `is_total_override boolean default false`
- Atualizar Jan/2026: value = 967968.89, is_total_override = true
- Atualizar Fev/2026: value = 809975.81, is_total_override = true

**2. Hook `useMrrBase.ts`**
- Adicionar campo `is_total_override` na interface e no retorno
- Nova função `isTotalOverride(month, year)` que retorna boolean

**3. `IndicatorsTab.tsx` — bloco RevenuePaceChart (~linhas 2505-2600)**
- Para cada mês: se `isTotalOverride(month, year)` → usar valor direto (sem somar setup/pontual)
- Se não → manter lógica atual (MRR base × fração + setup + pontual realizados)

### Resultado
- Jan/2026 e Fev/2026: gráfico mostra exatamente os valores "Realizado" do print
- Demais meses: continuam com a lógica MRR base + Setup + Pontual
- Futuramente, basta marcar `is_total_override = true` e atualizar o `value` para qualquer mês que tenha o realizado confirmado

