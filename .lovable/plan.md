

## Plano: Filtro de Closer com Apenas Pedro e Daniel

### Objetivo

Substituir a extração dinâmica de closers por uma lista fixa contendo apenas:
- **Pedro**
- **Daniel**

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/IndicatorsTab.tsx` | Substituir `availableClosers` dinâmico por lista fixa |

---

### Mudança Técnica

**Linhas 191-229** - Substituir o `useMemo` por constante fixa:

```typescript
// ANTES (extração dinâmica)
const availableClosers = useMemo((): MultiSelectOption[] => {
  const closersSet = new Set<string>();
  
  // Modelo Atual
  if (selectedBUs.includes('modelo_atual')) {
    modeloAtualAnalytics.cards?.forEach(c => {
      if (c.responsavel) closersSet.add(c.responsavel);
    });
  }
  // ... lógica complexa de extração
  
  return Array.from(closersSet)
    .filter(Boolean)
    .sort()
    .map(c => ({ value: c, label: c }));
}, [modeloAtualAnalytics.cards, ...]);

// DEPOIS (lista fixa)
const availableClosers: MultiSelectOption[] = [
  { value: 'Pedro', label: 'Pedro' },
  { value: 'Daniel', label: 'Daniel' },
];
```

---

### Resultado

O dropdown de Closers mostrará apenas:
- [ ] Todos
- [ ] Pedro
- [ ] Daniel

E filtrará os dados com base nesses nomes exatos.

---

### Observação

Se os nomes nos dados do Pipefy forem diferentes (ex: "Pedro Albite" ou "Daniel Trindade"), precisarei ajustar os valores para corresponder exatamente. Me avise se precisar verificar os nomes exatos nos dados.

