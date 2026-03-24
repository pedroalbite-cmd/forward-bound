

## Passo 1: Explorar a API DRE detalhado (categorias) da Expansão

### Contexto
A tabela `daily_revenue` já tem colunas `caas`, `saas`, `expansao`, `tax`. O plano é **adicionar duas colunas** (`oxy_hacker` e `franquia`) nessa mesma tabela, preenchidas via o endpoint detalhado da API. Assim mantemos a mesma estrutura e o frontend consome tudo do mesmo lugar.

Mas antes de mexer no banco ou no sync, precisamos entender o output do endpoint detalhado.

### O que será feito agora

**Arquivo:** `supabase/functions/fetch-oxy-finance/index.ts`

Adicionar um novo case `'dre_categories'` no switch (antes do `default`):

- Chama `GET /v2/dre/dre-table-categories` com:
  - `groupIds[]=bed1718d-e54f-4341-abe0-22ae7f04a26a` (grupo Expansão)
  - `cnpjs[]=23.813.779/0001-60` (formato com pontuação, conforme URL fornecida)
  - `startDate` e `endDate` recebidos do body
- Retorna o response bruto com logs detalhados (já existentes no código)

**Após o deploy**, chamarei o endpoint com range de 1 dia para analisar a estrutura do JSON nos logs e identificar onde aparecem "Micro Franqueado" e "Franquia".

### Nenhuma outra alteração neste passo
Sem migração de banco, sem alteração no sync, sem alteração no frontend. Apenas a adição do case exploratório.

