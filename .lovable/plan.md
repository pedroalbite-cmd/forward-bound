

## Remover Linha "Incremento" de Oxy Hacker e Franquia

### Situação Atual

Para as BUs **Oxy Hacker** e **Franquia**, a tabela mostra:

```
┌──────────────┬──────┬──────┬──────┬─────────┐
│ Métrica      │ Jan  │ Fev  │ Mar  │ Total   │
├──────────────┼──────┼──────┼──────┼─────────┤
│ Incremento   │ 54k  │ 108k │ 108k │ 270k    │  ← Redundante
│ Pontual      │ 54k  │ 108k │ 108k │ 270k    │
└──────────────┴──────┴──────┴──────┴─────────┘
```

Os valores são sempre idênticos porque 100% do faturamento vai para Pontual.

---

### Solução

Exibir **apenas a linha Pontual** para essas BUs:

```
┌──────────────┬──────┬──────┬──────┬─────────┐
│ Métrica      │ Jan  │ Fev  │ Mar  │ Total   │
├──────────────┼──────┼──────┼──────┼─────────┤
│ Pontual      │ 54k  │ 108k │ 108k │ 270k    │
└──────────────┴──────┴──────┴──────┴─────────┘
```

---

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/MonetaryMetasTab.tsx` | Ajustar `visibleMetrics` e lógica de update |

---

### Alterações

#### 1. Alterar `visibleMetrics` (linha 223-228)

De:
```typescript
const visibleMetrics = useMemo(() => {
  if (isPontualOnlyBU(selectedBu)) {
    return ['faturamento', 'pontual'] as MetricType[];
  }
  return METRICS;
}, [selectedBu, METRICS]);
```

Para:
```typescript
const visibleMetrics = useMemo(() => {
  if (isPontualOnlyBU(selectedBu)) {
    return ['pontual'] as MetricType[];  // Apenas Pontual
  }
  return METRICS;
}, [selectedBu, METRICS]);
```

#### 2. Ajustar `updateLocalValue` para edição de Pontual (linha 85-125)

Quando o usuário editar o campo **Pontual** em uma BU de expansão, deve atualizar também o **faturamento** internamente (para manter consistência no banco):

```typescript
const updateLocalValue = (bu: string, month: string, metric: MetricType, value: number) => {
  const key = `${bu}-${month}`;
  const isPontualOnly = isPontualOnlyBU(bu as BuType);
  
  // Para BUs pontual-only, editar Pontual atualiza faturamento também
  if (isPontualOnly && metric === 'pontual') {
    setLocalMetas(prev => ({
      ...prev,
      [key]: {
        faturamento: value,  // Sincroniza faturamento
        mrr: 0,
        setup: 0,
        pontual: value,
      },
    }));
    setHasChanges(true);
    return;
  }
  
  // ... resto da lógica existente para faturamento e outras métricas
};
```

#### 3. Remover validação de Pontual = Faturamento (linha 231-255)

Como agora só existe uma linha para editar, a validação de "Pontual deve ser igual ao Incremento" não faz mais sentido. Simplificar:

```typescript
const validationIssues = useMemo(() => {
  const issues: string[] = [];
  
  // Validação só para BUs com MRR/Setup/Pontual
  if (!isPontualOnlyBU(selectedBu)) {
    MONTHS.forEach(month => {
      const fat = getLocalValue(selectedBu, month, 'faturamento');
      const sum = getLocalValue(selectedBu, month, 'mrr') +
                  getLocalValue(selectedBu, month, 'setup') +
                  getLocalValue(selectedBu, month, 'pontual');
      if (fat > 0 && sum > fat) {
        issues.push(`${month}: MRR + Setup + Pontual (${formatCurrency(sum)}) excede Faturamento (${formatCurrency(fat)})`);
      }
    });
  }
  // BUs pontual-only não precisam de validação (só tem 1 campo)
  
  return issues;
}, [localMetas, selectedBu]);
```

#### 4. Atualizar texto de ajuda (linha 402-424)

```tsx
{isPontualOnlyBU(selectedBu) ? (
  <>
    <p>
      <strong>{BU_LABELS[selectedBu]}</strong> opera com ticket único (valor pontual).
    </p>
    <p>
      Preencha o valor de <strong>Pontual</strong> esperado para cada mês.
    </p>
    <p>
      Ticket padrão: <strong>{selectedBu === 'oxy_hacker' ? 'R$ 54.000' : 'R$ 140.000'}</strong>
    </p>
  </>
) : (
  // ... texto existente para Modelo Atual / O2 TAX
)}
```

---

### Resultado Final

**Para Oxy Hacker / Franquia:**
```
┌──────────────┬──────┬──────┬──────┬─────────┐
│ Métrica      │ Jan  │ Fev  │ Mar  │ Total   │
├──────────────┼──────┼──────┼──────┼─────────┤
│ Pontual      │ 54k  │ 108k │ 108k │ 270k    │
└──────────────┴──────┴──────┴──────┴─────────┘
```

**Para Modelo Atual / O2 TAX** (sem mudança):
```
┌──────────────┬──────┬──────┬──────┬─────────┐
│ Métrica      │ Jan  │ Fev  │ Mar  │ Total   │
├──────────────┼──────┼──────┼──────┼─────────┤
│ Incremento   │ 400k │ 420k │ 450k │ 1.27M   │
│ MRR          │ 100k │ 105k │ 112k │ 317k    │
│ Setup        │ 240k │ 252k │ 270k │ 762k    │
│ Pontual      │  60k │  63k │  68k │ 191k    │
└──────────────┴──────┴──────┴──────┴─────────┘
```

