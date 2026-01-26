
## Plano: Adicionar Filtro por Closer e Multi-Seleção de BUs

### Objetivo

1. **Filtro por Closer/Responsável**: Permitir filtrar todos os indicadores por um ou mais responsáveis (Closers/SDRs)
2. **Multi-seleção de BUs**: Permitir selecionar múltiplas BUs simultaneamente (ex: Franquia + Oxy Hacker)

---

### Arquitetura da Solução

```text
+--------------------------------------------------+
|  IndicatorsTab - Filtros                         |
+--------------------------------------------------+
|  [Multi-Select BU]  [Multi-Select Closer]        |
|  [x] Consolidado    [x] João Silva               |
|  [ ] Modelo Atual   [x] Maria Santos             |
|  [x] Franquia       [ ] Pedro Costa              |
|  [x] Oxy Hacker     ...                          |
+--------------------------------------------------+
                    ↓
    Propaga selectedBUs[] e selectedClosers[]
    para todos os hooks e componentes filhos
```

---

### Arquivos a Criar/Modificar

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/ui/multi-select.tsx` | Criar | Componente de multi-seleção reutilizável com checkboxes |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Substituir Select por Multi-Select para BUs, adicionar filtro de Closers |
| `src/hooks/useModeloAtualMetas.ts` | Modificar | Adicionar parâmetro de filtro por responsável |
| `src/hooks/useModeloAtualAnalytics.ts` | Modificar | Adicionar parâmetro de filtro por responsável |
| `src/hooks/useO2TaxMetas.ts` | Modificar | Adicionar parâmetro de filtro por responsável |
| `src/hooks/useO2TaxAnalytics.ts` | Modificar | Adicionar parâmetro de filtro por responsável |
| `src/hooks/useExpansaoMetas.ts` | Modificar | Adicionar parâmetro de filtro por responsável |
| `src/hooks/useExpansaoAnalytics.ts` | Modificar | Adicionar parâmetro de filtro por responsável |
| `src/hooks/useOxyHackerMetas.ts` | Modificar | Adicionar parâmetro de filtro por responsável |
| `src/components/planning/ClickableFunnelChart.tsx` | Modificar | Receber e aplicar filtros de BU[] e Closer[] |
| `src/components/planning/LeadsMqlsStackedChart.tsx` | Modificar | Receber e aplicar filtros de BU[] e Closer[] |
| `src/components/planning/LeadsStackedChart.tsx` | Modificar | Receber e aplicar filtros de BU[] e Closer[] |

---

### Componente MultiSelect (Novo)

Criar um componente de Popover com checkboxes para seleção múltipla:

```typescript
// src/components/ui/multi-select.tsx
interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  allLabel?: string; // Label para "Todos"
}

// Exibe: "2 selecionados" ou "Todos" ou "João, Maria"
```

**Comportamento:**
- Checkbox "Todos" que seleciona/deseleciona tudo
- Checkboxes individuais para cada opção
- Exibe quantidade selecionada no trigger

---

### Mudança 1: IndicatorsTab.tsx - Estado e Filtros

**Estado atual:**
```typescript
const [selectedBU, setSelectedBU] = useState<FilterBU>('all');
```

**Novo estado:**
```typescript
const [selectedBUs, setSelectedBUs] = useState<BUType[]>(['modelo_atual', 'o2_tax', 'oxy_hacker', 'franquia']);
const [selectedClosers, setSelectedClosers] = useState<string[]>([]); // Vazio = todos

// Flag para saber se é consolidado (todas as BUs selecionadas)
const isConsolidado = selectedBUs.length === 4;
```

**Novo hook para extrair lista de Closers:**
```typescript
// Extrair closers únicos dos dados carregados
const availableClosers = useMemo(() => {
  const closersSet = new Set<string>();
  
  // Modelo Atual
  modeloAtualAnalytics.cards?.forEach(c => {
    if (c.responsavel) closersSet.add(c.responsavel);
  });
  
  // O2 TAX, Franquia, Oxy Hacker - mesmo padrão
  
  return Array.from(closersSet).sort();
}, [modeloAtualAnalytics.cards, o2TaxAnalytics, franquiaAnalytics, oxyHackerAnalytics]);
```

---

### Mudança 2: Hooks - Adicionar Filtro por Responsável

Cada hook receberá um parâmetro opcional `filterByClosers?: string[]`:

```typescript
// useModeloAtualMetas.ts
export function useModeloAtualMetas(
  startDate?: Date, 
  endDate?: Date,
  filterByClosers?: string[] // NOVO
) {
  // ...
  
  const getQtyForPeriod = (indicator: ModeloAtualIndicator, start?: Date, end?: Date): number => {
    // ...
    for (const movement of movements) {
      // NOVO: Filtrar por closer se especificado
      if (filterByClosers?.length && !filterByClosers.includes(movement.responsavel)) {
        continue;
      }
      // resto da lógica...
    }
  };
}
```

**Nota**: A filtragem é feita client-side nos dados já carregados, não requer nova chamada à API.

---

### Mudança 3: Propagação para Componentes Filhos

Os componentes de gráficos receberão arrays ao invés de valores únicos:

```typescript
// Antes
<LeadsMqlsStackedChart 
  startDate={startDate} 
  endDate={endDate} 
  selectedBU={selectedBU} 
/>

// Depois
<LeadsMqlsStackedChart 
  startDate={startDate} 
  endDate={endDate} 
  selectedBUs={selectedBUs}
  selectedClosers={selectedClosers}
/>
```

---

### Mudança 4: Lógica de Agregação com Multi-Seleção

Quando múltiplas BUs estão selecionadas, o sistema soma os dados de cada uma:

```typescript
// getRealizedForIndicator - Exemplo com multi-seleção
const getRealizedForIndicator = (indicator: IndicatorConfig) => {
  let total = 0;
  
  if (selectedBUs.includes('modelo_atual')) {
    total += getModeloAtualQty(indicator.key, startDate, endDate);
  }
  if (selectedBUs.includes('o2_tax')) {
    total += getO2TaxQty(indicator.key, startDate, endDate);
  }
  if (selectedBUs.includes('oxy_hacker')) {
    total += getOxyHackerQty(indicator.key, startDate, endDate);
  }
  if (selectedBUs.includes('franquia')) {
    total += getExpansaoQty(indicator.key, startDate, endDate);
  }
  
  return total;
};
```

---

### UI dos Filtros

```text
+---------------------------------------------------------------+
| Visão Meta Pace                                               |
|                                                               |
| BUs: [▼ 4 BUs selecionadas ]  Closers: [▼ Todos (12) ]       |
|                                                               |
| De: [01/01/2026]  Até: [26/01/2026]  [🔄 Sincronizar]        |
+---------------------------------------------------------------+
```

**Popover de BUs:**
```text
+------------------------+
| [x] Modelo Atual       |
| [x] O2 TAX             |
| [x] Oxy Hacker         |
| [x] Franquia           |
+------------------------+
```

**Popover de Closers:**
```text
+------------------------+
| [x] Todos              |
|------------------------|
| [x] João Silva         |
| [x] Maria Santos       |
| [ ] Pedro Costa        |
| [x] Ana Oliveira       |
+------------------------+
```

---

### Impacto e Complexidade

| Aspecto | Detalhes |
|---------|----------|
| Arquivos novos | 1 (`multi-select.tsx`) |
| Arquivos modificados | ~10 |
| Linhas estimadas | ~200-300 |
| Risco | Médio (mudança de interface de props em vários componentes) |
| Performance | Sem impacto (filtragem client-side) |

---

### Sequência de Implementação

1. Criar componente `MultiSelect`
2. Modificar `IndicatorsTab` para usar multi-seleção de BUs
3. Adicionar extração de lista de Closers disponíveis
4. Adicionar filtro de Closers ao `IndicatorsTab`
5. Propagar parâmetros para hooks de metas
6. Propagar parâmetros para componentes de gráficos
7. Propagar parâmetros para componentes de funil
8. Testar combinações de filtros
