

## Nova Aba "NPS/CSAT" - Replicar Dashboard de Indicadores de Satisfacao

### Objetivo
Criar uma nova aba "NPS" no Planejamento 2026 que replica visualmente o dashboard de NPS/CSAT do projeto referencia, com dados fixos por enquanto (preparado para banco externo depois). Acesso controlado por permissao.

### Secoes do Dashboard (baseado no screenshot)

```text
+-------------------------------------------------------+
| Header: "Resultados da Pesquisa NPS" + badges Q4 2025 |
| KPIs: Clientes | Respostas | Taxa Resp | CFOs Ativos  |
+-------------------------------------------------------+
| Metricas Gerais (3 gauges):                           |
|   Taxa Resposta 33% | CSAT 82% | NPS 36              |
+-------------------------------------------------------+
| Score Cards: NPS | CSAT | Sean Ellis (com meta)       |
+-------------------------------------------------------+
| Distribuicoes: NPS | CSAT | Sean Ellis (barras)       |
+-------------------------------------------------------+
| Tabela Performance por CFO                            |
+-------------------------------------------------------+
| Feedback Qualitativo (Collapsible)                    |
|   Elogios | Sugestoes | Criticas | Expectativas       |
+-------------------------------------------------------+
| Conclusao Executiva (Collapsible)                     |
|   Pontos Fortes | Atencao | Recomendacoes             |
+-------------------------------------------------------+
```

### Alteracoes

| Arquivo | O que muda |
|---------|-----------|
| `src/hooks/useUserPermissions.ts` | Adicionar `'nps'` ao tipo `TabKey` e ao array de tabs do admin |
| `src/pages/Planning2026.tsx` | Adicionar tab "NPS" com icone `SmilePlus` ao `TAB_CONFIG` e renderizar `<NpsTab />` |
| `src/components/planning/NpsTab.tsx` | **Novo** - Componente principal da aba, orquestra todas as secoes |
| `src/components/planning/nps/npsData.ts` | **Novo** - Dados hardcoded (Q4 2025) com tipos e constantes |
| `src/components/planning/nps/NpsKpiCards.tsx` | **Novo** - 4 KPI cards do header (Clientes, Respostas, Taxa, CFOs) |
| `src/components/planning/nps/NpsGauges.tsx` | **Novo** - 3 gauges semi-circulares (Taxa Resposta, CSAT, NPS) usando Recharts RadialBarChart |
| `src/components/planning/nps/NpsScoreCards.tsx` | **Novo** - 3 cards grandes com score, descricao e badge meta atingida/nao |
| `src/components/planning/nps/NpsDistributions.tsx` | **Novo** - 3 cards lado a lado: distribuicao NPS (barra segmentada + legenda), CSAT (barra + breakdown notas), Sean Ellis (barras horizontais) |
| `src/components/planning/nps/CfoPerformanceTable.tsx` | **Novo** - Tabela com dados por CFO (Enviados, Respostas, Taxa, NPS, CSAT, Sean Ellis) |
| `src/components/planning/nps/QualitativeFeedback.tsx` | **Novo** - Collapsible com tabs (Elogios/Sugestoes/Criticas/Expectativas) mostrando cards de citacao |
| `src/components/planning/nps/ExecutiveSummary.tsx` | **Novo** - Secao de conclusao com pontos fortes, atencao e recomendacoes |

### Dados hardcoded (npsData.ts)

Todos os valores extraidos do dashboard de referencia:
- **Geral**: 66 pesquisados, 22 respostas, 33% taxa, 7 CFOs
- **NPS**: 36 (12 promotores, 6 neutros, 4 detratores), meta 40
- **CSAT**: 82% (18/22 satisfeitos), meta 80%
- **Sean Ellis**: 14% (2/14 ativos), meta 40%
- **CFOs**: 7 registros com metricas individuais
- **Feedback**: 18 comentarios categorizados (4 elogios, 6 sugestoes, 4 criticas, 4 expectativas)

### Detalhes tecnicos

**Permissoes**: Adicionar `'nps'` como novo `TabKey`. Admins tem acesso automatico. Outros usuarios precisam de registro em `user_tab_permissions` com `tab_key = 'nps'`.

**Gauges**: Usar `RadialBarChart` do Recharts (ja instalado) com gradiente verde/amarelo/vermelho baseado no atingimento da meta, identico aos gauges do screenshot.

**Barra segmentada NPS**: Barra horizontal com 3 segmentos coloridos (verde promotores, amarelo neutros, vermelho detratores) usando divs com width percentual.

**Preparacao para banco externo**: Os dados ficam isolados em `npsData.ts`. Quando integrar com banco externo, basta criar um hook `useNpsData()` que substitui as constantes por queries.

