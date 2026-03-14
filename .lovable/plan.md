

## Renomear label do acelerômetro "Faturamento" → "Fat Incremento"

**Arquivo**: `src/components/planning/IndicatorsTab.tsx` — linha 69

Alterar:
```typescript
{ key: 'faturamento', label: 'Faturamento', shortLabel: 'Fat.', format: 'currency' },
```
Para:
```typescript
{ key: 'faturamento', label: 'Fat Incremento', shortLabel: 'Fat Inc.', format: 'currency' },
```

Apenas renomeia o label exibido no acelerômetro. Nenhuma lógica de cálculo muda.

