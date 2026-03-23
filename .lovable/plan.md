

## Fix: dataAssinatura not corrected on card objects

### Root cause

The `fixPossibleDateInversion` was applied to correct `dataEntrada`, but the `dataAssinatura` field on the card object still holds the original wrong date (e.g., `2026-09-03`). 

In `useModeloAtualAnalytics.ts`, the counting logic for 'venda' explicitly uses `card.dataAssinatura` as the effective date (lines 383-386 and 433-435), completely bypassing the corrected `dataEntrada`:

```typescript
const effectiveDate = indicator === 'venda' 
  ? (card.dataAssinatura || card.dataEntrada)  // ← uses uncorrected 2026-09-03
  : card.dataEntrada;
```

So even though `dataEntrada` was fixed to March, the venda counting still uses September from `dataAssinatura`.

### Fix (1 file)

**`src/hooks/useModeloAtualAnalytics.ts`** — In `parseCardRow`, also update `dataAssinatura` with the corrected value when the fix is applied:

```typescript
// Line 130: make dataAssinatura mutable
let correctedAssinatura = dataAssinatura;

// Line 134-136: fix both dataEntrada AND dataAssinatura
if (fase === 'Contrato assinado' && dataAssinatura) {
  const fixed = fixPossibleDateInversion(dataAssinatura, dataEntrada);
  dataEntrada = fixed;
  correctedAssinatura = fixed;
}

// Line 166: use correctedAssinatura instead of dataAssinatura
dataAssinatura: correctedAssinatura,
```

This ensures the `effectiveDate` logic for venda also uses the corrected date, placing ServiPromo and Infinit in March where they belong.

