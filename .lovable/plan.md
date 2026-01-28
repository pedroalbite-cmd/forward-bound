

## Plano: Corrigir Mapeamento de Closers por BU

### Contexto

Atualmente, o sistema trata todos os closers (Pedro, Daniel, Lucas) como disponíveis para todas as BUs. Isso está **incorreto**:

| Closer | BUs onde atua |
|--------|---------------|
| **Pedro Albite** | Modelo Atual, Oxy Hacker, Franquia |
| **Daniel Trindade** | Modelo Atual, Oxy Hacker, Franquia |
| **Lucas Ilha** | O2 TAX (exclusivo) |

---

### Problemas Identificados

1. **Banco de dados**: A tabela `closer_metas` tem registros de Pedro e Daniel para O2 TAX (incorreto)
2. **Filtro de closers**: Mostra todos os 3 closers independente das BUs selecionadas
3. **Lógica de meta e realizado**: Aplica filtro de closer mesmo quando o closer não atua na BU

---

### Solução Proposta

#### 1. Limpar Dados Incorretos no Banco

Remover registros de Pedro e Daniel da O2 TAX:

```sql
DELETE FROM closer_metas 
WHERE bu = 'o2_tax' 
  AND closer IN ('Pedro Albite', 'Daniel Trindade')
  AND year = 2026;
```

#### 2. Definir Mapeamento BU → Closers

Adicionar constante que define quais closers atuam em cada BU:

**Arquivo:** `src/hooks/useCloserMetas.ts`

```typescript
// Mapeamento de closers por BU
export const BU_CLOSERS: Record<BuType, readonly CloserType[]> = {
  modelo_atual: ['Pedro Albite', 'Daniel Trindade'],
  o2_tax: ['Lucas Ilha'],
  oxy_hacker: ['Pedro Albite', 'Daniel Trindade'],
  franquia: ['Pedro Albite', 'Daniel Trindade'],
} as const;
```

#### 3. Filtro de Closers Dinâmico

Atualizar `IndicatorsTab.tsx` para mostrar apenas closers relevantes para as BUs selecionadas:

```typescript
// Calcular closers disponíveis baseado nas BUs selecionadas
const availableClosers = useMemo((): MultiSelectOption[] => {
  const closersSet = new Set<string>();
  
  selectedBUs.forEach(bu => {
    const buClosers = BU_CLOSERS[bu] || [];
    buClosers.forEach(closer => closersSet.add(closer));
  });
  
  const allClosers = [
    { value: 'Pedro Albite', label: 'Pedro' },
    { value: 'Daniel Trindade', label: 'Daniel' },
    { value: 'Lucas Ilha', label: 'Lucas' },
  ];
  
  return allClosers.filter(c => closersSet.has(c.value));
}, [selectedBUs]);
```

#### 4. Lógica de Filtro por BU

Atualizar `getRealizedForIndicator` e `getMetaForIndicator` para aplicar filtro de closer apenas quando o closer atua na BU:

```typescript
// Para Modelo Atual - aplicar filtro só se closer selecionado atua na BU
if (includesModeloAtual) {
  const closersForBU = selectedClosers.filter(c => 
    BU_CLOSERS.modelo_atual.includes(c as CloserType)
  );
  
  if (closersForBU.length > 0) {
    // Filtrar por closer
  } else if (selectedClosers.length > 0) {
    // Closer selecionado não atua nesta BU - não contar nada
    total += 0;
  } else {
    // Sem filtro - contar tudo
    total += getModeloAtualQty(...);
  }
}

// Para O2 TAX - aplicar filtro só se Lucas está selecionado
if (includesO2Tax) {
  const closersForBU = selectedClosers.filter(c => 
    BU_CLOSERS.o2_tax.includes(c as CloserType)
  );
  
  if (closersForBU.length > 0) {
    // Filtrar por Lucas
  } else if (selectedClosers.length > 0) {
    // Pedro ou Daniel selecionados - não contar O2 TAX
    total += 0;
  } else {
    // Sem filtro - contar tudo
    total += getO2TaxQty(...);
  }
}
```

#### 5. Limpar Seleção ao Mudar BU

Quando as BUs selecionadas mudam, limpar closers que não atuam nas novas BUs:

```typescript
useEffect(() => {
  const validClosers = selectedClosers.filter(closer => {
    return selectedBUs.some(bu => BU_CLOSERS[bu]?.includes(closer as CloserType));
  });
  
  if (validClosers.length !== selectedClosers.length) {
    setSelectedClosers(validClosers);
  }
}, [selectedBUs]);
```

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useCloserMetas.ts` | Modificar | Adicionar constante `BU_CLOSERS` com mapeamento |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Filtro dinâmico de closers + lógica de aplicação por BU |
| `src/components/planning/CloserMetasTab.tsx` | Modificar | Mostrar apenas closers válidos para a BU selecionada |
| **Banco de dados** | SQL | Remover registros incorretos (Pedro/Daniel na O2 TAX) |

---

### Comportamento Esperado

| Cenário | Closers no Filtro | Resultado |
|---------|-------------------|-----------|
| Só **Modelo Atual** selecionado | Pedro, Daniel | Filtra por closer selecionado |
| Só **O2 TAX** selecionado | Lucas | Filtra por Lucas |
| **Consolidado** (todas BUs) | Pedro, Daniel, Lucas | Filtra dados de cada BU pelo closer que atua nela |
| Modelo Atual + O2 TAX | Pedro, Daniel, Lucas | Cada BU filtrada pelo closer que atua nela |
| Seleciona **Lucas** com Modelo Atual | Lucas aparece mas não tem dados | Modelo Atual mostra 0 |

---

### Resumo Visual

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  ANTES                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ Pedro        │  │ Daniel       │  │ Lucas        │  (sempre visíveis)│
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
├─────────────────────────────────────────────────────────────────────────┤
│  DEPOIS                                                                  │
│                                                                          │
│  BU Selecionada: Modelo Atual                                           │
│  ┌──────────────┐  ┌──────────────┐                                     │
│  │ Pedro        │  │ Daniel       │  (Lucas não aparece)                │
│  └──────────────┘  └──────────────┘                                     │
│                                                                          │
│  BU Selecionada: O2 TAX                                                 │
│  ┌──────────────┐                                                        │
│  │ Lucas        │  (Pedro e Daniel não aparecem)                        │
│  └──────────────┘                                                        │
│                                                                          │
│  BU Selecionada: Consolidado                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ Pedro        │  │ Daniel       │  │ Lucas        │  (todos aparecem) │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

