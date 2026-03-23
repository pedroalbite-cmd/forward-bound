

## Filtrar "Sem CFO" da Performance por CFO

### Problema
Cards NPS que não têm CFO mapeado (nem via conexão com Central de Projetos, nem nos campos do card) caem no bucket "Sem CFO" com 32 enviados e 27 respostas, poluindo a tabela de performance.

### Solução

**Arquivo:** `src/hooks/useNpsData.ts`

Na linha 289, onde o fallback é `'Sem CFO'`, filtrar esses cards para que não apareçam na tabela de performance por CFO:

```typescript
currentCards.forEach(c => {
  const cfo = externalCfoMap[c.ID] || c['CFO Responsavel'] || c['Responsavel Tratativa'];
  if (!cfo) return; // Ignorar cards sem CFO identificado
  // ... resto do código
});
```

Isso remove a linha "Sem CFO" da tabela e mantém apenas CFOs reais. Os KPIs gerais (NPS, CSAT, etc.) continuam calculados com todos os cards — apenas a tabela de performance por CFO é afetada.

### Arquivo modificado
- `src/hooks/useNpsData.ts` — 2 linhas alteradas no loop de CFO aggregation

