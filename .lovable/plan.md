

## Adicionar Mapeamento "Menos de R$ 100 mil"

### Problema

O valor `"Menos de R$ 100 mil"` encontrado no banco de dados não está mapeado no `TIER_NORMALIZATION`, causando que esses registros caiam em "Não informado".

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/indicators/FunnelConversionByTierWidget.tsx` | Adicionar mapeamento na linha 35 |

---

### Código a Adicionar

Adicionar no bloco "R$ 50k - 200k variants" (linha 35):

```typescript
// R$ 50k - 200k variants
'Entre R$ 50.000 e R$ 200.000': 'R$ 50k - 200k',
'Entre R$ 50 mil e R$ 200 mil': 'R$ 50k - 200k',
'R$ 50k - 200k': 'R$ 50k - 200k',
'R$ 50k - R$ 200k': 'R$ 50k - 200k',
'entre r$ 50.000 e r$ 200.000': 'R$ 50k - 200k',
'Entre R$50k e R$200k': 'R$ 50k - 200k',
'De R$ 50k a R$ 200k': 'R$ 50k - 200k',
'R$50k-200k': 'R$ 50k - 200k',
'Menos de R$ 100 mil': 'R$ 50k - 200k',  // NOVO - Encontrado no banco!
'Entre R$ 100 mil e R$ 200 mil': 'R$ 50k - 200k',  // NOVO - Possível variante
```

---

### Resultado

Após a alteração:
- Todos os 8 valores do banco serão corretamente categorizados
- Nenhum registro cairá em "Não informado" por conta desses valores

