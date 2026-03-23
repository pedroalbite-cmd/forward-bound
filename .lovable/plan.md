

## Corrigir CFO ausente nas Rotinas usando fallback do Central de Projetos

### Problema

Muitos cards de `pipefy_moviment_rotinas` têm `CFO Responsavel` como `null`, gerando vários registros "Sem CFO" na tabela de performance. Porém, o CFO está presente em `pipefy_central_projetos` (campo `CFO Responsavel` ou `Responsavel`).

### Solução

Criar um mapa de fallback título → CFO a partir de `pipefy_central_projetos` e usá-lo em `processRotinas` quando o campo `CFO Responsavel` estiver vazio. Mesma abordagem já usada para cruzar ERP no setup.

### Alterações

**Arquivo**: `src/hooks/useOperationsData.ts`

1. Alterar assinatura de `processRotinas` para receber `projetos: ProjectCard[]` como segundo parâmetro
2. Construir mapa `titulo → CFO` a partir dos projetos (usando `CFO Responsavel` com fallback para `Responsavel`)
3. Na linha 365, ao invés de `card['CFO Responsavel'] || 'Sem CFO'`, fazer:
   ```
   card['CFO Responsavel'] || cfoMap.get(titulo) || 'Sem CFO'
   ```
4. Atualizar chamada na linha 416: `processRotinas(rotinas, projetos)`

