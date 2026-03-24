

## Passo 1: Explorar o output da API DRE Detalhado

Antes de implementar qualquer mudança, precisamos adicionar uma action temporária na edge function `fetch-oxy-finance` para chamar o endpoint de categorias e ver a estrutura do response.

### O que será feito

**Arquivo:** `supabase/functions/fetch-oxy-finance/index.ts`

Adicionar um novo `case 'dre_categories'` no switch que chama:
```
GET https://api.oxy.finance/v2/dre/dre-table-categories
  ?groupIds[]=bed1718d-e54f-4341-abe0-22ae7f04a26a
  &startDate={startDate}
  &endDate={endDate}
  &cnpjs[]=23.813.779/0001-60
```

O `groupId` `bed1718d-...` é o ID do grupo "Expansão" (RB) que o usuário forneceu na URL.

Após deploy, chamarei o endpoint com um range curto (ex: 1 dia) para logar e analisar o response, identificando onde aparecem "Micro Franqueado" e "Franquia" e seus valores.

### Resultado esperado
Entender a estrutura exata do JSON retornado para mapear corretamente os sub-grupos antes de implementar a separação no banco e no sync.

