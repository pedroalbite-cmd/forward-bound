
# Correcao: Loop infinito impedindo a pagina de carregar

## Problema

A pagina esta travada em loading infinito. O console mostra "Maximum update depth exceeded" no `PlanGrowthDataLoader`.

### Causa raiz

No `MediaMetasContext.tsx`, a funcao `handleSetMetas` eh criada inline (sem `useCallback`), gerando uma nova referencia a cada render. Como `setMetasPorBU` (que eh `handleSetMetas`) esta nas dependencias do `useEffect` em `usePlanGrowthData.ts` (linha 493), o efeito dispara a cada render, causando loop infinito:

```text
useEffect dispara -> setMetasPorBU (handleSetMetas) -> setIsLoaded(true) -> re-render do context
-> handleSetMetas ganha nova referencia -> useEffect detecta mudanca na dep -> dispara de novo -> loop
```

## Solucao

### Arquivo 1: `src/contexts/MediaMetasContext.tsx`

Envolver `handleSetMetas` e `setFunnelData` em `useCallback` para que mantenham referencia estavel entre renders:

```typescript
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const handleSetMetas = useCallback((metas: MediaMetasState) => {
  setMetasPorBU(metas);
  setIsLoaded(true);
}, []);

// setFunnelData ja eh um setState puro, entao eh estavel por padrao - nao precisa de mudanca
```

### Arquivo 2: `src/hooks/usePlanGrowthData.ts`

Remover `setMetasPorBU`, `setFunnelData` e `isLoaded` das dependencias do useEffect (linha 493), pois state setters sao estaveis e `isLoaded` nao eh usado dentro do efeito:

```typescript
}, [modeloAtualFunnel, o2TaxFunnel, oxyHackerFunnel, franquiaFunnel]);
```

## Resultado esperado

1. A pagina carrega normalmente sem loop infinito
2. O usuario consegue navegar ate a aba Plan Growth
3. A barra flutuante com "Salvar Todas" aparece ao editar valores
