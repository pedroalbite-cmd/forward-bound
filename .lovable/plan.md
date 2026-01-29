

## Plano: Drill-Downs Estratégicos com Narrativa de Negócio

### O Problema Atual

Hoje cada drill-down mostra uma **lista genérica de cards** com colunas soltas. Falta:
- **Narrativa**: Por que estou olhando isso?
- **Contexto comparativo**: Isso é bom ou ruim?
- **Caminho para ação**: O que devo fazer com essa informação?

---

### A Nova Filosofia

Cada drill-down será um **mini-relatório executivo** que responde:

| Elemento | Pergunta |
|----------|----------|
| **Título** | Qual decisão preciso tomar? |
| **Descrição Rica** | Resumo executivo com métricas-chave conectadas |
| **Tabela** | Detalhes com alertas visuais para anomalias |

---

### Os 10 Drill-Downs Redesenhados

---

#### 1. MQL - "De Onde Vêm Nossos Melhores Leads?"

**Descrição Rica (uma frase que conta a história):**
```
{X} MQLs captados | {Y}% são faixa premium (>R$50k) | SDR mais ativo: {Nome} ({Z} leads) | Tempo médio para qualificar: {W} dias
```

**Insight Conectado**: Se `% premium` é baixo, estamos atraindo leads errados. Se `tempo para qualificar` é alto, há gargalo na prospecção.

**Colunas com Alertas Visuais:**
| Coluna | Alerta Visual |
|--------|---------------|
| Empresa | - |
| Faixa Faturamento | Badge colorido (verde = premium, amarelo = médio, cinza = pequeno) |
| Dias até Qualificar | 🔴 se > 7 dias, ⚠️ se > 3 dias |
| SDR Responsável | - |
| Data | - |

---

#### 2. RM - "Estamos Convertendo MQLs em Reuniões?"

**Descrição Rica:**
```
{X} reuniões agendadas | Taxa MQL→RM: {Y}% | Tempo médio MQL→Agendar: {Z} dias | Top Closer: {Nome} ({W} reuniões)
```

**Insight Conectado**: `Taxa MQL→RM` baixa = qualificação fraca ou prospecção ineficiente.

**Colunas:**
| Coluna | Alerta Visual |
|--------|---------------|
| Empresa | - |
| Closer | - |
| Dias como MQL antes de Agendar | 🔴 se > 14 dias |
| Faixa Faturamento | Badge colorido |
| Data Agendamento | - |

---

#### 3. RR - "Quem Apareceu nas Reuniões?"

**Descrição Rica:**
```
{X} reuniões realizadas | Taxa Show: {Y}% ({X} de {Z} agendadas) | Closer com melhor show: {Nome} ({W}%) | Potencial em mesa: R$ {V}k
```

**Insight Conectado**: `Taxa Show` baixa = reuniões agendadas muito distantes ou confirmação fraca.

**Colunas:**
| Coluna | Alerta Visual |
|--------|---------------|
| Empresa | - |
| Closer | - |
| Faixa Faturamento | Badge colorido |
| Tempo entre Agendar e Realizar | ⚠️ se > 7 dias (correlação com no-show) |
| Data Reunião | - |

---

#### 4. Proposta - "Onde o Pipeline Está Travando?"

**Descrição Rica:**
```
{X} propostas abertas | Pipeline: R$ {Y}k | Ticket médio: R$ {Z}k | ⚠️ {W} propostas com mais de 14 dias (R$ {V}k em risco)
```

**Insight Conectado**: Propostas antigas morrem. Destaque de **valor em risco** gera urgência.

**Colunas:**
| Coluna | Alerta Visual |
|--------|---------------|
| Empresa | - |
| Valor Total | - |
| MRR | - |
| Closer | - |
| Dias em Proposta | 🔴 se > 30 dias, ⚠️ se > 14 dias |
| Data Envio | - |

**Ordenação Padrão**: Por "Dias em Proposta" decrescente (mais antigas primeiro = ação imediata).

---

#### 5. Venda - "O Que Fechamos e Como?"

**Descrição Rica:**
```
{X} contratos fechados | Total: R$ {Y}k | Composição: MRR {Z}% + Setup {W}% + Pontual {V}% | Pódio: 🥇{Top1} 🥈{Top2} 🥉{Top3}
```

**Insight Conectado**: Composição mostra se estamos construindo **base recorrente** ou vivendo de **one-shots**.

**Colunas:**
| Coluna | Destaque |
|--------|----------|
| Empresa | - |
| MRR | Valor + % do total |
| Setup | Valor |
| Pontual | Valor |
| Total | **Negrito** |
| Closer | - |
| Ciclo (dias) | Lead→Venda (eficiência) |

---

#### 6. SLA - "Estamos Respondendo Rápido?"

**Descrição Rica:**
```
{X} leads analisados | SLA médio: {Y}m | Dentro da meta (<30m): {Z}% | Mediana: {W}m | ⚠️ {V} leads com SLA > 2h
```

**Insight Conectado**: `% dentro da meta` é a métrica principal. Destaque de **outliers graves** (>2h) mostra onde atacar.

**Colunas:**
| Coluna | Alerta Visual |
|--------|---------------|
| Empresa | - |
| Tempo SLA | ✅ se <30m (verde), ⚠️ se 30m-1h (amarelo), 🔴 se >1h (vermelho) |
| SDR Responsável | - |
| Data Criação | - |
| Data 1ª Tentativa | - |

**Ordenação Padrão**: Por "Tempo SLA" decrescente (piores primeiro = coaching).

---

#### 7. Faturamento - "De Onde Veio o Dinheiro?"

**Descrição Rica:**
```
Total: R$ {X}k | Composição: MRR R$ {Y}k ({Z}%) + Setup R$ {W}k ({V}%) + Pontual R$ {U}k ({T}%) | vs Meta: {S}% | Top cliente: {Nome} (R$ {R}k)
```

**Insight Conectado**: Composição revela **saúde do faturamento**. Alto % Pontual = risco de imprevisibilidade.

**Colunas:**
| Coluna | Destaque |
|--------|----------|
| Empresa | - |
| MRR | Valor |
| Setup | Valor |
| Pontual | Valor |
| Total | **Negrito** |
| % do Faturamento | Destaca concentração de receita |
| Closer | - |

---

#### 8. MRR - "Quanto de Base Recorrente Construímos?"

**Descrição Rica:**
```
{X} contratos com MRR | Total: R$ {Y}k/mês | ARR projetado: R$ {Z}M | Média: R$ {W}k | Maior contrato: {Nome} (R$ {V}k/mês)
```

**Insight Conectado**: ARR (MRR × 12) mostra impacto anual da base que estamos construindo.

**Colunas (filtro implícito: apenas vendas com MRR > 0):**
| Coluna | Destaque |
|--------|----------|
| Empresa | - |
| MRR | **Destaque principal** |
| % do MRR Total | Concentração |
| Total Contrato | Contexto |
| Closer | - |
| Data | - |

---

#### 9. Setup - "Quantas Implantações Vendemos?"

**Descrição Rica:**
```
{X} projetos com setup | Total: R$ {Y}k | Média: R$ {Z}k | Maior projeto: {Nome} (R$ {W}k) | Setup = {V}% do faturamento
```

**Insight Conectado**: `Setup / Faturamento` alto pode indicar dependência de projetos grandes vs. recorrência.

**Colunas (filtro implícito: apenas vendas com Setup > 0):**
| Coluna | Destaque |
|--------|----------|
| Empresa | - |
| Setup | **Destaque principal** |
| MRR Associado | Cliente também gera recorrência? |
| Total Contrato | - |
| Closer | - |
| Data | - |

---

#### 10. Pontual - "Receitas Extraordinárias"

**Descrição Rica:**
```
{X} ocorrências | Total: R$ {Y}k | Média: R$ {Z}k | Pontual = {W}% do faturamento | Maior: {Nome} (R$ {V}k)
```

**Insight Conectado**: Se `Pontual / Faturamento` é alto, receita é **imprevisível**. Idealmente < 20%.

**Colunas (filtro implícito: apenas vendas com Pontual > 0):**
| Coluna | Destaque |
|--------|----------|
| Empresa | - |
| Pontual | **Destaque principal** |
| MRR Associado | Cliente também é recorrente? (saúde) |
| Total Contrato | - |
| Closer | - |
| Data | - |

---

### Seção Técnica

#### Novos Campos no `DetailItem`

```typescript
export interface DetailItem {
  // Campos existentes...
  
  // Novos campos calculados para narrativa
  diasAteQualificar?: number;    // MQL: Data Entrada - Data Criação
  diasComoMQL?: number;          // RM: tempo antes de agendar
  diasEmProposta?: number;       // Proposta: aging atual
  cicloVenda?: number;           // Venda: Lead → Fechamento
  percentualTotal?: number;      // % deste item no total
  slaStatus?: 'ok' | 'warning' | 'danger'; // Visual do SLA
}
```

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/indicators/DetailSheet.tsx` | Expandir interface `DetailItem` com novos campos calculados |
| `src/components/planning/IndicatorsTab.tsx` | Refatorar `handleRadialCardClick` e `handleMonetaryCardClick` com lógica específica por indicador, incluindo cálculos de agregados e descrições ricas |
| `src/hooks/useModeloAtualAnalytics.ts` | Adicionar campos calculados no `toDetailItem` (diasAteQualificar, cicloVenda, etc.) |

#### Implementação - Formatadores Visuais com Alertas

```typescript
// Aging com alerta visual
const formatAgingWithAlert = (days: number) => {
  if (days > 30) return <span className="text-red-600 font-medium">{days}d 🔴</span>;
  if (days > 14) return <span className="text-amber-600">{days}d ⚠️</span>;
  return <span className="text-green-600">{days}d</span>;
};

// SLA com status visual
const formatSlaWithStatus = (minutes: number) => {
  if (minutes <= 30) return <Badge className="bg-green-100 text-green-800">✅ {Math.round(minutes)}m</Badge>;
  if (minutes <= 60) return <Badge className="bg-amber-100 text-amber-800">⚠️ {Math.round(minutes)}m</Badge>;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return <Badge className="bg-red-100 text-red-800">🔴 {hours}h{mins > 0 ? ` ${mins}m` : ''}</Badge>;
};

// Faixa de faturamento colorida
const formatRevenueRange = (range: string) => {
  const isPremium = range?.toLowerCase().includes('50') || range?.toLowerCase().includes('100');
  const isMedium = range?.toLowerCase().includes('20') || range?.toLowerCase().includes('30');
  
  if (isPremium) return <Badge className="bg-green-100 text-green-800">{range}</Badge>;
  if (isMedium) return <Badge className="bg-amber-100 text-amber-800">{range}</Badge>;
  return <Badge variant="secondary">{range || '-'}</Badge>;
};
```

#### Implementação - Exemplo Completo para Proposta

```typescript
case 'proposta': {
  const items = getItemsForIndicator('proposta');
  
  // Calcular aging para cada item
  const now = new Date();
  const itemsWithAging = items.map(item => ({
    ...item,
    diasEmProposta: item.date ? Math.floor((now.getTime() - new Date(item.date).getTime()) / 86400000) : 0
  }));
  
  // Métricas agregadas
  const pipeline = items.reduce((sum, i) => sum + (i.value || 0), 0);
  const ticketMedio = items.length > 0 ? pipeline / items.length : 0;
  const propostasAntigas = itemsWithAging.filter(i => i.diasEmProposta > 14);
  const valorEmRisco = propostasAntigas.reduce((sum, i) => sum + (i.value || 0), 0);
  
  // Descrição rica que conta a história
  const descricao = `${items.length} propostas abertas | Pipeline: ${formatCompactCurrency(pipeline)} | Ticket médio: ${formatCompactCurrency(ticketMedio)}` +
    (propostasAntigas.length > 0 
      ? ` | ⚠️ ${propostasAntigas.length} propostas com mais de 14 dias (${formatCompactCurrency(valorEmRisco)} em risco)` 
      : ' | ✅ Nenhuma proposta envelhecida');
  
  setDetailSheetTitle('Propostas - Onde Está Travando?');
  setDetailSheetDescription(descricao);
  setDetailSheetColumns([
    { key: 'company', label: 'Empresa' },
    { key: 'value', label: 'Valor Total', format: columnFormatters.currency },
    { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
    { key: 'responsible', label: 'Closer' },
    { key: 'diasEmProposta', label: 'Dias em Proposta', format: formatAgingWithAlert },
    { key: 'date', label: 'Data Envio', format: columnFormatters.date },
  ]);
  // Ordenar por aging decrescente (mais antigas primeiro)
  setDetailSheetItems(itemsWithAging.sort((a, b) => b.diasEmProposta - a.diasEmProposta));
  setDetailSheetOpen(true);
  return;
}
```

---

### Resultado Final

Cada drill-down agora:

1. **Conta uma história** no título (pergunta de negócio)
2. **Resume em uma frase** as métricas conectadas
3. **Destaca anomalias** com ícones visuais
4. **Ordena por urgência** (propostas velhas, SLAs ruins primeiro)
5. **Mostra todos os cards** para análise detalhada

