
## Plano: Adicionar Ordenação nas Colunas do DetailSheet

### Contexto

O usuário deseja que todas as colunas da tabela de drill-down (DetailSheet) sejam clicáveis para ordenar os dados. O comportamento esperado é:

1. **Primeiro clique**: Ordem decrescente
2. **Segundo clique**: Ordem crescente  
3. **Terceiro clique**: Volta ao normal (sem ordenação)

---

### Solução Proposta

Adicionar estado de ordenação e lógica de sorting no componente `DetailSheet`.

#### Implementação

**Arquivo:** `src/components/planning/indicators/DetailSheet.tsx`

```typescript
import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// Tipo para controle de ordenação
type SortDirection = 'none' | 'desc' | 'asc';

interface SortState {
  column: keyof DetailItem | null;
  direction: SortDirection;
}

export function DetailSheet({ open, onOpenChange, title, description, items, columns }: DetailSheetProps) {
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: 'none' });

  // Função para alternar ordenação
  const handleSort = (columnKey: keyof DetailItem) => {
    setSortState(prev => {
      if (prev.column !== columnKey) {
        return { column: columnKey, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { column: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: null, direction: 'none' };
      }
      return { column: columnKey, direction: 'desc' };
    });
  };

  // Items ordenados
  const sortedItems = useMemo(() => {
    if (!sortState.column || sortState.direction === 'none') {
      return items;
    }

    return [...items].sort((a, b) => {
      const aVal = a[sortState.column!];
      const bVal = b[sortState.column!];

      // Tratamento de valores nulos
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Comparação por tipo
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal, 'pt-BR');
      } else {
        comparison = String(aVal).localeCompare(String(bVal), 'pt-BR');
      }

      return sortState.direction === 'desc' ? -comparison : comparison;
    });
  }, [items, sortState]);

  // Reset ao fechar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSortState({ column: null, direction: 'none' });
    }
    onOpenChange(open);
  };

  // Ícone de ordenação
  const getSortIcon = (columnKey: keyof DetailItem) => {
    if (sortState.column !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    if (sortState.direction === 'desc') {
      return <ArrowDown className="h-3 w-3 ml-1" />;
    }
    return <ArrowUp className="h-3 w-3 ml-1" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* ... resto do código ... */}
      <TableHead 
        key={col.key}
        className="cursor-pointer hover:bg-muted/50 select-none"
        onClick={() => handleSort(col.key)}
      >
        <div className="flex items-center">
          {col.label}
          {getSortIcon(col.key)}
        </div>
      </TableHead>
      {/* ... usar sortedItems ao invés de items ... */}
    </Dialog>
  );
}
```

---

### Detalhes Técnicos

| Aspecto | Implementação |
|---------|---------------|
| **Estado** | `useState` para armazenar coluna ativa e direção |
| **Ordenação** | `useMemo` para performance, evita re-sort desnecessário |
| **Tipos de dados** | Números comparados numericamente, strings com `localeCompare('pt-BR')` |
| **Valores nulos** | Sempre ficam no final da lista |
| **Reset** | Ao fechar o modal, ordenação volta ao estado inicial |
| **Indicadores visuais** | `ArrowUpDown` (inativo), `ArrowDown` (desc), `ArrowUp` (asc) |

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planning/indicators/DetailSheet.tsx` | Adicionar estado e lógica de ordenação |

---

### Resultado Esperado

Os cabeçalhos das colunas terão:
- Cursor pointer e hover effect indicando que são clicáveis
- Ícone de setas mostrando estado da ordenação
- Ciclo de 3 estados: Decrescente → Crescente → Normal
