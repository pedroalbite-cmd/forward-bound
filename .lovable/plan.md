

## Remover Fallback de R$ 15k do useO2TaxMetas

### Alteração

Remover o fallback de R$ 15.000 que foi adicionado ao hook `useO2TaxMetas.ts`, voltando ao comportamento original onde cards sem valor monetário somam R$ 0.

---

### Código a Modificar

**Arquivo:** `src/hooks/useO2TaxMetas.ts`

**Antes (atual):**
```typescript
const sum = pontual + setup + mrr;
// Fallback de R$ 15k para cards sem valor monetário preenchido
cardValues.set(movement.id, sum === 0 ? 15000 : sum);
```

**Depois:**
```typescript
cardValues.set(movement.id, pontual + setup + mrr);
```

---

### Resultado

- Cards O2 TAX sem valores monetários preenchidos somarão R$ 0 (sem fallback)
- O valor exibido no acelerômetro refletirá apenas os valores reais dos cards

