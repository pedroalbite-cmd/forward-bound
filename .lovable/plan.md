

## Plano: Redesenhar Gráfico de Faturamento para Multi-BU

### Problema Atual

O gráfico "Faturamento por Período" foi projetado para o **Modelo Atual** que possui:
- MRR (Receita Recorrente)
- Setup (Implantação)
- Pontual (Único)

Quando múltiplas BUs estão selecionadas, a visualização fica confusa porque:
- **O2 TAX, Oxy Hacker, Franquia** = Vendas pontuais (não têm MRR real)
- Tudo vai para a categoria "Pontual", desbalanceando o gráfico
- Não fica claro de qual BU vem cada valor

---

### Proposta: Visualização por BU (Recomendação de BI)

Em vez de empilhar **MRR/Setup/Pontual**, empilhar **por BU** quando múltiplas estão selecionadas:

| Cenário | Tipo de Gráfico |
|---------|-----------------|
| **1 BU selecionada** (ex: só Modelo Atual) | Manter MRR + Setup + Pontual empilhados |
| **Múltiplas BUs selecionadas** | Mostrar faturamento total por BU empilhados |

---

### Design Visual

#### Cenário 1: Uma BU (Modelo Atual)
```
┌─────────────────────────────────────────────────┐
│  Faturamento por Período - Modelo Atual         │
├─────────────────────────────────────────────────┤
│   [■ MRR] [■ Setup] [■ Pontual] [-- Meta]       │
│                                                 │
│   █████████                                     │
│   ████████▓▓▓                                   │
│   ███████▓▓▓░░                                  │
│   Jan   Fev   Mar   Abr   Mai                   │
└─────────────────────────────────────────────────┘
```

#### Cenário 2: Múltiplas BUs (Consolidado)
```
┌─────────────────────────────────────────────────┐
│  Faturamento por Período - Consolidado          │
├─────────────────────────────────────────────────┤
│   [■ M.Atual] [■ O2 TAX] [■ Oxy] [■ Franq]      │
│                                                 │
│   ████████████████████                          │
│   ██████████████████▓▓▓▓                        │
│   █████████████████▓▓▓▓░░░░                     │
│   Jan   Fev   Mar   Abr   Mai                   │
└─────────────────────────────────────────────────┘
```

---

### Cores por BU

| BU | Cor | Código |
|----|-----|--------|
| Modelo Atual | Azul | `hsl(var(--primary))` / `#3b82f6` |
| O2 TAX | Âmbar | `hsl(var(--warning))` / `#f59e0b` |
| Oxy Hacker | Roxo | `hsl(var(--accent))` / `#8b5cf6` |
| Franquia | Verde | `hsl(var(--franquia))` / `#22c55e` |

---

### Implementação Técnica

#### Arquivo: `src/components/planning/RevenueBreakdownChart.tsx`

**1. Detectar modo de exibição:**
```typescript
const useBreakdownByBU = selectedBUs.length > 1;
const singleBUKey = selectedBUs.length === 1 ? selectedBUs[0] : null;
```

**2. Alterar estrutura de dados:**
```typescript
// Modo Multi-BU: agregar por BU
interface MultibuChartDataPoint {
  label: string;
  modelo_atual: number;
  o2_tax: number;
  oxy_hacker: number;
  franquia: number;
  total: number;
  meta: number;
  startDate: Date;
  endDate: Date;
}

// Modo Single-BU: manter MRR/Setup/Pontual
interface SingleBuChartDataPoint {
  label: string;
  mrr: number;
  setup: number;
  pontual: number;
  total: number;
  meta: number;
  startDate: Date;
  endDate: Date;
}
```

**3. Renderização condicional do gráfico:**
```typescript
{useBreakdownByBU ? (
  // Barras empilhadas por BU
  <>
    {selectedBUs.includes('modelo_atual') && (
      <Bar dataKey="modelo_atual" stackId="revenue" fill="#3b82f6" name="Modelo Atual" />
    )}
    {selectedBUs.includes('o2_tax') && (
      <Bar dataKey="o2_tax" stackId="revenue" fill="#f59e0b" name="O2 TAX" />
    )}
    {selectedBUs.includes('oxy_hacker') && (
      <Bar dataKey="oxy_hacker" stackId="revenue" fill="#8b5cf6" name="Oxy Hacker" />
    )}
    {selectedBUs.includes('franquia') && (
      <Bar dataKey="franquia" stackId="revenue" fill="#22c55e" name="Franquia" />
    )}
  </>
) : (
  // Barras empilhadas MRR/Setup/Pontual (single BU)
  <>
    <Bar dataKey="mrr" stackId="revenue" fill="#3b82f6" name="MRR" />
    <Bar dataKey="setup" stackId="revenue" fill="#f97316" name="Setup" />
    <Bar dataKey="pontual" stackId="revenue" fill="#8b5cf6" name="Pontual" />
  </>
)}
```

**4. Atualizar header/legenda dinamicamente:**
```typescript
// Multi-BU mode
<div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
  <div className="flex items-center gap-2">
    <span className="text-muted-foreground">Total:</span>
    <span className="font-semibold text-green-500">{formatCompactCurrency(totals.total)}</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-sm border-2 border-green-500 border-dashed" />
    <span className="text-muted-foreground">Meta:</span>
    <span className="font-medium text-green-500">{formatCompactCurrency(totals.meta)}</span>
  </div>
  {useBreakdownByBU ? (
    // Mostrar totais por BU
    selectedBUs.map(bu => (
      <div key={bu} className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: BU_COLORS[bu] }} />
        <span className="text-muted-foreground">{BU_LABELS[bu]}:</span>
        <span className="font-medium">{formatCompactCurrency(totals[bu])}</span>
      </div>
    ))
  ) : (
    // Mostrar MRR/Setup/Pontual
    <>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm bg-blue-500" />
        <span>MRR: {formatCompactCurrency(totals.mrr)}</span>
      </div>
      {/* ... */}
    </>
  )}
</div>
```

**5. Atualizar drill-down:**
- No modo Multi-BU, adicionar a coluna "Produto" como primeira coluna
- No modo Single-BU (Modelo Atual), manter colunas MRR/Setup/Pontual

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planning/RevenueBreakdownChart.tsx` | Implementar lógica de modo dual (por BU vs por tipo de receita) |

---

### Benefícios

| Aspecto | Melhoria |
|---------|----------|
| **Clareza** | Fica óbvio de qual BU vem cada fatia do faturamento |
| **Comparabilidade** | Fácil comparar performance entre BUs no mesmo período |
| **Contexto** | Quando só 1 BU (Modelo Atual), mantém o breakdown MRR/Setup/Pontual útil para análise de mix |
| **Consistência** | Cores consistentes com o resto do dashboard |

---

### Resultado Esperado

1. **Consolidado** (todas BUs): Gráfico com 4 cores mostrando contribuição de cada BU
2. **Uma BU** (ex: Modelo Atual): Gráfico com breakdown MRR/Setup/Pontual como hoje
3. **2-3 BUs**: Gráfico com as cores das BUs selecionadas

