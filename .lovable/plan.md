

## Plano: Metas editáveis de custo por etapa no Admin

### Resumo
Criar uma tabela no banco para armazenar metas de CPL, CPMQL, CPRM, CPRR, CPP e CPV por mês, e uma nova sub-aba no Admin para editá-las. Na aba Marketing, usar esses valores em vez do cálculo automático (investimento/volume).

### Alterações

**1. Nova tabela `cost_stage_metas`**
- Colunas: `id`, `month` (text), `year` (int default 2026), `cpl`, `cpmql`, `cprm`, `cprr`, `cpp`, `cpv` (todos numeric default 0), `created_at`, `updated_at`
- RLS: leitura para autenticados, escrita apenas admin
- Uma linha por mês (valores consolidados, sem BU)

**2. Novo hook `useCostStageMetas.ts`**
- Query para buscar todas as metas do ano
- Mutation para upsert (on conflict month+year)

**3. Novo componente `CostStageMetasTab.tsx`**
- Tabela editável com 12 meses nas colunas e 6 métricas (CPL, CPMQL, CPRM, CPRR, CPP, CPV) nas linhas
- Estilo consistente com MonetaryMetasTab (input inline, botão salvar)

**4. Registrar nova sub-aba no `AdminTab.tsx`**
- Adicionar tab "Metas CPx" com ícone ao lado das existentes

**5. Atualizar `MarketingIndicatorsTab.tsx`**
- Importar `useCostStageMetas`
- No `finalCostGoals`, somar os valores do DB para os meses do período selecionado
- Fallback para o cálculo automático atual se não houver dados no DB

