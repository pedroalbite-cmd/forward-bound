

## Melhorias de Interatividade: Drill-down com links para Pipefy

### Escopo

Adicionar interatividade em 5 áreas com drill-down (Sheet/Dialog) e links diretos para os cards no Pipefy.

**Link Pipefy**: `https://app.pipefy.com/pipes/{PIPE_ID}/cards/{CARD_ID}` — preciso verificar os pipe IDs, mas o card ID já está disponível em todas as tabelas como campo `ID`.

### 1. Feedback Qualitativo — mostrar quem enviou

**Arquivo**: `src/hooks/useNpsData.ts` + `src/components/planning/nps/QualitativeFeedback.tsx`

- Expandir `FeedbackItem` para incluir `email`, `titulo` (nome empresa), `cardId`, `cfoName`
- No processamento, popular esses campos a partir do card NPS + cfoMap
- No componente, ao clicar no feedback card, expandir/mostrar: email do respondente, empresa (Título), CFO responsável
- Botão "Abrir no Pipefy" → link externo `https://app.pipefy.com/pipes/PIPE_ID/cards/{cardId}`

### 2. Performance por CFO — ver respondentes do CFO

**Arquivo**: `src/hooks/useNpsData.ts` + `src/components/planning/nps/CfoPerformanceTable.tsx`

- Expandir `CfoPerformance` para incluir `cards: { titulo: string; nota: number; email: string; cardId: string }[]`
- No processamento, agregar os cards de cada CFO
- No componente, ao clicar na linha do CFO, abrir Sheet/Dialog listando todos os respondentes NPS daquele CFO com nota, empresa, email
- Cada item com link "Abrir no Pipefy"

### 3. Clientes por CFO — ver lista de clientes

**Arquivo**: `src/hooks/useOperationsData.ts` + `src/components/planning/nps/OperationsSection.tsx`

- Expandir `CfoDistribution` para incluir `clients: { titulo: string; mrr: number; cardId: string; fase: string }[]`
- No processamento, armazenar lista de clientes por CFO
- No componente, ao clicar na linha do CFO, abrir Sheet listando todos os clientes com nome, MRR, fase
- Cada cliente com link "Abrir no Pipefy" → card na `pipefy_central_projetos`

### 4. Tratativas Ativas — link para card no Pipefy

**Arquivo**: `src/components/planning/nps/OperationsSection.tsx`

- O `id` do card já está disponível em `TratativaActive`
- Adicionar coluna/ícone na tabela de tratativas ativas com link externo para o card no pipe de tratativas

### 5. Prova real dos dados (validação)

- Rodar query direta no banco para comparar totais com o que o dashboard mostra
- Validar NPS score, contagem de promotores/neutros/detratores, CSAT, e distribuição por CFO

### Pipe IDs necessários

Precisarei buscar os pipe IDs do Pipefy para montar as URLs. Os pipes são:
- Central de Projetos (clientes)
- Tratativas
- NPS (5.2 Pesquisa de Satisfação NPS)

Esses IDs podem ser inferidos dos dados ou configurados como constantes.

### Componente reutilizável

Criar um componente `PipefyCardLink` que recebe `pipeId` e `cardId` e renderiza um botão/ícone com link externo.

### Sugestões adicionais (para você avaliar)

1. **Filtro por período no NPS** — filtrar por trimestre/mês de entrada para comparar evolução
2. **Dashboard de Setup/Onboarding** — usar `pipefy_moviment_setup` para mostrar tempo médio de implantação, gargalos por fase, performance por implantador
3. **Dashboard de Rotinas CFO** — usar `pipefy_moviment_rotinas` para mostrar entregas no prazo vs atrasadas, temperatura dos clientes, performance por CFO
4. **Alertas automáticos** — highlight de clientes com NPS detrator + em tratativa simultânea (cruzar tabelas)
5. **Exportar relatório NPS em PDF** — gerar relatório executivo com todos os dados para apresentação

### Arquivos modificados
- `src/hooks/useNpsData.ts` — expandir interfaces e processamento
- `src/hooks/useOperationsData.ts` — expandir CfoDistribution com lista de clientes
- `src/components/planning/nps/QualitativeFeedback.tsx` — drill-down no feedback
- `src/components/planning/nps/CfoPerformanceTable.tsx` — drill-down por CFO
- `src/components/planning/nps/OperationsSection.tsx` — links Pipefy + drill-down clientes por CFO
- `src/components/planning/nps/PipefyCardLink.tsx` — novo componente reutilizável

