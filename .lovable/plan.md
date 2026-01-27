

## Plano: Unificar Definição de Venda para "Ganho" em Todas as BUs

### Contexto

Atualmente, a definição de venda (indicador 'venda') varia entre as BUs:
- **O2 TAX, Franquia, Oxy Hacker**: já usam fase "Ganho" como venda
- **Modelo Atual**: usa fase "Contrato assinado" como venda

A solicitação é padronizar para que **todas as BUs** contem venda apenas quando o card chega na fase **"Ganho"**.

---

### Mapeamento Atual vs Desejado

| BU | Fase Atual para Venda | Fase Desejada para Venda |
|----|----------------------|--------------------------|
| O2 TAX | Ganho | Ganho (OK) |
| Franquia | Ganho | Ganho (OK) |
| Oxy Hacker | Ganho | Ganho (OK) |
| **Modelo Atual** | **Contrato assinado** | **Ganho** |
| Consolidado | Misto | Ganho |

---

### Arquivos a Modificar

#### 1. `src/hooks/useModeloAtualMetas.ts`

**Alterações:**

1. Adicionar "Ganho" no mapeamento PHASE_TO_INDICATOR (linha 45):
   - DE: `'Contrato assinado': 'venda'`
   - PARA: `'Ganho': 'venda'` (substituir ou adicionar)

2. Remover a lógica especial de "Data de assinatura do contrato" (linhas 129-137):
   - Esta lógica era específica para "Contrato assinado"
   - Não é mais necessária se usarmos "Ganho"

---

#### 2. `src/hooks/useModeloAtualAnalytics.ts`

**Alterações:**

1. Atualizar PHASE_TO_INDICATOR (linha 47):
   - DE: `'Contrato assinado': 'venda'`
   - PARA: `'Ganho': 'venda'`

2. Remover a lógica especial de "Data de assinatura do contrato" (linhas 132-141):
   - Esta lógica era específica para "Contrato assinado"
   - Não é mais necessária

---

#### 3. `src/hooks/useClosersMetas.ts`

**Alterações:**

1. Atualizar PHASE_TO_INDICATOR (linha 24):
   - DE: `'Contrato assinado': 'venda'`
   - PARA: `'Ganho': 'venda'`

---

#### 4. `supabase/functions/sync-pipefy-funnel/index.ts`

**Alterações:**

1. Remover "Contrato Assinado" do mapeamento (linha 32):
   - Manter apenas `'Ganho': 'venda'`
   - Remover: `'Contrato Assinado': 'venda'`

---

#### 5. `supabase/functions/sync-from-sheets/index.ts`

**Alterações:**

1. Verificar se "ganho" está mapeado para venda (se não estiver, adicionar)
2. Remover ou manter "contrato assinado" dependendo de como os dados chegam do Sheets
   - Como esta é uma edge function de sincronização, pode ser necessário manter ambos os mapeamentos para compatibilidade com dados históricos do Sheets

---

### Observação Importante: UI (Nomes de Exibição)

Os gráficos de funil mostram "Contrato Assinado" como nome de exibição (label). Isso NÃO precisa ser alterado pois:
- O nome "Contrato Assinado" é apenas um label visual para o usuário
- A lógica interna usa o indicador 'venda' que agora mapeará para fase "Ganho"

Arquivos de UI que usam o label "Contrato Assinado" (não precisam ser alterados):
- `src/components/planning/ClickableFunnelChart.tsx` (linha 139)
- `src/components/planning/PeriodFunnelChart.tsx` (linha 94)

Se desejar alterar o nome de exibição de "Contrato Assinado" para "Ganho", isso seria uma mudança separada nos componentes de UI.

---

### Resumo de Modificações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/hooks/useModeloAtualMetas.ts` | Modificar | Mudar mapeamento de 'Contrato assinado' para 'Ganho'; remover lógica de data de assinatura |
| `src/hooks/useModeloAtualAnalytics.ts` | Modificar | Mudar mapeamento de 'Contrato assinado' para 'Ganho'; remover lógica de data de assinatura |
| `src/hooks/useClosersMetas.ts` | Modificar | Mudar mapeamento de 'Contrato assinado' para 'Ganho' |
| `supabase/functions/sync-pipefy-funnel/index.ts` | Modificar | Remover 'Contrato Assinado' do mapeamento |
| `supabase/functions/sync-from-sheets/index.ts` | Avaliar | Verificar se precisa adicionar 'ganho' e/ou manter compatibilidade |

---

### Impacto nos Dados

Após a alteração:
- Vendas serão contadas quando cards entrarem na fase **"Ganho"** no Pipefy
- Cards que estão em "Contrato assinado" mas ainda não chegaram em "Ganho" não serão contados como vendas
- Isso pode resultar em números diferentes se houver cards "travados" entre as fases

