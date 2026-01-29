
## Plano: Adicionar Filtro de SDR na Aba Indicadores

### Contexto Atual

A aba **Indicadores** já possui:
- ✅ Filtro de **BUs** (Consolidado, Modelo Atual, O2 TAX, etc.) usando `MultiSelect`
- ✅ Filtro de **Closers** (Pedro, Daniel, Lucas) usando `MultiSelect`
- ✅ Dados de **SDR responsável** já sendo extraídos pelo hook `useModeloAtualAnalytics`
- ✅ Campo `responsavel` nos cards já contém o nome do SDR

**O que está faltando:**
- ❌ Um **MultiSelect** separado para filtrar por SDR
- ❌ Lista de **SDRs disponíveis** baseada nos dados reais
- ❌ Lógica para **aplicar o filtro de SDR** nos dados exibidos

---

### Estrutura Visual Proposta

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  Visão Meta Pace                                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Consolidado ▾ │  │ Todos Closers▾│  │ Todos SDRs  ▾ │  │De: 01/01 │  │Até: 29/01│       │
│  └───────────────┘  └───────────────┘  └───────────────┘  └──────────┘  └──────────┘       │
│                                                                                             │
│  Período: 29 dias | Agrupamento: Diário                                                     │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### SDRs Conhecidos (Baseado na Memória do Sistema)

| SDR | BUs Onde Atuam |
|-----|----------------|
| **Amanda** | Modelo Atual |
| **Carol** | Modelo Atual |
| **Carlos** | O2 TAX |

---

### Seção Técnica

#### Alterações no Arquivo `src/components/planning/IndicatorsTab.tsx`

| Item | Alteração |
|------|-----------|
| **Estado** | Adicionar `selectedSDRs: string[]` similar a `selectedClosers` |
| **Constante** | Definir `sdrOptions: MultiSelectOption[]` com Amanda, Carol, Carlos |
| **Mapeamento BU→SDR** | Definir `BU_SDRS` análogo a `BU_CLOSERS` |
| **useMemo** | Calcular `availableSDRs` baseado nas BUs selecionadas |
| **useEffect** | Limpar SDRs selecionados quando BU muda (como já faz com closers) |
| **Filtro** | Criar função `matchesSdrFilter()` similar a `matchesCloserFilter()` |
| **UI** | Adicionar novo `MultiSelect` para SDRs após o de Closers |
| **getItemsForIndicator** | Aplicar filtro de SDR junto com filtro de Closer |

#### Constantes a Adicionar

```typescript
// Mapeamento de SDRs por BU
const BU_SDRS: Record<BuType, string[]> = {
  modelo_atual: ['Amanda', 'Carol'],
  o2_tax: ['Carlos'],
  oxy_hacker: ['Amanda', 'Carol'], // Compartilha com Modelo Atual
  franquia: ['Amanda', 'Carol'],   // Compartilha com Modelo Atual
};

// Opções de SDRs para o MultiSelect
const sdrOptions: MultiSelectOption[] = [
  { value: 'Amanda', label: 'Amanda' },
  { value: 'Carol', label: 'Carol' },
  { value: 'Carlos', label: 'Carlos' },
];
```

#### Lógica de Filtro

```typescript
// Estado para SDRs selecionados
const [selectedSDRs, setSelectedSDRs] = useState<string[]>([]);

// Calcular SDRs disponíveis baseado nas BUs selecionadas
const availableSDRs: MultiSelectOption[] = useMemo(() => {
  const sdrsSet = new Set<string>();
  
  selectedBUs.forEach(bu => {
    const buSdrs = BU_SDRS[bu as BuType] || [];
    buSdrs.forEach(sdr => sdrsSet.add(sdr));
  });
  
  return sdrOptions.filter(s => sdrsSet.has(s.value));
}, [selectedBUs]);

// Função de filtro
const matchesSdrFilter = (responsavel?: string | null): boolean => {
  if (selectedSDRs.length === 0) return true;
  if (!responsavel) return false;
  // Match parcial: se o nome do responsável CONTÉM um dos SDRs selecionados
  return selectedSDRs.some(sdr => 
    responsavel.toLowerCase().includes(sdr.toLowerCase())
  );
};

// Aplicar filtro em getItemsForIndicator
const getItemsForIndicator = (indicatorKey: IndicatorType): DetailItem[] => {
  let items: DetailItem[] = [];
  // ... agregação de BUs ...
  
  // Aplicar filtro de Closer
  if (selectedClosers.length > 0) {
    items = items.filter(item => matchesCloserFilter(item.closer));
  }
  
  // Aplicar filtro de SDR (NOVO)
  if (selectedSDRs.length > 0) {
    items = items.filter(item => matchesSdrFilter(item.responsible));
  }
  
  return items;
};
```

#### Componente UI

```typescript
{availableSDRs.length > 0 && (
  <MultiSelect
    options={availableSDRs}
    selected={selectedSDRs}
    onSelectionChange={setSelectedSDRs}
    placeholder="Todos SDRs"
    allLabel="Todos SDRs"
    className="w-44"
  />
)}
```

---

### Fluxo de Implementação

1. **Adicionar constantes** - `BU_SDRS` e `sdrOptions` no início do componente
2. **Adicionar estado** - `selectedSDRs` com `useState`
3. **Calcular SDRs disponíveis** - `useMemo` baseado em `selectedBUs`
4. **Limpar SDRs inválidos** - `useEffect` quando BU muda
5. **Criar função de filtro** - `matchesSdrFilter()`
6. **Atualizar getItemsForIndicator** - Aplicar ambos os filtros
7. **Adicionar UI** - Novo `MultiSelect` na barra de filtros

---

### Considerações Importantes

- O filtro de SDR afeta **MQLs e etapas anteriores** (onde SDR é o responsável)
- O filtro de Closer afeta **RM e etapas posteriores** (onde Closer é o responsável)
- Ambos os filtros podem ser usados simultaneamente
- A lógica de match usa `includes()` para ser flexível com variações de nome

---

### Próximos Passos

1. ✅ Implementar filtro de SDR
2. 🔜 Opcionalmente, extrair lista de SDRs dinamicamente dos dados
3. 🔜 Considerar ajuste de metas por SDR (similar ao que existe para Closers)
