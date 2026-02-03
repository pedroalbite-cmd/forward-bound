

## Corrigir Busca de Ad Sets (Conjuntos de Anúncios) na Edge Function

### Problema Identificado

A Edge Function está retornando `"adSets": []` vazio para todas as campanhas. Testando diretamente a API, confirmei que **nenhum ad set está sendo retornado**, mesmo que as campanhas tenham conjuntos de anúncios ativos.

### Causa Provável

Analisando o código da Edge Function (linhas 92-151), há um problema de **escopo/tratamento de erro**:

1. O código busca ad sets dentro de um `try/catch` aninhado
2. Se a chamada à API do Meta falhar silenciosamente, retorna array vazio
3. Não há logs para verificar se os ad sets estão sendo encontrados

### Solução

1. **Adicionar logs de diagnóstico** para ver o que a API do Meta está retornando
2. **Verificar a resposta** da API de ad sets antes de processar
3. **Retornar os ad sets corretamente** no objeto de campanha

---

### Mudanças na Edge Function

**Arquivo:** `supabase/functions/fetch-meta-campaigns/index.ts`

Adicionar logs e correções no bloco de ad sets (linhas 100-123):

```typescript
// Fetch ad sets
const adSetsUrl = `${META_BASE_URL}/${campaign.id}/adsets?fields=id,name,status,daily_budget&access_token=${accessToken}`;
console.log(`Fetching ad sets for campaign ${campaign.id}`);
const adSetsResponse = await fetch(adSetsUrl);
const adSetsData = await adSetsResponse.json();

// LOG: Verificar resposta
console.log(`Campaign ${campaign.id} - Ad Sets found:`, adSetsData.data?.length || 0);

if (adSetsData.error) {
  console.error(`Error fetching ad sets for campaign ${campaign.id}:`, adSetsData.error);
}

// For each ad set, fetch its insights
const adSetsWithInsights = await Promise.all(
  (adSetsData.data || []).map(async (adSet: MetaAdSet) => {
    // ... código existente de insights por ad set ...
  })
);

console.log(`Campaign ${campaign.id} - Ad Sets with insights:`, adSetsWithInsights.length);
```

---

### Possíveis Causas do Problema

| Causa | Verificação |
|-------|-------------|
| Campanhas sem ad sets | Improvável - todas as campanhas têm |
| Erro de permissão do token | Verificar se token tem `ads_read` |
| Filtro implícito | Meta pode estar filtrando ad sets inativos |
| Erro de formato do account ID | Já está formatado corretamente |

---

### Plano de Debug

1. **Adicionar logs detalhados** para ver o que a API retorna
2. **Verificar se há erros** na resposta do Meta para ad sets
3. **Testar manualmente** uma campanha específica
4. **Ajustar campos** se necessário (adicionar `effective_status` ao filtro)

---

### Resumo

| Arquivo | Ação |
|---------|------|
| `supabase/functions/fetch-meta-campaigns/index.ts` | Adicionar logs + verificar resposta de ad sets |

A implementação vai adicionar diagnósticos e corrigir a lógica para garantir que os ad sets apareçam na tabela.

