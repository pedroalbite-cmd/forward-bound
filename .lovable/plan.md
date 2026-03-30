

## Atualizar sync do faturamento até 31/mar

O último sync foi feito até 2026-03-30. Preciso re-executar a Edge Function `sync-daily-revenue` com `endDate: "2026-03-31"` para incluir o dia 31.

### Ação
Chamar a função `sync-daily-revenue` com:
- `startDate`: "2026-01-01"
- `endDate`: "2026-03-31"
- `source`: "dre"
- `forceRefreshDays`: 31

Apenas uma chamada à Edge Function, sem alteração de código.

