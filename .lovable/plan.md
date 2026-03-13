

## Problema: Parser do Cashflow Não Corresponde ao Formato da API

O endpoint `cashflow_chart` da Oxy Finance retorna dados neste formato:

```json
{
  "items": [
    {
      "month": "2026-01",
      "values": [
        { "label": "Entradas", "type": "bar", "value": 941183.26 },
        { "label": "Saídas", "type": "bar", "value": 731128.57 },
        { "label": "Saldo", "type": "line", "value": 210054.69 }
      ]
    }
  ]
}
```

Mas o parser em `useOxyFinance.ts` espera uma estrutura diferente — busca `cashflowData.data` (deveria ser `.items`) e tenta ler chaves planas como `item.receitas`, `item.entradas`, etc., que não existem. Resultado: `cashflowByMonth` fica todo zerado e o gráfico cai no fallback MRR+Pipefy.

Dados reais disponíveis:
- Jan: R$ 941k entradas
- Fev: R$ 805k entradas  
- Mar: R$ 282k entradas (parcial)

## Alterações

### `src/hooks/useOxyFinance.ts` — Corrigir parser do cashflow

1. **Linha 186**: Trocar `cashflowData?.data` por `cashflowData?.items`
2. **Linhas 187-195**: Reescrever o parsing de cada item para extrair valores do array `values` por label:
   - `"Entradas"` → inflows
   - `"Saídas"` → outflows  
   - `"Saldo"` → balance
3. **Linha 190**: Garantir que o month retornado por `parseMonthFromDate("2026-01")` seja usado corretamente (já funciona, mas o fallback `item.month` retorna `"2026-01"` que não bate com `MONTHS`)

Lógica corrigida:
```typescript
const items = Array.isArray(cashflowData) ? cashflowData : cashflowData?.items || [];
return items.map((item) => {
  const monthName = parseMonthFromDate(item.month || '') || '';
  const vals = item.values || [];
  const getVal = (label: string) => vals.find(v => v.label === label)?.value || 0;
  return {
    month: monthName,
    inflows: Number(getVal('Entradas')),
    outflows: Math.abs(Number(getVal('Saídas'))),
    balance: Number(getVal('Saldo')),
  };
});
```

Nenhuma outra alteração necessária — o `IndicatorsTab.tsx` já consome `cashflowByMonth` corretamente. Uma vez que o parser retorne os valores reais, o gráfico mostrará Jan=R$941k, Fev=R$805k, Mar=R$282k.

