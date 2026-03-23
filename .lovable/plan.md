

## Fallback inteligente para datas de assinatura com dia/mes invertido

### Problema confirmado pela investigacao no banco

Tres cards com inversao dia/mes confirmada:

| Card | Empresa | Entrada fase "Contrato assinado" | Data assinatura (banco) | Data correta |
|------|---------|----------------------------------|------------------------|--------------|
| 1232600640 | ServiPromo | 10/03/2026 | 2026-09-03 (Set) | 2026-03-09 (Mar) |
| 1301213259 | Infinit | 09/03/2026 | 2026-09-03 (Set) | 2026-03-09 (Mar) |
| 1295308020 | RM FERNANDEZ | 12/02/2026 | 2026-12-02 (Dez) | 2026-02-12 (Fev) |

O Pipefy grava a data no formato DD/MM/YYYY, mas o banco interpreta como MM/DD/YYYY. Quando o dia <= 12, a inversao gera uma data valida porem errada (ex: 03/09 vira setembro 3 em vez de marco 9).

O card Termotubos (1301735022) nao tem esse problema porque sua data de assinatura esta correta.

### Solucao: detectar e corrigir inversao automaticamente

Em vez de um threshold fixo de 60 dias (que pode falhar em casos legitimos), a abordagem mais robusta e **tentar desinverter a data** e verificar se ela fica mais proxima da data de entrada na fase.

**Logica da funcao:**
1. Verificar se o dia da data de assinatura e <= 12 (unico caso onde inversao gera data valida)
2. Criar a data com dia/mes trocados
3. Se a data trocada existir e estiver mais proxima da data de entrada que a original, usar a versao corrigida
4. Senao, manter a data original

```typescript
function fixPossibleDateInversion(assinatura: Date, entrada: Date): Date {
  const day = assinatura.getDate();
  const month = assinatura.getMonth(); // 0-based
  // Only possible if day <= 12 (otherwise swapped month would be invalid)
  if (day > 12) return assinatura;
  // Try swapping: use current month+1 as day, current day as month
  const swapped = new Date(assinatura.getFullYear(), day - 1, month + 1, 12, 0, 0);
  if (isNaN(swapped.getTime())) return assinatura;
  const diffOriginal = Math.abs(assinatura.getTime() - entrada.getTime());
  const diffSwapped = Math.abs(swapped.getTime() - entrada.getTime());
  return diffSwapped < diffOriginal ? swapped : assinatura;
}
```

**Exemplos de resultado:**
- ServiPromo: `2026-09-03` -> swap -> `2026-03-09` (mais perto de entrada 10/03) -> usa `2026-03-09`
- RM FERNANDEZ: `2026-12-02` -> swap -> `2026-02-12` (mais perto de entrada 12/02) -> usa `2026-02-12`
- Um card com data correta `2026-03-10` e entrada `2026-03-10`: swap daria `2026-10-03` (mais longe) -> mantem `2026-03-10`

### Arquivos a alterar (6 pontos em 5 arquivos)

**Criar funcao utilitaria em `src/hooks/dateUtils.ts`** (novo arquivo):
- Exportar `fixPossibleDateInversion(assinatura: Date, entrada: Date): Date`

**Alterar cada ponto de override para aplicar a correcao antes de usar:**

1. **`src/hooks/useModeloAtualMetas.ts`** (linhas 261-262 e 324-325)
   - Aplicar `fixPossibleDateInversion` na `dataAssinatura` antes do override

2. **`src/hooks/useIndicatorsRealized.ts`** (linhas 142 e 170)
   - Mesmo ajuste nos 2 pontos

3. **`src/hooks/useModeloAtualAnalytics.ts`** (linha 133-134)
   - Mesmo ajuste

4. **`src/hooks/useOxyHackerMetas.ts`** (linhas 126-127)
   - Mesmo ajuste

5. **`src/hooks/useExpansaoAnalytics.ts`** (linhas 98-99)
   - Mesmo ajuste

### Por que essa abordagem e segura

- Nao usa threshold arbitrario (60 dias, 90 dias etc.)
- Funciona para qualquer distancia temporal entre entrada e assinatura
- So corrige quando a data trocada e matematicamente mais proxima da entrada na fase
- Impossivel afetar cards com datas corretas (a versao original sera sempre mais proxima)
- Cobre todos os BUs (Modelo Atual, O2 Tax, Oxy Hacker, Franquia)

