

## Correção: Sincronizar Admin Metas Monetárias com Controle Metas

### Problema Identificado

O "Controle Metas" (SalesGoalsTab) usa valores do `MediaMetasContext` que são calculados uma única vez na inicialização. Quando você edita valores no "Admin Metas Monetárias", o banco `monetary_metas` é atualizado, mas:

1. O hook `usePlanGrowthData` verifica `if (isLoaded) return;` e não reprocessa os dados
2. O contexto mantém os valores antigos até recarregar a página

| Fluxo Atual | Problema |
|-------------|----------|
| Usuário edita Admin Metas | Banco atualiza corretamente |
| `usePlanGrowthData` verifica `isLoaded` | Retorna sem atualizar o contexto |
| Controle Metas mostra valores antigos | Não reflete a edição |

---

### Solução

Remover a condição `if (isLoaded) return;` do hook `usePlanGrowthData` para que os dados do contexto sejam **sempre recalculados** quando os dados do banco mudarem.

Também preciso garantir que o `useMonetaryMetas` force atualização quando dados mudam no Admin.

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/usePlanGrowthData.ts` | MODIFICAR | Remover condição `isLoaded` que impede atualização |

---

### Mudança no Código

**Arquivo: `src/hooks/usePlanGrowthData.ts`**

**Antes (linhas 422-423):**
```typescript
useEffect(() => {
  if (isLoaded) return; // Skip if MediaInvestmentTab already loaded the data
```

**Depois:**
```typescript
useEffect(() => {
  // Sempre atualizar o contexto quando os dados mudam
  // (permite que edições no Admin reflitam no Controle Metas)
```

A remoção do `if (isLoaded) return;` permitirá que o `useEffect` rode sempre que os dados do funil mudarem (que acontece quando `useMonetaryMetas` retorna novos dados após invalidação do cache).

---

### Resultado Esperado

1. Editar um valor no Admin Metas Monetárias
2. O `useMonetaryMetas` invalida o cache e refetch os dados
3. O `usePlanGrowthData` recalcula os funnels com os novos dados
4. O `useEffect` atualiza o `MediaMetasContext`
5. O `SalesGoalsTab` recebe os novos valores e re-renderiza

---

### Fluxo de Dados Corrigido

```text
Admin Metas Monetárias
        |
        v
monetary_metas (banco)
        |
        v
useMonetaryMetas (invalidateQueries)
        |
        v
usePlanGrowthData (recalcula funnels)
        |
        v
MediaMetasContext (setMetasPorBU)
        |
        v
SalesGoalsTab (metasPorBU atualizado)
```

