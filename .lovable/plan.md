

## Usar `cashflow_details` para Faturamento Diário

### Qual API usar e por quê

| Endpoint | O que retorna | Granularidade |
|---|---|---|
| `cashflow_chart` | Entradas/Saídas/Saldo | **Mensal** (sempre agrega por mês) |
| `cashflow_details` | Lista de clientes com valores recebidos | **Conforme o filtro de datas** |

**Decisão: `cashflow_details`** com `movimentType: 'R'` (Recebimentos).

Testei chamando com `startDate=2026-01-02` e `endDate=2026-01-02` — retorna exatamente os clientes que pagaram naquele dia. Somando os valores temos o total recebido no dia. Exemplo: dia 02/Jan retornou 4 clientes somando R$ 56.721,49.

O `cashflow_chart` não serve porque sempre agrega por mês, independente do range de datas.

### Plano

**1. Criar tabela `daily_revenue`**
```sql
CREATE TABLE daily_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_inflows numeric NOT NULL DEFAULT 0,
  customer_count integer NOT NULL DEFAULT 0,
  year integer NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now()
);
```
Com RLS: leitura para autenticados, escrita via service role.

**2. Criar Edge Function `sync-daily-revenue`**
- Recebe `startDate` e `endDate`
- Itera dia a dia nesse range
- Para cada dia, chama `cashflow_details` com `movimentType: 'R'`
- Soma os `value` de todos os clientes retornados = total do dia
- Faz upsert na tabela `daily_revenue`
- Retorna resumo do sync

Para evitar excesso de chamadas, a função aceita um range (ex: mês atual) e sincroniza apenas os dias nesse período.

**3. Atualizar `useOxyFinance.ts`**
- Adicionar query para buscar `daily_revenue` do banco
- Expor `dailyRevenue: { date: string, total: number }[]`
- Calcular `cashflowByMonth` a partir dos dados diários (soma por mês)

**4. Atualizar o gráfico de Faturamento**
- No `IndicatorsTab.tsx`: usar os totais mensais derivados da tabela `daily_revenue` em vez do endpoint `cashflow_chart`
- Dados mais precisos pois vêm da soma dia a dia real

### Fluxo
```text
sync-daily-revenue (Edge Function)
  ├─ Para cada dia no range:
  │   ├─ GET cashflow_details (startDate=dia, endDate=dia, movimentType=R)
  │   ├─ Soma values de todos os clientes
  │   └─ UPSERT daily_revenue (date, total_inflows, customer_count)
  └─ Retorna resumo

Frontend (useOxyFinance)
  ├─ SELECT * FROM daily_revenue WHERE year = 2026
  ├─ Agrupa por mês → cashflowByMonth
  └─ Gráfico usa esses valores como "Realizado"
```

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | **Criar** tabela `daily_revenue` + RLS |
| `supabase/functions/sync-daily-revenue/index.ts` | **Criar** edge function de sync |
| `src/hooks/useOxyFinance.ts` | **Editar** - buscar `daily_revenue` do banco, derivar `cashflowByMonth` |
| `src/components/planning/IndicatorsTab.tsx` | **Editar** - usar dados da tabela |

