
# Plano: Corrigir Erro "Should have a queue" no React

## Problema Identificado

O erro "Should have a queue. This is likely a bug in React" está ocorrendo no hook `useO2TaxAnalytics` durante a chamada ao `useQuery` do React Query.

### Causa Raiz

O erro acontece devido a uma **instabilidade no `queryKey`** causada pela forma como as datas são convertidas para string:

```typescript
queryKey: ['o2tax-movements-analytics', startDate.toISOString(), endDate.toISOString()]
```

**Problema**: Quando o componente renderiza rapidamente (especialmente com Hot Module Replacement - HMR), o React Query pode perder a sincronização entre o estado interno e o cache. Isso é agravado porque:

1. O hook recebe objetos `Date` como parâmetros
2. `.toISOString()` é chamado **dentro do hook** a cada render
3. Isso pode causar comparações de referência inconsistentes

### Solução

Estabilizar o `queryKey` usando valores primitivos calculados **fora** do hook ou usando `useMemo` para garantir estabilidade.

## Arquivos a Modificar

### 1. `src/hooks/useO2TaxAnalytics.ts`

```text
Mudanças (linhas 84-139):

ANTES:
export function useO2TaxAnalytics(startDate: Date, endDate: Date) {
  const startTime = new Date(...).getTime();
  const endTime = new Date(...).getTime();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['o2tax-movements-analytics', startDate.toISOString(), endDate.toISOString()],
    ...
  });
}

DEPOIS:
export function useO2TaxAnalytics(startDate: Date, endDate: Date) {
  // Memoizar strings de data para evitar recálculo a cada render
  const startDateStr = useMemo(() => startDate.toISOString().split('T')[0], [startDate.getTime()]);
  const endDateStr = useMemo(() => endDate.toISOString().split('T')[0], [endDate.getTime()]);
  
  const startTime = useMemo(() => 
    new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime(), 
    [startDate.getTime()]
  );
  const endTime = useMemo(() => 
    new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime(), 
    [endDate.getTime()]
  );
  
  // Usar strings de data (YYYY-MM-DD) em vez de ISO completo
  // Isso evita problemas com timezone e milissegundos
  const { data, isLoading, error } = useQuery({
    queryKey: ['o2tax-movements-analytics', startDateStr, endDateStr],
    ...
  });
}
```

### 2. `src/hooks/useModeloAtualAnalytics.ts`

Aplicar a mesma correção para consistência e prevenção de erros similares:

```text
Mudanças (linhas 95-100):

ANTES:
export function useModeloAtualAnalytics(startDate: Date, endDate: Date) {
  const startTime = new Date(...).getTime();
  const endTime = new Date(...).getTime();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['modelo-atual-analytics', startDate.toISOString(), endDate.toISOString()],
    ...
  });
}

DEPOIS:
export function useModeloAtualAnalytics(startDate: Date, endDate: Date) {
  const startDateStr = useMemo(() => startDate.toISOString().split('T')[0], [startDate.getTime()]);
  const endDateStr = useMemo(() => endDate.toISOString().split('T')[0], [endDate.getTime()]);
  
  const startTime = useMemo(() => 
    new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime(), 
    [startDate.getTime()]
  );
  const endTime = useMemo(() => 
    new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime(), 
    [endDate.getTime()]
  );
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['modelo-atual-analytics', startDateStr, endDateStr],
    ...
  });
}
```

## Por Que Esta Solução Funciona

1. **useMemo com getTime()**: Usa o timestamp numérico como dependência, que é um valor primitivo estável
2. **Data simplificada (YYYY-MM-DD)**: Remove timezone e milissegundos que podem variar entre renders
3. **Cálculos memoizados**: `startTime` e `endTime` só recalculam quando a data realmente muda
4. **Consistência**: Ambos os hooks de analytics usam a mesma estratégia

## Impacto

- O erro "Should have a queue" não deve mais ocorrer
- O cache do React Query será mais eficiente (menos cache misses)
- A performance geral do componente deve melhorar levemente

## Notas Técnicas

Este é um bug conhecido que pode ocorrer em cenários específicos:
- Hot Module Replacement (HMR) durante desenvolvimento
- Renders muito rápidos com mudanças de estado
- Instabilidade no queryKey do React Query

A memoização das dependências resolve o problema ao garantir referências estáveis.
