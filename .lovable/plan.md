

## Exploração da API Oxy Finance

### Objetivo

Criar uma Edge Function de teste para chamar os 3 endpoints da Oxy Finance e inspecionar a estrutura dos dados retornados. Sem alterações no frontend ainda — primeiro entender os dados.

### Passo 1: Configurar secret

Solicitar `OXY_FINANCE_API_KEY` via add_secret.

### Passo 2: Edge Function `fetch-oxy-finance`

Uma função proxy com 3 ações:

| Ação | Endpoint | Parâmetros |
|---|---|---|
| `dre` | `/v2/dre/dre-table` | startDate, endDate, cnpjs |
| `cashflow_details` | `/widgets/cash-flow/v2/card/details` | startDate, endDate, cnpjs, movimentType (R/P), isLate |
| `cashflow_chart` | `/widgets/cash-flow/charts/fluxo-caixa` | startDate, endDate, cnpjs |

CNPJ fixo: `23813779000160` (formato limpo) e `23.813.779/0001-60` (formato com pontuação para cashflow).

Base URL: `https://api.oxy.finance`

### Passo 3: Testar com curl/invoke

Chamar a Edge Function com cada ação e logar os dados retornados para análise. Usaremos os logs da Edge Function para inspecionar a estrutura JSON.

### Alterações

| Arquivo | Mudança |
|---|---|
| Secret `OXY_FINANCE_API_KEY` | API key da Oxy Finance |
| `supabase/functions/fetch-oxy-finance/index.ts` | **NOVO** — Proxy para os 3 endpoints |
| `supabase/config.toml` | Adicionar entrada para `fetch-oxy-finance` |

