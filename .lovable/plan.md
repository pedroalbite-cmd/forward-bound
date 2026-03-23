

## Investigacao completa

### 1. Por que 108 clientes aparecem "Sem CFO"

A tabela `pipefy_central_projetos` tem dois campos de responsavel:
- **"CFO Responsavel"** — nome curto (ex: "Douglas Schossler"). Este e o campo usado hoje no codigo.
- **"Responsavel"** — nome completo (ex: "Douglas Pinheiro Schossler"). Sempre preenchido quando o outro esta.

O problema: o codigo conta TODOS os 260 cards unicos (filtro `Fase === Fase Atual`), incluindo cards em fases como **Churn, Atividades finalizadas, Desistencia, Arquivado**. Muitos desses cards antigos nunca tiveram o campo "CFO Responsavel" preenchido no Pipefy. Isso nao e um bug — sao cards antigos/inativos onde o campo realmente esta vazio.

**Correcao proposta:**
- Usar "Responsavel" como fallback quando "CFO Responsavel" estiver vazio
- Na tabela de distribuicao por CFO, separar ou filtrar por fase ativa (Onboarding + Em Operacao Recorrente) para dar visibilidade real

### 2. Operacao esta 100% do banco de dados?

Sim. O `useOperationsData.ts` busca dados exclusivamente via edge function `query-external-db` das tabelas `pipefy_central_projetos` e `pipefy_moviment_tratativas`. Nenhum dado e hardcoded.

### 3. Vincular NPS ao banco de dados

**Nao existe tabela de NPS no banco externo.** As 5 tabelas disponiveis sao:
- `pipefy_central_projetos` — fases de projeto, CFO, valores
- `pipefy_moviment_tratativas` — tratativas com clientes
- `pipefy_db_clientes` — cadastro de clientes (CNPJ, contato, ERP)
- `pipefy_db_pessoas` — time/CFOs (nome, cargo, email)
- `pipefy_card_connections` — relacionamentos entre cards

Nenhuma contem scores NPS, CSAT, Sean Ellis, ou respostas de pesquisa. Hoje o NPS esta 100% hardcoded no arquivo `npsData.ts`.

**O que falta para vincular o NPS:**
Voce precisa ter uma tabela (no banco externo ou no banco Cloud) com os dados da pesquisa NPS. Essa tabela precisaria conter pelo menos:
- Cliente / empresa
- CFO responsavel
- Score NPS (0-10)
- Score CSAT (1-5)
- Score Sean Ellis
- Feedback texto
- Data da pesquisa
- Trimestre/periodo

**Pergunta:** Esses dados de NPS existem em algum outro lugar (planilha Google, Pipefy, outro sistema)? Preciso saber a fonte para poder conectar.

### Plano de correcao imediata (Sem CFO)

**1. `src/hooks/useOperationsData.ts`**
- Linha 98: usar fallback `card['CFO Responsavel'] || card['Responsavel'] || 'Sem CFO'`
- Adicionar campo "Responsavel" a interface `ProjectCard`

**2. `src/components/planning/nps/OperationsSection.tsx`**
- Na tabela de CFOs, adicionar coluna de "Fase" ou filtrar para mostrar apenas clientes ativos por padrao

