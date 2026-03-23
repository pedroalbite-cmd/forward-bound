

## Problema

O Dossiê de Churn mostra linhas com quase todas as colunas vazias. Isso acontece porque muitos cards de churn no `pipefy_central_projetos` **não têm uma tratativa correspondente** no `pipefy_moviment_tratativas` (o match é feito por título). Sem tratativa, as colunas Mês do Churn, Motivo Principal, Motivos cancelamento e Data encerramento ficam vazias. Sem data de encerramento, o LT também fica vazio.

## Solução

Filtrar do dossiê as linhas que não têm dados mínimos úteis. Um registro só deve aparecer se tiver **pelo menos** um motivo principal OU uma data de encerramento preenchida.

### Alteração em `src/hooks/useOperationsData.ts`

Na cadeia de `.filter()` (linha 319), adicionar uma segunda condição após o filtro de data:

```typescript
.filter(c => c._refDate >= CHURN_CUTOFF)
.filter(c => c.motivoPrincipal || c.dataEncerramento || c.mesChurn)
.map(({ _refDate, ...rest }) => rest);
```

Isso remove linhas "fantasma" — cards que estão em fase de churn mas não têm nenhuma informação relevante cruzada das tratativas, NPS ou conexões.

### Arquivo modificado
- `src/hooks/useOperationsData.ts` — adicionar filtro de completude na linha 319

