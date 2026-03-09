

## Diagnóstico: Vendas faltando na tabela de Campanhas e Anúncios

### Causa raiz

Em `useModeloAtualAnalytics.ts`, a variável `allCardsUnfiltered` (que alimenta a tabela de Campanhas) é construída na **linha 276**, ANTES de os cards de assinatura serem mesclados (linhas 297-304). Resultado: cards que foram assinados no período (Fev-Mar) mas entraram no pipe antes ficam **fora** da lista de atribuição.

```text
Fluxo atual:
  periodResponse.data → parseCards() → allCardsUnfiltered (linha 276)
  signatureResponse.data → parseCards() → signatureCards (linha 291)
  signatureCards merged into "cards" (linha 297-304)
  ❌ allCardsUnfiltered NÃO recebe os signatureCards
```

### Solução

**Arquivo**: `src/hooks/useModeloAtualAnalytics.ts`

Mesclar os `signatureCards` também em `allCardsUnfiltered`, usando a mesma lógica de deduplicação. Isso garante que todos os cards assinados no período apareçam no funil por campanha.

```text
Fluxo corrigido:
  periodResponse.data → parseCards(true) → allCardsUnfiltered
  signatureResponse.data → parseCards(true) → signatureCardsUnfiltered
  signatureCardsUnfiltered merged into allCardsUnfiltered ✅
```

Alteração de ~8 linhas no bloco de merge (após linha 304).

