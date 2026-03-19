

## Investigar os 4 MQLs extras em Março (269 no sistema vs 265 no Pipefy)

### Diagnóstico até agora

A tabela `pipefy_moviment_cfos` retorna **1637 linhas** para cards criados em março via `query_period_by_creation`. O sistema deduplica por ID e filtra por faixa ≥ R$ 200k, chegando a 269 cards únicos. O Pipefy mostra 265.

Já identifiquei pelo menos **1 card suspeito**: **ID 1320546949 "TESTE"** (empresa "TESTE", email `eduarda.rovani@o2inc.com.br`, criado 19/03/2026) — card de teste interno com faixa "Entre R$ 200 mil e R$ 350 mil".

### Plano de ação

**1. Criar script para comparar IDs do Excel vs banco de dados**
- Parsear o arquivo Excel enviado (`mql_duda_03-19-2026.xlsx`) usando Python/pandas para extrair a lista de IDs do relatório Pipefy
- Executar query via edge function para obter todos os IDs únicos com faixa qualificável criados em março na `pipefy_moviment_cfos`
- Fazer o diff: IDs que estão no sistema mas **não** estão no Excel = os 4 extras
- Listar os 4 cards com nome, empresa, fase atual e motivo (teste, sync, etc.)

**2. Corrigir a contagem se necessário**
- Se os 4 extras forem cards de teste ou dados incorretos: adicionar filtro para excluí-los (ex: ignorar cards com título "TESTE")
- Se forem diferença de tabela (`pipefy_moviment_cfos` vs pipe nativo do Pipefy): documentar a causa e alinhar qual fonte é a correta

### Resultado esperado
- Lista exata dos 4 IDs extras com justificativa
- Correção no código se os cards não deveriam ser contados

