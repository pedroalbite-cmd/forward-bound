

## Alterar Label da Coluna MQL→RM para Lead/MQL → RM

### Alteração

Modificar o label da primeira etapa de conversão no array `STAGE_LABELS`.

### Arquivo a Modificar

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| `src/components/planning/indicators/FunnelConversionByTierWidget.tsx` | 64 | Alterar label |

---

### Código Atual

```typescript
const STAGE_LABELS = [
  { key: 'mqlToRm', label: 'MQL→RM', from: 'mql', to: 'rm' },
  { key: 'rmToRr', label: 'RM→RR', from: 'rm', to: 'rr' },
  { key: 'rrToProposta', label: 'RR→Prop', from: 'rr', to: 'proposta' },
  { key: 'propostaToVenda', label: 'Prop→Venda', from: 'proposta', to: 'venda' },
] as const;
```

### Código Novo

```typescript
const STAGE_LABELS = [
  { key: 'mqlToRm', label: 'Lead/MQL → RM', from: 'mql', to: 'rm' },
  { key: 'rmToRr', label: 'RM→RR', from: 'rm', to: 'rr' },
  { key: 'rrToProposta', label: 'RR→Prop', from: 'rr', to: 'proposta' },
  { key: 'propostaToVenda', label: 'Prop→Venda', from: 'proposta', to: 'venda' },
] as const;
```

---

### Resultado

A tabela e o gráfico de barras exibirão "Lead/MQL → RM" em vez de "MQL→RM" na primeira coluna de conversão.

