

## Plano: Alterar Comportamento de Seleção no MultiSelect

### Contexto

Atualmente, quando todas as BUs estão selecionadas no filtro de Indicadores, clicar em "Modelo Atual" **remove** o Modelo Atual da seleção (deixando O2 TAX, Oxy Hacker, Franquia selecionados).

O comportamento desejado é: quando todas estão selecionadas e você clica em uma BU, deve **selecionar APENAS aquela BU**.

---

### Regra de Negócio

| Situação Atual | Clique em "Modelo Atual" | Resultado Esperado |
|----------------|--------------------------|-------------------|
| Todas selecionadas | Toggle tradicional → Remove | **Seleciona apenas Modelo Atual** |
| Algumas selecionadas | Toggle tradicional | Toggle tradicional (mantém) |
| Uma selecionada | Toggle tradicional | Toggle tradicional (mantém) |

---

### Solução

Modificar a função `handleToggleOption` no componente `MultiSelect` para verificar se **todas as opções estão selecionadas**. Nesse caso, ao clicar em uma opção, seleciona **apenas** ela.

#### Arquivo: `src/components/ui/multi-select.tsx`

**Lógica atual (linhas 43-48):**
```typescript
const handleToggleOption = (value: string) => {
  if (selected.includes(value)) {
    onSelectionChange(selected.filter((v) => v !== value));
  } else {
    onSelectionChange([...selected, value]);
  }
};
```

**Nova lógica:**
```typescript
const handleToggleOption = (value: string) => {
  // Se todos estão selecionados, clicar em um item seleciona APENAS ele
  if (allSelected) {
    onSelectionChange([value]);
    return;
  }
  
  // Comportamento normal de toggle
  if (selected.includes(value)) {
    onSelectionChange(selected.filter((v) => v !== value));
  } else {
    onSelectionChange([...selected, value]);
  }
};
```

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/ui/multi-select.tsx` | Atualizar `handleToggleOption` para seleção exclusiva quando todos selecionados |

---

### Fluxo de Uso Após Alteração

1. **Usuário entra na página** → Todas as 4 BUs estão selecionadas (Consolidado)
2. **Clica em "Modelo Atual"** → Seleciona APENAS Modelo Atual
3. **Clica em "O2 TAX"** → Adiciona O2 TAX à seleção (toggle normal)
4. **Clica em "Consolidado"** → Volta para todas selecionadas
5. **Clica em "Franquia"** → Seleciona APENAS Franquia (pois estava com todas)

