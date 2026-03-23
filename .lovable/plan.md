

## Conectar NPS ao banco de dados (pipefy_moviment_nps)

### Contexto

Hoje toda a seção NPS usa dados hardcoded em `npsData.ts`. A nova tabela `pipefy_moviment_nps` (56 cards, 112 movimentações) tem os dados reais: Nota NPS, Satisfacao Geral, Sentimento Oxy, Comentarios, E-mail, CFO Responsavel. Vamos substituir os dados estáticos por dados em tempo real.

A seção de Operação já está 100% no banco de dados.

### Alterações

**1. Edge Function — `supabase/functions/query-external-db/index.ts`**
- Adicionar `pipefy_moviment_nps`, `pipefy_moviment_setup`, `pipefy_moviment_rotinas` ao array `validTables`

**2. Novo hook — `src/hooks/useNpsData.ts`**
- Buscar `pipefy_moviment_nps` (filtro `Fase === Fase Atual` para cards únicos)
- Calcular a partir dos dados reais:
  - **NPS Score**: % promotores (9-10) - % detratores (0-6)
  - **CSAT**: parse de "Satisfacao Geral" (extrair número 1-5 do texto tipo "5: 💚 Extremamente satisfeito")
  - **Sean Ellis**: parse de "Sentimento Oxy" (categorizar "Muito desapontado" / "De certa forma" / "Não ficaria")
  - **Distribuição**: contagens de promotores, neutros, detratores
  - **Performance por CFO**: agrupar por "CFO Responsavel", calcular NPS/CSAT/taxa por CFO
  - **Feedback qualitativo**: extrair "Comentarios" e "Motivo da Nota" com nota e sentimento
  - **KPIs gerais**: total pesquisados, respostas, taxa de resposta, CFOs ativos
- Exportar interface tipada compatível com os componentes existentes

**3. Atualizar componentes NPS para usar dados do hook**

Todos os componentes abaixo deixarão de importar de `npsData.ts` e receberão props do hook:

- **`NpsKpiCards`** — receber KPIs calculados via props
- **`NpsGauges`** — receber scores via props
- **`NpsScoreCards`** — receber métricas e distribuição via props
- **`NpsDistributions`** — receber contagens reais via props
- **`CfoPerformanceTable`** — receber array de CFOs calculado via props
- **`QualitativeFeedback`** — receber feedback real via props
- **`ExecutiveSummary`** — manter hardcoded (é análise manual, não dados brutos)

**4. Atualizar `NpsTab.tsx`**
- Chamar `useNpsData()` no topo
- Passar dados como props para cada sub-componente
- Adicionar estados de loading/error na seção NPS

### Mapeamento de campos

| Campo na tabela | Uso no dashboard |
|---|---|
| `"Nota NPS"` | Score NPS (0-10), classificação promotor/neutro/detrator |
| `"Satisfacao Geral"` | CSAT score (extrair 1-5 do texto) |
| `"Sentimento Oxy"` | Sean Ellis score |
| `"Comentarios"` | Feedback qualitativo (sugestões/elogios) |
| `"Motivo da Nota"` | Feedback qualitativo (motivo) |
| `"CFO Responsavel"` | Agrupamento por CFO |
| `"E-mail"` | Contagem de respondentes únicos |

### Arquivos modificados
- `supabase/functions/query-external-db/index.ts` — adicionar tabelas
- `src/hooks/useNpsData.ts` — novo hook
- `src/components/planning/NpsTab.tsx` — orquestrar dados
- `src/components/planning/nps/NpsKpiCards.tsx` — props
- `src/components/planning/nps/NpsGauges.tsx` — props
- `src/components/planning/nps/NpsScoreCards.tsx` — props
- `src/components/planning/nps/NpsDistributions.tsx` — props
- `src/components/planning/nps/CfoPerformanceTable.tsx` — props
- `src/components/planning/nps/QualitativeFeedback.tsx` — props

