
## Plano: Alterar Contagem de Venda de "Ganho" para "Contrato Assinado"

### Contexto

Atualmente, todas as BUs (Modelo Atual, O2 TAX, Oxy Hacker, Franquia) contam "venda" como cards que entraram na fase "Ganho" no Pipefy. O usuario deseja mudar para contar "venda" como cards que entraram na fase "Contrato assinado".

---

### Analise das Fases Disponiveis

Com base no codigo, as fases mapeadas atualmente sao:

| BU | Fase para Venda (atual) | Fase Desejada |
|----|-------------------------|---------------|
| Modelo Atual | 'Ganho' | 'Contrato assinado' |
| O2 TAX | 'Ganho' | 'Contrato assinado' |
| Oxy Hacker | 'Ganho' | 'Contrato assinado' |
| Franquia | 'Ganho' | 'Contrato assinado' |

---

### Secao Tecnica

**Arquivos a Modificar:**

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useModeloAtualMetas.ts` | Alterar mapeamento de 'Ganho' para 'Contrato assinado' |
| `src/hooks/useModeloAtualAnalytics.ts` | Alterar mapeamento de 'Ganho' para 'Contrato assinado' |
| `src/hooks/useO2TaxMetas.ts` | Alterar mapeamento de 'Ganho' para 'Contrato assinado' |
| `src/hooks/useO2TaxAnalytics.ts` | Alterar mapeamento de 'Ganho' para 'Contrato assinado' |
| `src/hooks/useExpansaoMetas.ts` | Alterar mapeamento de 'Ganho' para 'Contrato assinado' |
| `src/hooks/useExpansaoAnalytics.ts` | Alterar mapeamento de 'Ganho' para 'Contrato assinado' |
| `src/hooks/useOxyHackerMetas.ts` | Alterar mapeamento de 'Ganho' para 'Contrato assinado' |

---

### Alteracoes Detalhadas

**1. useModeloAtualMetas.ts (linhas 44-46):**
```typescript
// ANTES
'Ganho': 'venda',

// DEPOIS
'Contrato assinado': 'venda',
```

**2. useModeloAtualAnalytics.ts (linhas 50-52):**
```typescript
// ANTES
'Ganho': 'venda',

// DEPOIS
'Contrato assinado': 'venda',
```

**3. useO2TaxMetas.ts (linhas 34-35):**
```typescript
// ANTES
'Ganho': 'venda',

// DEPOIS
'Contrato assinado': 'venda',
```

Alem disso, atualizar a logica especifica que verifica `movement.fase === 'Ganho'` para `movement.fase === 'Contrato assinado'` em:
- `getQtyForPeriod` (linha 117)
- `getValueForPeriod` (linha 157)
- `getGroupedData` - helper `countUniqueCardsInPeriod` (linha 239)

**4. useO2TaxAnalytics.ts:**
- Atualizar `PHASE_DISPLAY_MAP` para incluir 'Contrato assinado'
- Atualizar `PHASE_TO_INDICATOR_MAP` (linha 488)
- Atualizar `getDealsWon` para verificar 'Contrato assinado' (linhas 263-267)
- Atualizar `getDetailItemsForIndicator` (linhas 505-509)

**5. useExpansaoMetas.ts (linha 34):**
```typescript
// ANTES
'Ganho': 'venda',

// DEPOIS
'Contrato assinado': 'venda',
```

Atualizar verificacoes explicitas de `movement.fase === 'Ganho'` para `'Contrato assinado'` em:
- `getQtyForPeriod` (linhas 118-121)
- `getValueForPeriod` (linhas 158-160)
- `getGroupedData` - helper (linhas 243-244)

**6. useExpansaoAnalytics.ts (linhas 33-34):**
```typescript
// ANTES
'Ganho': 'venda',

// DEPOIS
'Contrato assinado': 'venda',
```

Atualizar `PHASE_DISPLAY_MAP` e a logica em `getCardsForIndicator` (linhas 180-184).

**7. useOxyHackerMetas.ts (linha 34):**
```typescript
// ANTES
'Ganho': 'venda',

// DEPOIS
'Contrato assinado': 'venda',
```

Atualizar verificacoes explicitas de `movement.fase === 'Ganho'` para `'Contrato assinado'` em:
- `getQtyForPeriod` (linhas 124-128)
- `getValueForPeriod` (linhas 164-166)
- `getGroupedData` - helper (linhas 249-251)

---

### Resumo das Alteracoes por Hook

| Hook | Mapeamento PHASE_TO_INDICATOR | Verificacoes Explicitas |
|------|-------------------------------|------------------------|
| useModeloAtualMetas | 'Ganho' -> 'Contrato assinado' | N/A (usa mapeamento) |
| useModeloAtualAnalytics | 'Ganho' -> 'Contrato assinado' | N/A (usa mapeamento) |
| useO2TaxMetas | 'Ganho' -> 'Contrato assinado' | 3 locais |
| useO2TaxAnalytics | 'Ganho' -> 'Contrato assinado' | 2 locais + PHASE_DISPLAY_MAP |
| useExpansaoMetas | 'Ganho' -> 'Contrato assinado' | 3 locais |
| useExpansaoAnalytics | 'Ganho' -> 'Contrato assinado' | 1 local + PHASE_DISPLAY_MAP |
| useOxyHackerMetas | 'Ganho' -> 'Contrato assinado' | 3 locais |

---

### Impacto

- **Indicadores de Venda**: Passarao a contar cards na fase "Contrato assinado"
- **Drill-down de Vendas**: Exibira cards que entraram em "Contrato assinado"
- **Widgets de Deals Won**: Usarao a nova fase
- **Valores Monetarios**: Serao calculados com base nos cards em "Contrato assinado"

---

### Consideracao Importante

Esta mudanca assume que a fase "Contrato assinado" existe nos dados do Pipefy para todas as BUs. Caso a fase tenha um nome ligeiramente diferente (como "Contrato Assinado" com maiuscula diferente), sera necessario ajustar o nome exato.

