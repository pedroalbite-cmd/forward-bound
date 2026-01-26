

## Plano: Ajustar Colunas dos Clicáveis e Adicionar Duração na Fase

### Objetivo

Modificar o modal de detalhes (DetailSheet) para:
1. **Remover** a coluna "Título" (name)
2. **Remover** a coluna "Fase" (phase)
3. **Adicionar** coluna "Tempo na Fase" mostrando quanto tempo o registro ficou naquela fase

---

### Análise da Fonte de Dados

O banco externo `pipefy_moviment_cfos` já possui a coluna **"Duração (s)"** que contém o tempo em segundos que cada card permaneceu na fase. Isso elimina a necessidade de calcular a diferença entre "Entrada" e "Saída".

| Coluna no Banco | Tipo | Descrição |
|-----------------|------|-----------|
| Entrada | timestamp | Data de entrada na fase |
| Saída | timestamp | Data de saída da fase (pode ser null) |
| Duração (s) | bigint | Tempo na fase em segundos |

---

### Arquitetura da Mudança

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    Fluxo de Dados Atualizado                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. Edge Function (query-external-db)                              │
│      └─► Já retorna "Duração (s)" - sem mudança necessária         │
│                                                                     │
│   2. useModeloAtualAnalytics                                        │
│      └─► Adicionar campo "duracao" ao ModeloAtualCard              │
│      └─► Mapear para DetailItem.duration                           │
│                                                                     │
│   3. DetailSheet Interface                                          │
│      └─► Adicionar "duration?: number" ao DetailItem               │
│                                                                     │
│   4. IndicatorsTab                                                  │
│      └─► Remover 'name' e 'phase' do baseColumns                   │
│      └─► Adicionar 'duration' com formatador customizado           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Mudanças por Arquivo

#### 1. `src/components/planning/indicators/DetailSheet.tsx`

**Adicionar campo `duration` à interface:**

```typescript
export interface DetailItem {
  id: string;
  name: string;           // Mantém no tipo, mas não exibe na tabela
  company?: string;
  phase?: string;         // Mantém no tipo, mas não exibe na tabela
  date?: string;
  value?: number;
  reason?: string;
  revenueRange?: string;
  responsible?: string;
  duration?: number;      // NOVO: duração em segundos
}
```

**Adicionar formatador de duração:**

```typescript
export const columnFormatters = {
  // ... existentes ...
  duration: (seconds: number) => {
    if (!seconds || seconds <= 0) return '-';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  },
};
```

---

#### 2. `src/hooks/useModeloAtualAnalytics.ts`

**Adicionar campo ao ModeloAtualCard:**

```typescript
export interface ModeloAtualCard {
  // ... existentes ...
  duracao: number;  // NOVO: "Duração (s)" do banco
}
```

**Extrair duração ao parsear os dados:**

```typescript
cards.push({
  // ... existentes ...
  duracao: parseNumericValue(row['Duração (s)'] || 0),
});
```

**Incluir na conversão para DetailItem:**

```typescript
const toDetailItem = (card: ModeloAtualCard): DetailItem => ({
  // ... existentes ...
  duration: card.duracao,
});
```

---

#### 3. `src/components/planning/IndicatorsTab.tsx`

**Modificar `getColumnsForIndicator`:**

Antes:
```typescript
const baseColumns = [
  { key: 'name', label: 'Título' },
  { key: 'company', label: 'Empresa/Contato' },
  { key: 'phase', label: 'Fase', format: columnFormatters.phase },
  { key: 'date', label: 'Data', format: columnFormatters.date },
];
```

Depois:
```typescript
const baseColumns = [
  { key: 'company', label: 'Empresa/Contato' },
  { key: 'date', label: 'Data', format: columnFormatters.date },
  { key: 'duration', label: 'Tempo na Fase', format: columnFormatters.duration },
];
```

---

### Visualização da Tabela

**Antes:**

| Título | Empresa/Contato | Fase | Data | Faixa Faturamento | Responsável | Pipefy |
|--------|-----------------|------|------|-------------------|-------------|--------|
| Lead ABC | Empresa X | MQL | 26/01/2026 | R$ 50k-200k | Pedro | 🔗 |

**Depois:**

| Empresa/Contato | Data | Tempo na Fase | Faixa Faturamento | Responsável | Pipefy |
|-----------------|------|---------------|-------------------|-------------|--------|
| Empresa X | 26/01/2026 | 3d 5h | R$ 50k-200k | Pedro | 🔗 |

---

### Formatação do Tempo

| Duração | Exibição |
|---------|----------|
| 0 ou null | "-" |
| 3600s (1h) | "1h" |
| 7200s (2h) | "2h" |
| 86400s (1 dia) | "1d 0h" |
| 259200s (3 dias) | "3d 0h" |
| 352800s (3d 18h) | "3d 18h" |

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `DetailSheet.tsx` | Modificar | Adicionar `duration` ao tipo e formatador |
| `useModeloAtualAnalytics.ts` | Modificar | Extrair e mapear `Duração (s)` do banco |
| `useO2TaxAnalytics.ts` | Modificar | Mesmo tratamento para O2 TAX |
| `useExpansaoAnalytics.ts` | Modificar | Mesmo tratamento para Oxy Hacker/Franquia |
| `IndicatorsTab.tsx` | Modificar | Remover colunas e adicionar Tempo na Fase |

---

### Hooks de Analytics Afetados

Cada hook de analytics precisa:
1. Adicionar `duracao` ao seu tipo de Card
2. Extrair `row['Duração (s)']` dos dados do banco
3. Incluir no `toDetailItem()` como `duration`

Hooks:
- `useModeloAtualAnalytics.ts` - Modelo Atual
- `useO2TaxAnalytics.ts` - O2 TAX
- `useExpansaoAnalytics.ts` - Oxy Hacker e Franquia

---

### Considerações

1. **Fallback para duração:** Se a coluna "Duração (s)" estiver vazia ou for 0, exibir "-"

2. **Cards ainda em andamento:** Se o card ainda está na fase (Saída = null), a duração pode ser 0 ou calculada desde a Entrada até agora. Por ora, usaremos o valor do banco como está.

3. **Granularidade:** O formato "Xd Yh" é mais legível que segundos ou minutos exatos

