

## Alternativas de Visualização: Gráfico de Faturamento por Período

Analisei o código atual e os padrões de visualização existentes no projeto. Aqui estão **5 opções** para você escolher a melhor abordagem para o gráfico de faturamento quando múltiplas BUs estão selecionadas:

---

### Opção 1: Barras Agrupadas (Grouped Bars) - Lado a Lado

```text
                      Faturamento por Período
   ┌─────────────────────────────────────────────────────────┐
   │   [■ M.Atual] [■ O2 TAX] [■ Oxy Hacker] [■ Franquia]    │
   │                                                         │
   │   ██ ▓▓ ░░ ▒▒    ██ ▓▓ ░░ ▒▒    ██ ▓▓ ░░ ▒▒            │
   │   ██ ▓▓ ░░ ▒▒    ██ ▓▓ ░░ ▒▒    ██ ▓▓ ░░ ▒▒            │
   │   ██ ▓▓ ░░ ▒▒    ██ ▓▓ ░░ ▒▒    ██ ▓▓ ░░ ▒▒            │
   │      Jan            Fev            Mar                  │
   └─────────────────────────────────────────────────────────┘
```

**Vantagens:**
- Comparação direta entre BUs no mesmo período
- Fácil identificar qual BU performou melhor
- Padrão comum em dashboards de BI

**Desvantagens:**
- Fica congestionado com 4 BUs + linha de meta
- Difícil ver o total agregado do período

---

### Opção 2: Linhas por BU (Multi-Line Chart) - Similar ao SalesGoalsCharts

```text
                      Faturamento por Período
   ┌─────────────────────────────────────────────────────────┐
   │   [─ M.Atual] [─ O2 TAX] [─ Expansão] [-- Meta Total]   │
   │                                                         │
   │              ______/                                    │
   │           __/     \___                                  │
   │        __/            \___                              │
   │       /                   \                             │
   │   ___/                                                  │
   │   Jan    Fev    Mar    Abr    Mai    Jun               │
   └─────────────────────────────────────────────────────────┘
```

**Vantagens:**
- Mostra tendência de cada BU ao longo do tempo
- Visual limpo, menos poluído
- Fica claro quando uma BU ultrapassa outra

**Desvantagens:**
- Difícil comparar volumes absolutos
- Não mostra totais empilhados

---

### Opção 3: Área Empilhada (Stacked Area Chart)

```text
                      Faturamento por Período
   ┌─────────────────────────────────────────────────────────┐
   │   [■ M.Atual] [■ O2 TAX] [■ Oxy Hacker] [■ Franquia]    │
   │                                                         │
   │   ████████████████████████████████████████████████████  │
   │   ████████████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
   │   ██████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
   │   ███▓▓▓▓▓▓▓░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │
   │   Jan    Fev    Mar    Abr    Mai    Jun               │
   └─────────────────────────────────────────────────────────┘
```

**Vantagens:**
- Mostra total acumulado visualmente (altura total)
- Identifica contribuição de cada BU
- Fluxo visual suave entre períodos

**Desvantagens:**
- Pode ser difícil comparar BUs que não estão na base
- Menos preciso para leitura de valores individuais

---

### Opção 4: Barras Empilhadas com Barra de Meta Separada (Atual + Refinamento)

```text
                      Faturamento por Período
   ┌─────────────────────────────────────────────────────────┐
   │   [■ M.Atual] [■ O2 TAX] [■ Oxy] [■ Franq] [□ Meta]     │
   │                                                         │
   │   ████████████ ░░░░░░░░░░░░                             │
   │   ██████████▓▓ ░░░░░░░░░░░░    ████████████████ ░░░░░   │
   │   ████████▓▓▓▓ ░░░░░░░░░░░░    ██████████████▓▓ ░░░░░   │
   │      Jan           Meta           Fev          Meta     │
   │                                                         │
   └─────────────────────────────────────────────────────────┘
```

**Vantagens:**
- Total claro (altura da barra empilhada)
- Comparação lado a lado com meta
- Drill-down natural por BU

**Desvantagens:**
- Ocupa mais espaço horizontal
- Meta como barra separada pode confundir

---

### Opção 5: Dashboard Compacto (Mini Cards + Gráfico Consolidado) - RECOMENDAÇÃO BI

```text
   ┌─────────────────────────────────────────────────────────┐
   │   FATURAMENTO POR PERÍODO                               │
   ├──────────┬──────────┬──────────┬──────────┬────────────┤
   │ M.Atual  │ O2 TAX   │ Oxy Hack │ Franquia │   TOTAL    │
   │ R$ 2.1M  │ R$ 180k  │ R$ 324k  │ R$ 420k  │  R$ 3.0M   │
   │ ▆▆▆▆▆▆▆▆ │ ▆▆▆▆     │ ▆▆▆▆▆    │ ▆▆▆▆▆▆   │  ▆▆▆▆▆▆▆▆  │
   │ 85% meta │ 72% meta │ 90% meta │ 100% meta│  87% meta  │
   ├──────────┴──────────┴──────────┴──────────┴────────────┤
   │                                                         │
   │   Gráfico de barras empilhadas (total por período)      │
   │   ████████████████████████████████████                  │
   │   ██████████████████████████▓▓▓▓▓▓▓▓▓▓                  │
   │   ████████████████████▓▓▓▓▓▓░░░░░░░░░░                  │
   │       Jan      Fev      Mar      Abr                    │
   │                                                         │
   │   [-- Meta] linha tracejada verde                       │
   └─────────────────────────────────────────────────────────┘
```

**Vantagens:**
- **KPIs visíveis no topo** - responde a pergunta principal rapidamente
- **Sparklines por BU** - mostra tendência individual sem poluir
- Gráfico principal focado no **total consolidado**
- Drill-down ao clicar em cada card ou barra
- Separa "resumo" de "detalhes"

**Desvantagens:**
- Requer mais código/complexidade
- Ocupa mais espaço vertical

---

### Comparativo Rápido

| Opção | Clareza Multi-BU | Comparação | Total Visível | Complexidade |
|-------|------------------|------------|---------------|--------------|
| 1. Barras Agrupadas | Alta | Alta | Baixa | Baixa |
| 2. Linhas Multi | Alta | Media | Nao | Baixa |
| 3. Area Empilhada | Media | Baixa | Alta | Media |
| 4. Barras + Meta | Alta | Alta | Alta | Media |
| **5. Dashboard (Recomendado)** | **Muito Alta** | **Alta** | **Alta** | **Alta** |

---

### Minha Recomendação: Opção 5 (Dashboard Compacto)

Para um dashboard executivo, a **Opção 5** é a mais clara porque:

1. **Responde rapidamente**: "Quanto vendemos por BU?" - cards no topo
2. **Mostra tendência**: Sparklines em cada card
3. **Foco no consolidado**: Gráfico principal mostra o total
4. **Drill-down natural**: Clique no card ou barra para detalhes

---

### Alternativa Simples: Opção 1 (Barras Agrupadas)

Se preferir algo mais simples e rápido de implementar, a **Opção 1** funciona bem e segue o padrão do `SalesGoalsCharts.tsx` que já existe no projeto.

---

Qual opção você prefere? Posso implementar qualquer uma delas ou uma combinação de ideias.

