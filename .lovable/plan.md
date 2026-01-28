

## Plano: Corrigir Percentual do Lucas para 100%

### Problema

O Lucas Ilha foi inserido com 50% de alocação para a O2 TAX, mas como ele é o **único closer** dessa BU, o valor correto é **100%**.

---

### Solução

#### 1. Atualizar Registros no Banco de Dados

Atualizar todos os registros do Lucas Ilha na O2 TAX para 100%:

```sql
UPDATE closer_metas 
SET percentage = 100, updated_at = now()
WHERE bu = 'o2_tax' 
  AND closer = 'Lucas Ilha'
  AND year = 2026;
```

#### 2. Ajustar Valor Padrão no Código

Atualizar `src/hooks/useCloserMetas.ts` para que BUs com um único closer tenham padrão de 100%:

**Arquivo:** `src/hooks/useCloserMetas.ts`

Na função `getPercentage`, ajustar o fallback para considerar se a BU tem apenas um closer:

```typescript
const getPercentage = (bu: string, month: string, closer: string): number => {
  if (!metas) {
    // Se BU tem apenas 1 closer, default é 100%
    const closersForBU = BU_CLOSERS[bu as BuType] || [];
    return closersForBU.length === 1 ? 100 : 50;
  }
  
  const meta = metas.find(m => 
    m.bu === bu && m.month === month && m.closer === closer
  );
  
  // Fallback: se BU tem apenas 1 closer, default é 100%
  if (!meta) {
    const closersForBU = BU_CLOSERS[bu as BuType] || [];
    return closersForBU.length === 1 ? 100 : 50;
  }
  
  return meta.percentage;
};
```

#### 3. Ajustar Valor Padrão no CloserMetasTab

Atualizar `src/components/planning/CloserMetasTab.tsx` na função `getLocalPercentage`:

```typescript
const getLocalPercentage = (bu: string, month: string, closer: string): number => {
  const key = `${bu}-${month}-${closer}`;
  // Se só tem 1 closer na BU, o padrão é 100%
  return localMetas[key] ?? (validClosers.length === 1 ? 100 : 50);
};
```

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Banco de dados** | SQL | Atualizar registros do Lucas para 100% |
| `src/hooks/useCloserMetas.ts` | Modificar | Ajustar fallback de `getPercentage` para 100% quando BU tem um único closer |
| `src/components/planning/CloserMetasTab.tsx` | Modificar | Ajustar fallback de `getLocalPercentage` para 100% quando há um único closer |

---

### Resultado Esperado

- **Lucas Ilha (O2 TAX)**: Sempre 100% (já que é o único closer)
- **Pedro e Daniel (outras BUs)**: Padrão 50/50 (divisão entre dois closers)

