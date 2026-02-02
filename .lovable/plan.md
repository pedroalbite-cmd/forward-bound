
## Filtros Rápidos de Data para Indicadores

### Objetivo

Adicionar botões de atalho de período na aba **Indicadores** (IndicatorsTab), similar ao que já existe na aba **Mkt Indicadores**. Os botões permitirão selecionar rapidamente:

- Este Mês
- Mês Anterior
- Trimestre Atual
- Trimestre Anterior
- Ano Atual

---

### Design da Solução

Os botões serão posicionados **antes dos seletores de data** (calendários), agrupados em uma linha compacta. Ao clicar, eles atualizam automaticamente `startDate` e `endDate`.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [Consolidado ▼]  [Closers ▼]  [SDRs ▼]                                                │
│                                                                                         │
│  [ Este Mês ] [ Mês Anterior ] [ Q Atual ] [ Q Anterior ] [ Ano ]   De: [__] Até: [__] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Adicionar importações, função de presets e botões no UI |

---

### Implementação

#### 1. Adicionar importações do date-fns

```typescript
import { 
  format, startOfYear, endOfYear, endOfDay, differenceInDays, 
  eachMonthOfInterval, addDays, eachDayOfInterval, getMonth, 
  startOfMonth, endOfMonth,
  subMonths,            // ADICIONAR
  startOfQuarter,       // ADICIONAR
  endOfQuarter,         // ADICIONAR
  subQuarters           // ADICIONAR
} from "date-fns";
```

#### 2. Criar função de atalhos de data

Adicionar após a declaração dos estados (`setViewMode`, etc.):

```typescript
// Quick date presets for common periods
const setDatePreset = (preset: 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear') => {
  const today = new Date();
  
  switch (preset) {
    case 'thisMonth':
      setStartDate(startOfMonth(today));
      setEndDate(endOfDay(today));
      break;
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      setStartDate(startOfMonth(lastMonth));
      setEndDate(endOfMonth(lastMonth));
      break;
    case 'thisQuarter':
      setStartDate(startOfQuarter(today));
      setEndDate(endOfDay(today));
      break;
    case 'lastQuarter':
      const lastQuarter = subQuarters(today, 1);
      setStartDate(startOfQuarter(lastQuarter));
      setEndDate(endOfQuarter(lastQuarter));
      break;
    case 'thisYear':
      setStartDate(startOfYear(today));
      setEndDate(endOfDay(today));
      break;
  }
};
```

#### 3. Adicionar botões no UI (antes dos calendários)

Na seção de filtros (aproximadamente linha 2107), antes do `<div className="flex items-center gap-2">` com "De:":

```tsx
{/* Quick date presets */}
<div className="flex gap-1 flex-wrap">
  <Button 
    variant="outline" 
    size="sm" 
    onClick={() => setDatePreset('thisMonth')}
    className="text-xs"
  >
    Este Mês
  </Button>
  <Button 
    variant="outline" 
    size="sm" 
    onClick={() => setDatePreset('lastMonth')}
    className="text-xs"
  >
    Mês Anterior
  </Button>
  <Button 
    variant="outline" 
    size="sm" 
    onClick={() => setDatePreset('thisQuarter')}
    className="text-xs"
  >
    Q Atual
  </Button>
  <Button 
    variant="outline" 
    size="sm" 
    onClick={() => setDatePreset('lastQuarter')}
    className="text-xs"
  >
    Q Anterior
  </Button>
  <Button 
    variant="outline" 
    size="sm" 
    onClick={() => setDatePreset('thisYear')}
    className="text-xs"
  >
    2026
  </Button>
</div>
```

---

### Resultado Visual Esperado

| Botão | Período Resultante (se hoje = 02/02/2026) |
|-------|------------------------------------------|
| Este Mês | 01/02/2026 - 02/02/2026 |
| Mês Anterior | 01/01/2026 - 31/01/2026 |
| Q Atual | 01/01/2026 - 02/02/2026 |
| Q Anterior | 01/10/2025 - 31/12/2025 |
| 2026 | 01/01/2026 - 02/02/2026 |

---

### Impacto

1. **Navegação mais rápida** entre períodos comuns
2. **Consistência** com a aba Mkt Indicadores (que já tem botões similares)
3. **Melhor UX** para análises comparativas (ex: mês anterior vs atual)

