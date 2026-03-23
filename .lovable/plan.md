

## Remover Conclusão Executiva do NPS

### Alterações

**1. `src/components/planning/NpsTab.tsx`**
- Remover import do `ExecutiveSummary`
- Remover `<ExecutiveSummary />` do JSX (dentro do bloco de NPS aberto)

**2. `src/components/planning/nps/ExecutiveSummary.tsx`**
- Deletar o arquivo (não será mais usado)

### Arquivos modificados
- `src/components/planning/NpsTab.tsx` — remover import e uso do componente
- `src/components/planning/nps/ExecutiveSummary.tsx` — deletar

