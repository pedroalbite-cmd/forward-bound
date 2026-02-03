

## Remover Coluna Lead→MQL do Widget de Conversão por Tier

### Alteração

Remover a etapa **Lead→MQL** do array `STAGE_LABELS` no arquivo `FunnelConversionByTierWidget.tsx`.

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/indicators/FunnelConversionByTierWidget.tsx` | Remover primeira entrada do `STAGE_LABELS` |

---

### Código Atual (Linha 78-84)

```typescript
const STAGE_LABELS = [
  { key: 'leadToMql', label: 'Lead→MQL', from: 'leads', to: 'mql' },  // REMOVER
  { key: 'mqlToRm', label: 'MQL→RM', from: 'mql', to: 'rm' },
  { key: 'rmToRr', label: 'RM→RR', from: 'rm', to: 'rr' },
  { key: 'rrToProposta', label: 'RR→Prop', from: 'rr', to: 'proposta' },
  { key: 'propostaToVenda', label: 'Prop→Venda', from: 'proposta', to: 'venda' },
] as const;
```

### Código Novo

```typescript
const STAGE_LABELS = [
  { key: 'mqlToRm', label: 'MQL→RM', from: 'mql', to: 'rm' },
  { key: 'rmToRr', label: 'RM→RR', from: 'rm', to: 'rr' },
  { key: 'rrToProposta', label: 'RR→Prop', from: 'rr', to: 'proposta' },
  { key: 'propostaToVenda', label: 'Prop→Venda', from: 'proposta', to: 'venda' },
] as const;
```

---

### Resultado

Após a alteração:
- A tabela mostrará 4 colunas de conversão em vez de 5
- O gráfico de barras terá 4 grupos em vez de 5
- A análise de gargalo também ignorará a etapa Lead→MQL
- O cálculo de "melhor tier" continuará baseado em MQL→Venda (sem mudança)

