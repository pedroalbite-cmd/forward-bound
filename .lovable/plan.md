
## Adicionar Dados de 2025 na Aba Mkt Indicadores

### Contexto

Atualmente, a Edge Function `read-marketing-sheet` lê apenas da aba "Indicadores 26" (dados de 2026). O usuário quer que a aba Mkt Indicadores também mostre dados de 2025, que estão na mesma planilha mas em uma aba diferente (gid=2102339529).

### Estrutura da Planilha 2025

A aba de 2025 tem uma estrutura ligeiramente diferente da de 2026:

| Coluna | Conteúdo |
|--------|----------|
| A | Labels (métricas) |
| B | Janeiro/25 |
| C | Fevereiro/25 |
| D | Março/25 |
| E | Q1 Total |
| F | Abril/25 |
| G | Maio/25 |
| H | Junho/25 |
| I | Q2 Total |
| J | Julho/25 |
| K | Agosto/25 |
| L | Setembro/25 |
| M | Q3 Total |
| N | Outubro/25 |
| O | Novembro/25 |
| P | Dezembro/25 |
| Q | Q4 Total |
| R | Total Anual |

### Solução Proposta

Atualizar a Edge Function para:
1. Detectar o ano no período selecionado
2. Buscar da aba correta ("Indicadores 26" para 2026, aba de 2025 para 2025)
3. Mapear as colunas corretamente para cada estrutura
4. Combinar os dados se o período incluir ambos os anos

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/read-marketing-sheet/index.ts` | Adicionar lógica para ler de ambas as abas e combinar dados |

---

### Lógica de Implementação

```typescript
// Configuração das abas
const TAB_2025_GID = '2102339529';
const TAB_2025_NAME = 'Indicadores 25'; // ou buscar por GID

// Mapeamento de colunas para 2025 (estrutura diferente com colunas de totais trimestrais)
const MONTH_COLUMNS_2025: Record<number, number> = {
  0: 1,   // Jan = coluna B (índice 1)
  1: 2,   // Fev = coluna C
  2: 3,   // Mar = coluna D
  3: 5,   // Abr = coluna F (pula E = total Q1)
  4: 6,   // Mai = coluna G
  5: 7,   // Jun = coluna H
  6: 9,   // Jul = coluna J (pula I = total Q2)
  7: 10,  // Ago = coluna K
  8: 11,  // Set = coluna L
  9: 13,  // Out = coluna N (pula M = total Q3)
  10: 14, // Nov = coluna O
  11: 15, // Dez = coluna P
};

// Função para buscar dados de um ano específico
async function fetchYearData(year: 2025 | 2026, months: number[]): Promise<Record<string, number>> {
  const sheetName = year === 2025 ? TAB_2025_NAME : MARKETING_TAB_NAME;
  const columnMap = year === 2025 ? MONTH_COLUMNS_2025 : MONTH_COLUMNS_2026;
  // ... buscar e agregar
}

// Combinar resultados se período cruzar anos
function mergeResults(data2025: Record<string, number>, data2026: Record<string, number>): Record<string, number> {
  // Somar métricas acumuláveis (leads, vendas, investimento, etc.)
  // Para ratios (CPL, CAC), recalcular baseado nos totais
}
```

---

### Fluxo de Decisão

```text
Período Selecionado
       │
       ▼
┌──────────────────┐
│ Período inclui   │
│ apenas 2025?     │──────► Buscar só aba 2025
└────────┬─────────┘
         │ Não
         ▼
┌──────────────────┐
│ Período inclui   │
│ apenas 2026?     │──────► Buscar só aba 2026
└────────┬─────────┘
         │ Não
         ▼
┌──────────────────┐
│ Período cruza    │
│ 2025 e 2026      │──────► Buscar ambas + combinar
└──────────────────┘
```

---

### Tratamento de Métricas

| Tipo de Métrica | Combinação |
|-----------------|------------|
| Acumuláveis (leads, vendas, mídia, MRR) | Soma |
| Ratios/Médias (CPL, CAC, ROAS) | Recalcular: total_custo / total_volume |

Exemplo:
- CPL combinado = (mídia_2025 + mídia_2026) / (leads_2025 + leads_2026)

---

### Resultado Esperado

Quando o usuário selecionar:
- **Jan-Dec 2025**: mostra dados apenas de 2025
- **Jan-Feb 2026**: mostra dados apenas de 2026 (comportamento atual)
- **Nov 2025 - Feb 2026**: combina dados de ambos os anos

---

### Implementação Detalhada

A Edge Function será atualizada para:

1. **Adicionar configuração da nova aba**:
```typescript
const TAB_CONFIGS = {
  2025: { name: 'Indicadores 25', gid: '2102339529' },
  2026: { name: 'Indicadores 26', gid: '1310877066' },
};
```

2. **Criar mapeamento de colunas para 2025** (pulando colunas de totais trimestrais):
```typescript
const MONTH_COLUMNS_2025 = {
  0: 1, 1: 2, 2: 3,     // Q1: Jan-Mar
  3: 5, 4: 6, 5: 7,     // Q2: Apr-Jun
  6: 9, 7: 10, 8: 11,   // Q3: Jul-Sep
  9: 13, 10: 14, 11: 15 // Q4: Oct-Dec
};
```

3. **Separar busca por ano** e combinar resultados conforme necessário

4. **Recalcular métricas de ratio** quando combinar dados de múltiplos anos
