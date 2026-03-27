

## Corrigir filtros NPS que não alteram os indicadores

### Problemas identificados

**1. Filtro de CFO incompleto**: O `cfoMap` (vindo das connections) só contém CFOs de cards NPS que têm conexão com projetos na Central. Porém, `processNpsData` usa um fallback: `cfoMap[id] || card['CFO Responsavel'] || card['Responsavel Tratativa']`. O filtro atual ignora esses fallbacks, então cards com CFO apenas nos campos próprios são excluídos.

**2. Lista de opções do filtro incompleta**: As opções do dropdown de CFO vêm apenas de `Object.values(cfoMap)`, perdendo CFOs que existem apenas nos campos do card. O mesmo vale para Produto.

**3. Filtro de Produto esparso**: O `produtoMap` só mapeia cards via connections. Cards sem conexão não aparecem no filtro, tornando-o pouco útil.

### Solução

Enriquecer os maps no `NpsTab.tsx` com dados dos próprios cards antes de usar nos filtros:

**Arquivo: `src/components/planning/NpsTab.tsx`**

1. No `useMemo` que extrai `produtos` e `cfos` (linhas 46-53):
   - Para CFOs: combinar valores do `cfoMap` + campos `CFO Responsavel` / `Responsavel Tratativa` de cada card no `npsRows`
   - Para Produtos: combinar valores do `produtoMap` + garantir cobertura

2. No `useMemo` do `filteredNpsData` (linhas 56-92):
   - Filtro de CFO: verificar `cfoMap[c.ID]` OU `c['CFO Responsavel']` OU `c['Responsavel Tratativa']` contra os CFOs selecionados (mesmo fallback que `processNpsData` usa)
   - Filtro de Produto: verificar `produtoMap[c.ID]` contra os produtos selecionados

### Mudanças concretas

```typescript
// 1. Extrair opções completas de CFO (map + campos do card)
const { produtos, cfos } = useMemo(() => {
  if (!npsData?.raw) return { produtos: [], cfos: [] };
  const { produtoMap, cfoMap, npsRows } = npsData.raw;
  
  const allCfos = new Set(Object.values(cfoMap));
  npsRows.forEach(c => {
    const cfo = c['CFO Responsavel'] || c['Responsavel Tratativa'];
    if (cfo) allCfos.add(cfo);
  });
  
  return {
    produtos: [...new Set(Object.values(produtoMap))].filter(Boolean).sort(),
    cfos: [...allCfos].filter(Boolean).sort(),
  };
}, [npsData?.raw]);

// 2. Filtro de CFO usando mesma lógica de fallback
if (selectedCfos.length > 0) {
  filtered = filtered.filter(c => {
    const cfo = cfoMap[c.ID] || c['CFO Responsavel'] || c['Responsavel Tratativa'];
    return cfo ? selectedCfos.includes(cfo) : false;
  });
}
```

### Arquivo alterado
- `src/components/planning/NpsTab.tsx` — corrigir lógica dos dois `useMemo` (opções + filtragem)

