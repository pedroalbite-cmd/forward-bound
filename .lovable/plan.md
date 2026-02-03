
## Corrigir GMV (e outras métricas) com Filtro de Período

### Problema Identificado

O GMV e outras métricas da planilha de marketing estão sendo puxados incorretamente quando o período selecionado inclui a data final de um mês. Há dois problemas:

1. **Problema na Edge Function**: A função `getYearMonthsForPeriod` usa `endDate.getMonth()` para determinar o último mês a incluir, mas não considera o **dia**. Isso faz com que `2026-03-01` inclua Março inteiro, duplicando os valores.

2. **Problema no Frontend** (possível): O `endOfMonth()` pode estar retornando o primeiro dia do próximo mês devido a timezone ou conversão ISO.

---

### Evidência do Bug

| Período Selecionado | GMV Retornado | Meses Incluídos | Esperado |
|---------------------|---------------|-----------------|----------|
| Fev 01 - Fev 28 | R$ 907.511 | 1 | Correto |
| Fev 01 - Mar 01 | R$ 1.815.022 | 2 | **Errado** (dobrou) |

---

### Solução Proposta

Modificar a lógica da Edge Function para:
1. **Verificar o dia da data final** - Se for dia 1, usar o mês anterior
2. **Alternativamente**: Usar o último dia do mês anterior como referência

---

### Alterações Técnicas

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/read-marketing-sheet/index.ts` | Corrigir `getYearMonthsForPeriod()` para considerar o dia da data final e evitar incluir mês completo quando só o dia 1 está no período |

---

### Implementação Detalhada

**Antes (atual):**
```typescript
function getYearMonthsForPeriod(startDate: string, endDate: string): YearMonths[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startMonth = start.getMonth();
  const endMonth = end.getMonth(); // <-- Bug: não considera o dia
  // ...
}
```

**Depois:**
```typescript
function getYearMonthsForPeriod(startDate: string, endDate: string): YearMonths[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startMonth = start.getMonth();
  let endMonth = end.getMonth();
  let endYear = end.getFullYear();
  
  // Se a data final é o primeiro dia do mês, 
  // considerar o mês anterior como o último mês do período
  if (end.getDate() === 1) {
    // Move para o último dia do mês anterior
    const adjustedEnd = new Date(end);
    adjustedEnd.setDate(0); // Vai para o último dia do mês anterior
    endMonth = adjustedEnd.getMonth();
    endYear = adjustedEnd.getFullYear();
  }
  // ...
}
```

---

### Comportamento Esperado Após Correção

| Período Selecionado | GMV Retornado | Meses Incluídos |
|---------------------|---------------|-----------------|
| Fev 01 - Fev 28 | R$ 907.511 | 1 |
| Fev 01 - Mar 01 | R$ 907.511 | 1 (corrigido) |
| Jan 01 - Mar 31 | R$ 2.333.336 | 3 (Jan + Fev + Mar) |

---

### Alternativa Considerada

**Forçar `endOfDay` no frontend**: Garantir que o calendário sempre envie a data final como último dia do mês (ex: `2026-02-28` em vez de `2026-03-01`).

- **Prós**: Simples, resolve no cliente
- **Contras**: Não resolve se o usuário selecionar manualmente uma data como "1 de Março"

A correção na Edge Function é mais robusta pois trata qualquer formato de data recebido.

---

### Próximos Passos

1. Aplicar correção na função `getYearMonthsForPeriod()` na Edge Function
2. Fazer deploy da função atualizada
3. Testar com diferentes períodos para validar a correção
