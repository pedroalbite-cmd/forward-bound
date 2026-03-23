

## Corrigir Pipe ID do Setup (404 nos links)

### Problema

O pipe ID `306756834` usado para Setup está errado. Verifiquei na tabela `pipefy_card_connections` e o pipe correto de Setup é:

- **"3. Setup"** → pipe ID `304026589`

### Correção

**Arquivo**: `src/components/planning/nps/PipefyCardLink.tsx`

Alterar `SETUP: '306756834'` para `SETUP: '304026589'`.

Uma linha, um arquivo.

### Arquivos modificados
- `src/components/planning/nps/PipefyCardLink.tsx` — corrigir pipe ID do Setup

