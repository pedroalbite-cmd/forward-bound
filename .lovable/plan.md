

## Diagnóstico: Vendas faltando na atribuição de campanhas

### Causa raiz

O bug está na linha 308-315 de `useModeloAtualAnalytics.ts`. A merge de cards assinados no período para `allCardsUnfiltered` (usado pela atribuição de marketing) deduplica por **card ID** apenas:

```typescript
// BUG: deduplica por ID — se o card já tem qualquer movimento no período,
// a linha "Contrato assinado" da query de assinatura é DESCARTADA
const existingUnfilteredIds = new Set(allCardsUnfiltered.map(c => c.id));
for (const sc of signatureCardsUnfiltered) {
  if (!existingUnfilteredIds.has(sc.id)) { // ← só adiciona se ID não existe
    allCardsUnfiltered.push(sc);
  }
}
```

Enquanto isso, a merge para o array `cards` (usado nos indicadores) deduplica por **id+fase** (linha 300), preservando corretamente as vendas.

**Resultado**: Um card que tem movimentação de "Novos Leads" em fevereiro (já está no `allCardsUnfiltered`) NÃO recebe a linha de "Contrato assinado" da query de assinatura. Na atribuição, esse card nunca chega ao estágio `vendas`.

### Correção

**Arquivo**: `src/hooks/useModeloAtualAnalytics.ts`, linhas 308-315

Trocar a deduplicação de `id` para `id|fase` (mesmo padrão da linha 300):

```typescript
// Merge signature cards into allCardsUnfiltered (deduplicate by id+fase)
const existingUnfilteredKeys = new Set(allCardsUnfiltered.map(c => `${c.id}|${c.fase}`));
for (const sc of signatureCardsUnfiltered) {
  if (!existingUnfilteredKeys.has(`${sc.id}|${sc.fase}`)) {
    allCardsUnfiltered.push(sc);
    existingUnfilteredKeys.add(`${sc.id}|${sc.fase}`);
  }
}
```

Isso garante que a linha "Contrato assinado" (fase de venda) seja adicionada mesmo que o card já tenha outras fases no array. O hook `useMarketingAttribution` já acumula estágios por card ID, então passará a contar corretamente as vendas com suas campanhas/anúncios associados.

### Impacto
- As vendas que antes eram "invisíveis" na atribuição passarão a aparecer com match direto de campanha/conjunto/anúncio
- Nenhuma alteração necessária em outros arquivos — o fix é cirúrgico

