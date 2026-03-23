

## Reformular o Dossiê de Churn

### 1. Mover Dossiê de Churn para o topo da aba (antes de Operação)

**Arquivo:** `src/components/planning/NpsTab.tsx`
- Trocar a ordem das seções: Dossiê de Churn primeiro, depois Operação, depois NPS
- Iniciar com `churnOpen = true` (aberto por padrão já que é o destaque)

### 2. Normalizar formato de datas

**Arquivo:** `src/components/planning/nps/ChurnDossierSection.tsx`
- Criar função `formatDate(dateStr)` que converte qualquer formato (`2025-02-28T00:00:00.000Z`, `2026-03-02`, etc.) para `DD/MM/YYYY`
- Aplicar em: `mesChurn`, `dataAssinatura`, `dataEncerramento`

### 3. Visual mais colorido e alinhado com a marca (verde O2)

**Arquivo:** `src/components/planning/nps/ChurnDossierSection.tsx`
- **Header do card**: fundo gradient verde escuro com ícone e contagem total de MRR perdido
- **KPI cards acima da tabela**: Total de churns, MRR perdido total, LT médio, motivo mais frequente — com cores primárias da marca
- **Linhas da tabela**: highlight condicional — vermelho claro para MRR alto (>5k), badge colorido para cada fase (Churn=red, Desistência=amber, Atividades finalizadas=gray)
- **Badge de Fase Atual** com cores distintas
- **Coluna LT**: barra visual proporcional ao tempo de vida

### 4. Interatividade — links para Pipefy + detalhes expandíveis

**Arquivo:** `src/components/planning/nps/ChurnDossierSection.tsx`
- Link Pipefy já existe na última coluna — torná-lo mais visível (botão com texto "Ver card")
- **Adicionar link na coluna Cliente** — clicar no nome do cliente abre o card no Pipefy diretamente
- **Linha expandível**: ao clicar na row, expandir painel com detalhes completos (Motivos cancelamento completo, Problemas com a Oxy completo, feedbacks NPS)

### 5. Novas features com dados disponíveis

Com base nos dados já disponíveis nas tabelas:

| Feature | Dados usados | Descrição |
|---------|-------------|-----------|
| **Resumo por Motivo** | `motivoPrincipal` | Gráfico de pizza/barras com distribuição de motivos de churn |
| **Resumo por CFO** | `cfo`, `mrr` | Ranking de CFOs com mais churns e MRR perdido |
| **Timeline de Churn** | `mesChurn` | Gráfico de linha mostrando evolução mensal de churns |
| **Filtros interativos** | todos os campos | Filtrar por mês, motivo, CFO, produto |

### Arquivos modificados
- `src/components/planning/NpsTab.tsx` — reordenar seções
- `src/components/planning/nps/ChurnDossierSection.tsx` — reescrever com visual rico, KPIs, datas formatadas, rows expandíveis, gráficos de resumo, filtros

