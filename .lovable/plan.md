
# Fix: MQL = Leads para BUs de Expansao (Oxy Hacker e Franquia)

## Problema

O `useExpansaoAnalytics.ts` exclui cards com fase "Start form" da contagem de MQL (linha 290). Como a maioria dos cards do Oxy Hacker entra pela fase "Start form" e nunca passa por uma fase chamada "Lead" ou "MQL" no banco de movements, apenas 3 de 31 cards aparecem como MQL.

## Solucao

### Arquivo: `src/hooks/useExpansaoAnalytics.ts`

**Remover a exclusao de "Start form" na contagem de MQL** (linha 290):

Antes:
```typescript
// For MQL, exclude cards whose phase is "Start form"
if (indicator === 'mql' && firstEntry.fase === 'Start form') continue;
```

Depois: remover essa linha. Como este hook so e usado para Franquia e Oxy Hacker, e o usuario confirmou que MQL = Leads para essas BUs, nao ha necessidade de excluir "Start form".

Isso fara com que `getCardsForIndicator('mql')` retorne os mesmos cards que `getCardsForIndicator('leads')`, resultando em 21 MQLs (igual ao numero de Leads mostrado nos logs).

### Arquivo: `src/hooks/useExpansaoAnalytics.ts` (funcao `getDetailItemsWithFullHistory`)

Tambem remover o filtro de MQL na linha 400-401 que exclui Start form no modo cohort:

Antes:
```typescript
if (indicator === 'mql' && (m.fase === 'Lead' || m.fase === 'MQL')) return true;
```

Depois: para MQL, aceitar qualquer fase que mapeie para 'leads' ou 'mql':
```typescript
if (indicator === 'mql') return true; // aceitar leads + mql (ja filtrado acima)
```

Nenhum outro arquivo precisa ser alterado. O `useOxyHackerMetas.ts` ja tem a logica correta (leads inclui 'leads' + 'mql', e MQL inclui apenas 'mql' - que captura fase 'Lead' e 'MQL').

## Resultado esperado

- **Leads Oxy Hacker**: 21 (todos os cards no periodo)
- **MQLs Oxy Hacker**: 21 (iguais aos leads, sem exclusao de Start form)
- Os 6 cards do XLSX estarao incluidos nos MQLs
