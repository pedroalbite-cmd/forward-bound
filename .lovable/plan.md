

## Permitir Seleção Múltipla de Filtros de Período

### Objetivo

Transformar os botões de atalho de período (Este Mês, Mês Anterior, Q Atual, etc.) em um sistema de multi-seleção, onde selecionar múltiplos períodos expande automaticamente o range de datas para cobrir todos os períodos selecionados.

### Comportamento Desejado

| Seleção | Resultado |
|---------|-----------|
| Este Mês | 01/02/2026 - 03/02/2026 (hoje) |
| Mês Anterior | 01/01/2026 - 31/01/2026 |
| Este Mês + Mês Anterior | 01/01/2026 - 03/02/2026 |
| Q Atual + Q Anterior | 01/10/2025 - 03/02/2026 |
| 2026 | 01/01/2026 - 03/02/2026 |

---

### Alterações Técnicas

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/IndicatorsTab.tsx` | Adicionar estado de multi-seleção de períodos e lógica de merge |

---

### 1. Novo Estado para Períodos Selecionados

```typescript
type DatePreset = 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear';

const [selectedPresets, setSelectedPresets] = useState<DatePreset[]>([]);
```

### 2. Função para Calcular Range Combinado

```typescript
const getDateRangeFromPresets = (presets: DatePreset[]): { start: Date; end: Date } => {
  const today = new Date();
  let minStart: Date | null = null;
  let maxEnd: Date | null = null;

  for (const preset of presets) {
    let start: Date, end: Date;
    
    switch (preset) {
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfDay(today);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'thisQuarter':
        start = startOfQuarter(today);
        end = endOfDay(today);
        break;
      case 'lastQuarter':
        const lastQuarter = subQuarters(today, 1);
        start = startOfQuarter(lastQuarter);
        end = endOfQuarter(lastQuarter);
        break;
      case 'thisYear':
        start = startOfYear(today);
        end = endOfDay(today);
        break;
    }

    if (!minStart || start < minStart) minStart = start;
    if (!maxEnd || end > maxEnd) maxEnd = end;
  }

  return {
    start: minStart || startOfMonth(today),
    end: maxEnd || endOfDay(today)
  };
};
```

### 3. Toggle de Seleção de Preset

```typescript
const togglePreset = (preset: DatePreset) => {
  setSelectedPresets(prev => {
    const newPresets = prev.includes(preset)
      ? prev.filter(p => p !== preset)
      : [...prev, preset];
    
    // Atualiza as datas baseado nos presets selecionados
    if (newPresets.length > 0) {
      const { start, end } = getDateRangeFromPresets(newPresets);
      setStartDate(start);
      setEndDate(end);
    }
    
    return newPresets;
  });
};
```

### 4. UI com Botões Toggle (Multi-Select Visual)

```tsx
<div className="flex gap-1 flex-wrap">
  {[
    { key: 'thisMonth', label: 'Este Mês' },
    { key: 'lastMonth', label: 'Mês Anterior' },
    { key: 'thisQuarter', label: 'Q Atual' },
    { key: 'lastQuarter', label: 'Q Anterior' },
    { key: 'thisYear', label: '2026' },
  ].map(({ key, label }) => (
    <Button 
      key={key}
      variant={selectedPresets.includes(key as DatePreset) ? "default" : "outline"}
      size="sm" 
      onClick={() => togglePreset(key as DatePreset)}
      className="text-xs"
    >
      {label}
    </Button>
  ))}
</div>
```

---

### Comportamento Adicional

- Quando o usuário altera manualmente a data via calendário, os presets selecionados são limpos (`setSelectedPresets([])`)
- Botões selecionados terão visual destacado (variant="default" ao invés de "outline")
- Selecionar "2026" sozinho cobre todo o ano, então combinar com outros presets não altera o range (2026 já é o maior)

---

### Resultado Visual

Os botões de período funcionarão como chips toggle:
- **Não selecionado**: borda outline, fundo transparente
- **Selecionado**: fundo primário, texto branco

O usuário poderá clicar em múltiplos botões e o range de datas se expandirá automaticamente para cobrir todos os períodos.

