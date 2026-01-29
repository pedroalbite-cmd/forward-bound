

## Plano: Corrigir Filtro de SDR nos Indicadores

### Problema Identificado

O filtro de SDR (Amanda, Carol, Carlos) **não está funcionando** nos acelerômetros (radial cards) e gráficos de indicadores. O usuário seleciona um SDR mas os números não mudam.

**Causa raiz**: O filtro de SDR está sendo aplicado **apenas no drill-down** (`getItemsForIndicator`), mas **NÃO nos cálculos de totais** (`getRealizedForIndicator`) que alimentam os acelerômetros.

Atualmente:
- `getRealizedForIndicator`: Aplica filtro de **Closer** ✅, mas **NÃO aplica filtro de SDR** ❌
- `getItemsForIndicator`: Aplica filtro de **Closer** ✅ e filtro de **SDR** ✅ (só no drill-down)

### Solução

Aplicar a lógica de filtro de SDR **também nos cálculos de totais** (`getRealizedForIndicator`), similar ao que é feito com o filtro de Closer.

### Comportamento Esperado Após a Correção

| Cenário | Resultado Esperado |
|---------|-------------------|
| Consolidado + SDR Amanda | Aceleradores mostram totais filtrados apenas para leads gerados por Amanda |
| O2 TAX + SDR Carlos | Aceleradores mostram totais filtrados apenas para leads gerados por Carlos |
| Consolidado + Closer Lucas + SDR Carlos | Aceleradores combinam ambos filtros (BU O2 TAX, closer Lucas, sdr Carlos) |
| Sem filtro de SDR | Aceleradores mostram todos os registros (comportamento atual) |

---

### Seção Técnica

#### 1. Adicionar `effectiveSelectedSDRs` (similar ao effectiveSelectedClosers)

Para manter consistência e evitar problemas quando todos os SDRs estão selecionados:

```typescript
// Tratar "todos SDRs selecionados" como "sem filtro"
const effectiveSelectedSDRs = useMemo(() => {
  if (selectedSDRs.length === 0) return [];
  if (selectedSDRs.length === availableSDRs.length) return []; // All selected = no filter
  return selectedSDRs;
}, [selectedSDRs, availableSDRs]);
```

#### 2. Atualizar `matchesSdrFilter` para usar `effectiveSelectedSDRs`

```typescript
const matchesSdrFilter = (responsavel?: string | null): boolean => {
  if (effectiveSelectedSDRs.length === 0) return true; // No filter = show all
  if (!responsavel) return false;
  return effectiveSelectedSDRs.some(sdr => 
    responsavel.toLowerCase().includes(sdr.toLowerCase())
  );
};
```

#### 3. Refatorar `getRealizedForIndicator` para aplicar filtro de SDR

A função precisa usar `getCardsForIndicator` quando um SDR está selecionado e filtrar pelo campo `responsavel`/`sdr`:

```typescript
const getRealizedForIndicator = (indicator: IndicatorConfig) => {
  let total = 0;
  
  if (includesModeloAtual) {
    const closersForBU = effectiveSelectedClosers.filter(c => 
      BU_CLOSERS.modelo_atual.includes(c as CloserType)
    );
    const sdrsForBU = effectiveSelectedSDRs.filter(s => 
      BU_SDRS.modelo_atual.includes(s)
    );
    
    // Check if this BU should be included based on closer/SDR filters
    const includeByCloser = closersForBU.length > 0 || effectiveSelectedClosers.length === 0;
    const includeBySdr = sdrsForBU.length > 0 || effectiveSelectedSDRs.length === 0;
    
    if (includeByCloser && includeBySdr) {
      // If either filter is active, use card-level filtering
      if (effectiveSelectedClosers.length > 0 || effectiveSelectedSDRs.length > 0) {
        const cards = modeloAtualAnalytics.getCardsForIndicator(indicator.key);
        const filteredCards = cards.filter(card => {
          const matchCloser = effectiveSelectedClosers.length === 0 || matchesCloserFilter(card.closer);
          const matchSdr = effectiveSelectedSDRs.length === 0 || matchesSdrFilter(card.responsavel || card.sdr);
          return matchCloser && matchSdr;
        });
        total += filteredCards.length;
      } else {
        // No filters - use aggregated count
        total += getModeloAtualQty(indicator.key as ModeloAtualIndicator, startDate, endDate);
      }
    }
  }
  
  // Similar logic for O2 TAX, Franquia, Oxy Hacker...
  // (cada BU aplica a mesma lógica combinada de Closer + SDR)
  
  return total;
};
```

#### 4. Ajustar lógica para cada BU

| BU | SDRs Disponíveis | Closers Disponíveis |
|----|------------------|---------------------|
| Modelo Atual | Amanda, Carol | Pedro, Daniel |
| O2 TAX | Carlos | Lucas |
| Oxy Hacker | Amanda, Carol | Pedro, Daniel |
| Franquia | Amanda, Carol | Pedro, Daniel |

Cada BU só será incluída no cálculo se:
1. Nenhum filtro de SDR ativo **OU** pelo menos um SDR selecionado pertence à BU
2. **E** nenhum filtro de Closer ativo **OU** pelo menos um Closer selecionado pertence à BU

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | 1. Adicionar `effectiveSelectedSDRs` <br> 2. Atualizar `matchesSdrFilter` <br> 3. Refatorar `getRealizedForIndicator` para aplicar filtro combinado de Closer + SDR <br> 4. Atualizar `getMetaForIndicator` se necessário para metas filtradas por SDR |

---

### Risco/Impacto

- **Baixo**: Alteração isolada na lógica de filtro do frontend
- **Benefício**: Filtro de SDR funcionará nos acelerômetros e será combinável com outros filtros (BU, Closer, Data)

### Critério de "Feito"

1. Selecionar SDR "Amanda" → aceleradores mostram apenas leads/MQLs gerados por Amanda
2. Selecionar SDR "Carlos" com BU "O2 TAX" → aceleradores mostram dados filtrados por Carlos
3. Combinação de filtros (Closer + SDR) funciona corretamente
4. Drill-down continua funcionando e mostra mesma contagem que o acelerômetro

