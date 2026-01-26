

## Plano: Criar Aba de Ajuste de Metas por Closer no Admin

### Objetivo

Criar uma nova seção dentro da aba Admin que permita definir a porcentagem de responsabilidade de cada closer (Pedro e Daniel) para as metas de cada BU (Modelo Atual, O2 TAX, Oxy Hacker, Franquia) em cada mês do ano.

Isso permitirá que na aba Indicadores, ao filtrar por closer, as metas (não apenas o realizado) também sejam filtradas proporcionalmente.

---

### Arquitetura da Solução

```text
┌──────────────────────────────────────────────────────────────────┐
│                        Fluxo de Dados                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐                                            │
│   │  Tabela Banco   │  closer_metas                              │
│   │  (Nova)         │  - bu: modelo_atual | o2_tax | ...         │
│   │                 │  - month: Jan | Fev | ...                  │
│   │                 │  - closer: Pedro Albite | Daniel Trindade  │
│   │                 │  - percentage: 0-100                        │
│   └────────┬────────┘                                            │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                            │
│   │  Hook           │  useCloserMetas()                          │
│   │                 │  - getPercentage(bu, month, closer)        │
│   │                 │  - updatePercentage(bu, month, closer, %)  │
│   └────────┬────────┘                                            │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                            │
│   │  UI Admin       │  CloserMetasTab                            │
│   │                 │  - Grid editável por BU/mês/closer         │
│   │                 │  - Slider ou input para porcentagem        │
│   └────────┬────────┘                                            │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                            │
│   │  Indicadores    │  Usa porcentagens para calcular metas      │
│   │  Tab            │  filtradas por closer                      │
│   └─────────────────┘                                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 1. Criar Tabela no Banco de Dados

**Nova tabela:** `closer_metas`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| bu | text | BU: modelo_atual, o2_tax, oxy_hacker, franquia |
| month | text | Mês: Jan, Fev, Mar, etc. |
| closer | text | Nome do closer: Pedro Albite, Daniel Trindade |
| percentage | numeric | Porcentagem de responsabilidade (0-100) |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |
| year | integer | Ano (padrão 2026) |

**Constraint:** Unique (bu, month, closer, year)

**RLS Policies:**
- SELECT: Usuários autenticados podem ler
- INSERT/UPDATE/DELETE: Apenas admins

**Valores padrão:** 50% para cada closer em cada BU/mês (distribuição igualitária)

---

### 2. Criar Hook useCloserMetas

**Arquivo:** `src/hooks/useCloserMetas.ts`

```typescript
export interface CloserMeta {
  bu: string;
  month: string;
  closer: string;
  percentage: number;
}

export function useCloserMetas() {
  // Fetch all closer metas from database
  // Provide getPercentage(bu, month, closer) function
  // Provide updatePercentage mutation
  // Provide bulk update for efficiency
}
```

**Funcionalidades:**
- Buscar todas as porcentagens do banco
- Cache com React Query
- Mutation para atualizar porcentagens
- Fallback para 50% quando não há registro

---

### 3. Criar Componente CloserMetasTab

**Arquivo:** `src/components/planning/CloserMetasTab.tsx`

**Layout:**

```text
┌────────────────────────────────────────────────────────────────────┐
│  Ajuste de Metas por Closer                                        │
│  Configure a porcentagem de responsabilidade de cada closer        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─ Selecionar BU ─┐  ┌─ Selecionar Indicador ─┐                   │
│  │ Modelo Atual ▼  │  │ Todos                ▼ │                   │
│  └─────────────────┘  └────────────────────────┘                   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │        Jan    Fev    Mar    Abr    Mai    Jun    ...       │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │ Pedro   50%    50%    50%    60%    60%    60%   ...       │    │
│  │ Daniel  50%    50%    50%    40%    40%    40%   ...       │    │
│  │         ───────────────────────────────────────────        │    │
│  │ Total  100%   100%   100%  100%   100%   100%   ...       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [Aplicar padrão 50/50]  [Salvar alterações]                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Características:**
- Seletor de BU para focar em uma BU por vez
- Tabela com meses nas colunas e closers nas linhas
- Inputs numéricos ou sliders para editar porcentagem
- Validação: soma deve ser 100% por mês (ou mostrar warning)
- Botão para aplicar distribuição padrão 50/50
- Salvar alterações em lote

---

### 4. Integrar no AdminTab

**Arquivo:** `src/components/planning/AdminTab.tsx`

Adicionar Tabs internas no Admin:
1. **Usuários** (conteúdo atual)
2. **Metas por Closer** (novo)

```typescript
<Tabs defaultValue="users">
  <TabsList>
    <TabsTrigger value="users">Usuários</TabsTrigger>
    <TabsTrigger value="closer-metas">Metas por Closer</TabsTrigger>
  </TabsList>
  <TabsContent value="users">
    {/* Conteúdo atual de gerenciamento de usuários */}
  </TabsContent>
  <TabsContent value="closer-metas">
    <CloserMetasTab />
  </TabsContent>
</Tabs>
```

---

### 5. Usar as Porcentagens na Aba Indicadores

**Modificar:** Lógica de cálculo de metas quando filtro de closers está ativo

Quando `selectedClosers` contém apenas "Pedro Albite":
- Meta do mês = Meta total * (porcentagem do Pedro para aquele mês)

Quando `selectedClosers` contém apenas "Daniel Trindade":
- Meta do mês = Meta total * (porcentagem do Daniel para aquele mês)

Quando ambos selecionados:
- Meta = Meta total (100%)

**Componentes afetados:**
- `ClickableFunnelChart.tsx`
- `RadialProgressCard` (metas nos cartões radiais)
- Gráficos de barras e linhas

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Nova migração SQL | Criar | Tabela `closer_metas` com RLS |
| `src/hooks/useCloserMetas.ts` | Criar | Hook para CRUD de porcentagens |
| `src/components/planning/CloserMetasTab.tsx` | Criar | UI de edição de porcentagens |
| `src/components/planning/AdminTab.tsx` | Modificar | Adicionar tabs internas |
| `src/components/planning/ClickableFunnelChart.tsx` | Modificar | Aplicar porcentagens nas metas |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Passar closerMetas para componentes |

---

### Estrutura de Dados no Banco

**Exemplo de registros na tabela `closer_metas`:**

| bu | month | closer | percentage | year |
|----|-------|--------|------------|------|
| modelo_atual | Jan | Pedro Albite | 50 | 2026 |
| modelo_atual | Jan | Daniel Trindade | 50 | 2026 |
| modelo_atual | Fev | Pedro Albite | 60 | 2026 |
| modelo_atual | Fev | Daniel Trindade | 40 | 2026 |
| o2_tax | Jan | Pedro Albite | 100 | 2026 |
| o2_tax | Jan | Daniel Trindade | 0 | 2026 |
| ... | ... | ... | ... | ... |

---

### Comportamento Esperado

| Cenário | Resultado |
|---------|-----------|
| Admin abre aba Metas por Closer | Vê tabela com todas as BUs e porcentagens |
| Admin altera porcentagem do Pedro para 70% em Jan | Daniel automaticamente ajusta para 30% |
| Usuário filtra por Pedro na aba Indicadores | Metas são multiplicadas pela porcentagem do Pedro |
| Usuário seleciona ambos closers | Metas mostram 100% (soma das porcentagens) |
| Nenhum filtro de closer ativo | Metas mostram valores totais |

---

### Detalhes Técnicos

**Cálculo de meta filtrada:**

```typescript
function getFilteredMeta(
  baseMeta: number, 
  bu: string, 
  month: string, 
  selectedClosers: string[],
  closerMetas: CloserMeta[]
): number {
  if (selectedClosers.length === 0) return baseMeta; // Sem filtro = total
  
  const totalPercentage = selectedClosers.reduce((sum, closer) => {
    const meta = closerMetas.find(m => 
      m.bu === bu && m.month === month && m.closer === closer
    );
    return sum + (meta?.percentage || 50); // Fallback 50%
  }, 0);
  
  return baseMeta * (totalPercentage / 100);
}
```

**Seed inicial (via migração):**
- Criar registros para todas as combinações BU x Mês x Closer
- Porcentagem inicial: 50% para cada closer

