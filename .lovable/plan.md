
## Plano: Mini-Dashboard Visual nos Drill-Downs

### Situação Atual

A implementação atual inclui:
- ✅ Títulos estratégicos (ex: "Propostas - Onde o Pipeline Está Travando?")
- ✅ Descrições com métricas agregadas em texto
- ✅ Tabela com alertas visuais (🔴/⚠️/✅)

### O Que Está Faltando

O usuário quer visualizar as métricas de forma mais visual e conectada - não apenas texto corrido, mas sim:
- **KPI Cards visuais** no topo do modal (mini cards destacando métricas-chave)
- **Gráfico de distribuição** (opcional, para visualizar padrões)

---

### A Nova Estrutura do Modal

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  TÍTULO: "Propostas - Onde o Pipeline Está Travando?"                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 📊 12    │  │ 💰 R$2.1M│  │ 🎯 R$175k│  │ ⚠️ 4     │  │ 🔴 R$800k│  │
│  │Propostas │  │ Pipeline │  │  Ticket  │  │Envelhecid│  │ em Risco │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│  📋 12 registros                                 [ordenar por coluna]   │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Tabela com dados e alertas visuais                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Componentes a Criar

#### 1. `KpiCard` - Mini Card de Métrica

Um pequeno card destacando uma métrica individual com:
- Ícone representativo (📊, 💰, ⚠️, etc.)
- Valor principal (grande, destacado)
- Label descritivo (pequeno, abaixo)
- Cor de destaque opcional (verde = bom, vermelho = atenção)

#### 2. `KpiCardsRow` - Linha de KPIs

Container que organiza 3-5 KPI cards horizontalmente no topo do modal.

---

### KPIs por Indicador

| Indicador | KPI 1 | KPI 2 | KPI 3 | KPI 4 | KPI 5 |
|-----------|-------|-------|-------|-------|-------|
| **MQL** | Total MQLs | % Premium | Tempo Médio | Top SDR | - |
| **RM** | Total Reuniões | Taxa MQL→RM | Tempo Médio | Top Closer | - |
| **RR** | Realizadas | Taxa Show | No-Shows | Potencial R$ | Top Closer |
| **Proposta** | Total | Pipeline R$ | Ticket Médio | Envelhecidas | Valor em Risco |
| **Venda** | Contratos | Total R$ | % MRR | % Setup | Top Closer |
| **SLA** | Leads | SLA Médio | % Meta | Mediana | Outliers |
| **Faturamento** | Total R$ | % MRR | % Setup | % Pontual | vs Meta |
| **MRR** | Contratos | Total/mês | ARR | Média | Maior |
| **Setup** | Projetos | Total R$ | Média | % Fat. | Maior |
| **Pontual** | Ocorrências | Total R$ | Média | % Fat. | Maior |

---

### Seção Técnica

#### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/planning/indicators/KpiCard.tsx` | Componente de mini card individual |
| `src/components/planning/indicators/KpiCardsRow.tsx` | Container para linha de KPIs |

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/indicators/DetailSheet.tsx` | Adicionar prop `kpis` e renderizar `KpiCardsRow` no topo |
| `src/components/planning/IndicatorsTab.tsx` | Configurar KPIs específicos para cada indicador nos handlers |

#### Interface do KPI

```typescript
interface KpiItem {
  icon: string;           // Emoji ou ícone
  value: string | number; // Valor principal
  label: string;          // Descrição curta
  highlight?: 'success' | 'warning' | 'danger' | 'neutral';
}
```

#### Exemplo de Uso no Handler

```typescript
case 'proposta': {
  // ... cálculos existentes ...
  
  const kpis: KpiItem[] = [
    { icon: '📊', value: items.length, label: 'Propostas', highlight: 'neutral' },
    { icon: '💰', value: formatCompactCurrency(pipeline), label: 'Pipeline', highlight: 'neutral' },
    { icon: '🎯', value: formatCompactCurrency(ticketMedio), label: 'Ticket Médio', highlight: 'neutral' },
    { icon: '⚠️', value: propostasAntigas.length, label: 'Envelhecidas', highlight: propostasAntigas.length > 0 ? 'warning' : 'success' },
    { icon: '🔴', value: formatCompactCurrency(valorEmRisco), label: 'em Risco', highlight: valorEmRisco > 0 ? 'danger' : 'success' },
  ];
  
  setDetailSheetKpis(kpis);
  // ... resto do código ...
}
```

#### Componente KpiCard

```typescript
const KpiCard = ({ icon, value, label, highlight = 'neutral' }: KpiItem) => {
  const colorClasses = {
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    danger: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    neutral: 'bg-muted/50 border-border',
  };

  return (
    <div className={cn('flex flex-col items-center p-3 rounded-lg border', colorClasses[highlight])}>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
};
```

---

### Resultado Final

Cada drill-down agora terá:

1. **Título estratégico** - Pergunta de negócio clara
2. **Linha de KPI Cards** - 3-5 métricas visuais destacadas no topo
3. **Descrição opcional** - Texto complementar se necessário
4. **Tabela detalhada** - Lista completa com alertas visuais

Isso transforma o modal de uma simples lista em um **mini-dashboard analítico** que responde perguntas de negócio de forma visual e imediata.
