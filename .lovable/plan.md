
## Plano: Adicionar Gráfico de SDRs no Drill-down de Vendas

### Problema/Necessidade
O drill-down do acelerador de "Vendas" atualmente exibe apenas:
1. Ranking de Closers por valor (bar chart)
2. Composição MRR/Setup/Pontual (pie chart)

O usuário deseja **visualizar a performance dos SDRs** responsáveis pela prospecção que originou as vendas fechadas.

### Solução
Adicionar um terceiro gráfico no drill-down de Vendas: **"Vendas por SDR"** (bar chart), mostrando o ranking de SDRs pelo valor total de vendas originadas por cada um.

---

### Seção Técnica

#### 1. Atualização no `IndicatorsTab.tsx` (caso `'venda'`)

Dentro do handler `handleRadialCardClick`, no bloco `case 'venda':` (linhas 1352-1429), será adicionada a lógica para criar o gráfico de SDRs:

```typescript
// Após o ranking de Closers (linhas 1387-1394)
// Novo: 3. Ranking de SDRs por valor originado
const sdrTotals = new Map<string, number>();
items.forEach(i => {
  // O campo SDR pode estar em 'sdr' (Modelo Atual) ou 'responsible' (O2 TAX, quando não há closer)
  const sdrName = i.sdr || i.responsible || 'Sem SDR';
  sdrTotals.set(sdrName, (sdrTotals.get(sdrName) || 0) + (i.value || 0));
});
const sdrRankingData = Array.from(sdrTotals.entries())
  .map(([label, value]) => ({ label: label.split(' ')[0], value }))
  .sort((a, b) => b.value - a.value);
```

**Atualização do array `charts`:**

```typescript
const charts: ChartConfig[] = [
  { type: 'bar', title: 'Ranking por Closer', data: closerRankingData, formatValue: formatCompactCurrency },
  { type: 'bar', title: 'Vendas por SDR', data: sdrRankingData, formatValue: formatCompactCurrency }, // NOVO
  { type: 'pie', title: 'Composição do Faturamento', data: compositionData, formatValue: formatCompactCurrency },
];
```

#### 2. Correção no hook `useO2TaxAnalytics.ts`

Para garantir que o campo `sdr` esteja disponível nos items da O2 TAX:

```typescript
// No toDetailItem (linhas ~535-549)
const toDetailItem = (card: O2TaxCard): DetailItem => ({
  // ... campos existentes
  responsible: card.responsavel || undefined, // SDR para O2 TAX
  closer: card.closer || undefined,
  sdr: card.responsavel || undefined, // ADICIONAR: mapear SDR explicitamente
  // ...
});
```

Isso garante que **todas as BUs** tenham o campo `sdr` preenchido corretamente para o gráfico.

---

### Comportamento Esperado

| Cenário | Resultado |
|---------|-----------|
| Consolidado | Gráfico mostra Amanda, Carol (Modelo Atual) e Carlos (O2 TAX) com valores agregados |
| Modelo Atual | Gráfico mostra Amanda e Carol |
| O2 TAX | Gráfico mostra Carlos |
| Oxy Hacker / Franquia | Gráfico mostra Amanda e Carol |

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Adicionar lógica para criar `sdrRankingData` e incluir novo gráfico no array `charts` do case `'venda'` |
| `src/hooks/useO2TaxAnalytics.ts` | Adicionar mapeamento `sdr: card.responsavel` no `toDetailItem` para garantir consistência |

---

### Visualização do Drill-down Após a Alteração

```text
┌─────────────────────────────────────────────────────────────────┐
│  Vendas - O Que Fechamos e Como?                                │
│  5 contratos | Total: R$ 230k | MRR 45% + Setup 30% + Pontual 25% │
├─────────────────────────────────────────────────────────────────┤
│  KPIs: 📝 5 Contratos | 💰 R$ 230k | 🔄 45% MRR | 🏆 Pedro      │
├─────────────────────────────────────────────────────────────────┤
│  [Gráfico 1]           [Gráfico 2]          [Gráfico 3]         │
│  Ranking por Closer    Vendas por SDR       Composição          │
│  ████ Pedro 150k       ████ Amanda 120k     ◕ MRR 45%           │
│  ███ Daniel 80k        ███ Carlos 70k       ◔ Setup 30%         │
│                        ██ Carol 40k         ◑ Pontual 25%       │
├─────────────────────────────────────────────────────────────────┤
│  Tabela: Produto | Empresa | Data | MRR | Setup | ... | SDR     │
└─────────────────────────────────────────────────────────────────┘
```

---

### Risco/Impacto

- **Baixo**: Alteração aditiva que não modifica lógica existente
- **Benefício**: Permite análise de performance de prospecção por SDR diretamente no contexto de vendas fechadas
