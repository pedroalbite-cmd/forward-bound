

## Ajuste de Metas Monetárias para Oxy Hacker e Franquia

### Problema Identificado

Na tela de **Metas Monetárias** (MonetaryMetasTab), quando se edita as BUs **Oxy Hacker** e **Franquia**, o sistema exibe e calcula campos de **MRR** e **Setup** que não fazem sentido para essas BUs.

**Modelo de negócio dessas BUs:**
- **Oxy Hacker**: Ticket único de R$ 54.000 (valor pontual)
- **Franquia**: Ticket único de R$ 140.000 ("Taxa de Franquia" - valor pontual)

Não há componente de receita recorrente (MRR) ou implementação (Setup) - todo o faturamento é **pontual**.

---

### Solução Proposta

Ajustar a lógica e UI do `MonetaryMetasTab.tsx` para:

1. **Ocultar linhas de MRR e Setup** quando a BU selecionada for `oxy_hacker` ou `franquia`
2. **Ajustar o cálculo automático** para que o Incremento (faturamento) seja 100% atribuído ao Pontual
3. **Simplificar a validação** para essas BUs (não há soma MRR+Setup+Pontual a validar)

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/MonetaryMetasTab.tsx` | Lógica condicional para BUs de expansão |
| `src/hooks/useMonetaryMetas.ts` | Adicionar helper para identificar BUs "pontual only" |

---

### Detalhes Técnicos

#### 1. Hook `useMonetaryMetas.ts` - Adicionar constante de BUs

```typescript
// BUs that only have "pontual" revenue (no MRR or Setup)
export const PONTUAL_ONLY_BUS: BuType[] = ['oxy_hacker', 'franquia'];

// Helper function
export const isPontualOnlyBU = (bu: BuType): boolean => {
  return PONTUAL_ONLY_BUS.includes(bu);
};
```

#### 2. MonetaryMetasTab - Ajustar cálculo automático

Quando `faturamento` é alterado para Oxy Hacker ou Franquia:

```typescript
const updateLocalValue = (bu: string, month: string, metric: MetricType, value: number) => {
  const key = `${bu}-${month}`;
  
  if (metric === 'faturamento') {
    const isPontualOnly = bu === 'oxy_hacker' || bu === 'franquia';
    
    if (isPontualOnly) {
      // Para BUs de expansão: 100% vai para Pontual
      setLocalMetas(prev => ({
        ...prev,
        [key]: {
          faturamento: value,
          mrr: 0,
          setup: 0,
          pontual: value,  // 100% do valor
        },
      }));
    } else {
      // Para Modelo Atual e O2 TAX: split padrão 25/60/15
      setLocalMetas(prev => ({
        ...prev,
        [key]: {
          faturamento: value,
          mrr: Math.round(value * 0.25),
          setup: Math.round(value * 0.6),
          pontual: Math.round(value * 0.15),
        },
      }));
    }
  } else {
    // ...existing logic
  }
};
```

#### 3. MonetaryMetasTab - Filtrar métricas exibidas

```typescript
// Métricas a exibir baseado na BU selecionada
const visibleMetrics = useMemo(() => {
  if (selectedBu === 'oxy_hacker' || selectedBu === 'franquia') {
    return ['faturamento', 'pontual'] as MetricType[];
  }
  return METRICS; // ['faturamento', 'mrr', 'setup', 'pontual']
}, [selectedBu]);

// No JSX, usar visibleMetrics ao invés de METRICS
{visibleMetrics.map(metric => (
  <TableRow key={metric}>
    ...
  </TableRow>
))}
```

#### 4. Ajustar validação

```typescript
const validationIssues = useMemo(() => {
  const issues: string[] = [];
  const isPontualOnly = selectedBu === 'oxy_hacker' || selectedBu === 'franquia';
  
  MONTHS.forEach(month => {
    const fat = getLocalValue(selectedBu, month, 'faturamento');
    
    if (isPontualOnly) {
      // Para BUs pontual-only, validar que Pontual = Faturamento
      const pontual = getLocalValue(selectedBu, month, 'pontual');
      if (fat > 0 && pontual !== fat) {
        issues.push(`${month}: Pontual deve ser igual ao Incremento para ${BU_LABELS[selectedBu]}`);
      }
    } else {
      // Validação padrão: soma não excede faturamento
      const sum = getLocalValue(selectedBu, month, 'mrr') +
                  getLocalValue(selectedBu, month, 'setup') +
                  getLocalValue(selectedBu, month, 'pontual');
      if (fat > 0 && sum > fat) {
        issues.push(`${month}: MRR + Setup + Pontual excede Incremento`);
      }
    }
  });
  return issues;
}, [localMetas, selectedBu]);
```

#### 5. Ajustar texto de ajuda

```tsx
<CardContent className="text-sm text-muted-foreground space-y-2">
  {selectedBu === 'oxy_hacker' || selectedBu === 'franquia' ? (
    <>
      <p>
        <strong>{BU_LABELS[selectedBu]}</strong> opera com ticket único (valor pontual).
      </p>
      <p>
        O valor de <strong>Incremento</strong> é automaticamente replicado para <strong>Pontual</strong>.
      </p>
      <p>
        Ticket padrão: <strong>{selectedBu === 'oxy_hacker' ? 'R$ 54.000' : 'R$ 140.000'}</strong>
      </p>
    </>
  ) : (
    <>
      <p>
        <strong>Percentuais padrão:</strong> MRR = 25%, Setup = 60%, Pontual = 15% do Incremento
      </p>
      <p>
        <strong>Dica:</strong> Ao preencher o Incremento, os demais campos são calculados automaticamente.
      </p>
    </>
  )}
</CardContent>
```

---

### Resultado Visual Esperado

**Para Modelo Atual / O2 TAX:**
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

**Para Oxy Hacker / Franquia:**
```
┌──────────────┬──────┬──────┬──────┬─────────┐
│ Métrica      │ Jan  │ Fev  │ Mar  │ Total   │
├──────────────┼──────┼──────┼──────┼─────────┤
│ Incremento   │ 54k  │ 108k │ 108k │ 270k    │
│ Pontual      │ 54k  │ 108k │ 108k │ 270k    │
└──────────────┴──────┴──────┴──────┴─────────┘

(MRR e Setup não são exibidos)
```

---

### Impacto

1. **Clareza de modelo de negócio**: Interface reflete a realidade de cada BU
2. **Simplicidade**: Usuário não precisa entender por que MRR/Setup existem para BUs de ticket único
3. **Consistência**: Alinhado com a lógica já existente em `RevenueBreakdownChart` que trata taxaFranquia como pontual

