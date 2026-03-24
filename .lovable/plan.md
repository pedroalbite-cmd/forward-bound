

## Sync DRE Diário para Banco de Dados

### Sua ideia (confirmando alinhamento)

Estamos no dia 24 de março. A lógica é:

1. **Sync inicial**: Fazer 24 requisições ao endpoint DRE (`/v2/dre/dre-table`) com `startDate = endDate = cada dia` (2026-03-01 até 2026-03-24), extraindo a Receita Bruta (RB) por BU para cada dia
2. **Persistir no banco**: Salvar cada resultado na tabela `daily_revenue` (ou uma nova tabela com colunas por BU)
3. **Cache inteligente**: No próximo acesso, consultar o banco primeiro. Só buscar na API os dias que:
   - Já passaram (dia completo)
   - Ainda não estão no banco
4. **Resultado**: O gráfico de faturamento consome dados diários reais do DRE, não mais do fluxo de caixa

### Ponto de atenção

A tabela `daily_revenue` atual tem apenas `total_inflows` (valor único). Para o DRE por BU, precisamos de colunas adicionais ou uma nova estrutura. Duas opções:

- **Opção A**: Adicionar colunas `caas`, `saas`, `expansao`, `tax` na tabela `daily_revenue` existente
- **Opção B**: Criar nova tabela `daily_dre` com colunas por BU, mantendo `daily_revenue` para fluxo de caixa

### Plano de implementação

**1. Migração de banco** — Adicionar colunas na tabela `daily_revenue`:
- `caas numeric default 0`
- `saas numeric default 0`
- `expansao numeric default 0`
- `tax numeric default 0`
- `source text default 'cashflow'` (para distinguir dados de fluxo de caixa vs DRE)

**2. Edge Function `sync-daily-revenue`** — Alterar para:
- Receber parâmetro `source: 'dre'` (novo) ou `'cashflow'` (comportamento atual)
- Quando `source = 'dre'`: para cada dia no range, chamar `/v2/dre/dre-table?startDate=DIA&endDate=DIA&cnpjs[]=23813779000160`
- Extrair do response os grupos com `code === 'RB'` e mapear CaaS, SaaS, Expansão, Tax
- Fazer upsert com as colunas por BU + `total_inflows` = soma de todas as BUs
- Processar em batches de 5 dias com delay para evitar rate limit

**3. Lógica de cache inteligente** na edge function:
- Antes de buscar na API, consultar quais dias já existem no banco com `source = 'dre'`
- Só buscar os dias faltantes (passados e não no banco)
- Retornar quantos dias foram sincronizados vs já estavam em cache

**4. Frontend `useOxyFinance.ts`** — Atualizar:
- Query `daily_revenue` já existe, apenas garantir que os novos campos (`caas`, `saas`, etc.) são consumidos
- Expor dados por BU para o gráfico filtrar conforme BUs selecionadas

**5. `IndicatorsTab.tsx`** — Ajustar:
- Usar os valores por BU do `daily_revenue` (com filtro pelas BUs selecionadas) em vez do `total_inflows` genérico
- Manter a mesma lógica de `dailyRevenueMap` mas agora somando apenas as BUs ativas

**6. Botão de sync** — Adicionar na interface um botão para disparar o sync dos dias faltantes do mês atual (ou permitir escolher período)

### Arquivos modificados
- Migração SQL (nova) — adicionar colunas à `daily_revenue`
- `supabase/functions/sync-daily-revenue/index.ts` — nova lógica DRE diário
- `src/hooks/useOxyFinance.ts` — consumir colunas por BU
- `src/components/planning/IndicatorsTab.tsx` — filtrar por BU nos dados diários

