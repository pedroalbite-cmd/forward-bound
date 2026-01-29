

## Plano: Acelerômetros de Custo por Etapa do Funil

### Contexto Atual

A aba **Mkt Indicadores** já possui:
- ✅ `CostPerStageChart` - Uma visualização linear de círculos com CPL → CPMQL → CPRM → CPRR → CPP → CPV
- ✅ `PerformanceGauges` - Acelerômetros radiais para ROAS, ROI LTV, CAC, LTV, Investimento
- ✅ Dados de custo por etapa calculados no hook `useMarketingIndicators`

**O que está faltando:**
- ❌ **Acelerômetros radiais clicáveis** para cada custo (CPL, CPMQL, CPRM, CPRR, CPP, CPV)
- ❌ **Metas de referência** para cada custo (benchmark para saber se está bom ou ruim)
- ❌ **Drill-down** ao clicar mostrando breakdown por canal
- ❌ **Lógica de cores invertida** (custo menor = verde, custo maior = vermelho)

---

### A Nova Estrutura: Acelerômetros de Custo

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                           💰 Custo por Etapa do Funil                                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │   CPL    │   │  CPMQL   │   │   CPRM   │   │   CPRR   │   │   CPP    │   │   CPV    │ │
│  │ ◉ R$ 176 │   │ ◉ R$ 246 │   │ ◉ R$ 402 │   │ ◉ R$ 497 │   │ ◉ R$ 625 │   │ ◉ R$ 9.2k│ │
│  │   88%    │   │   92%    │   │   84%    │   │   89%    │   │  104% 🔴 │   │   98%    │ │
│  │Meta: 200 │   │Meta: 267 │   │Meta: 480 │   │Meta: 560 │   │Meta: 600 │   │Meta: 9.4k│ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                                                                          │
│  ⚠️ CPP acima da meta! Investigar taxa de conversão RR → Proposta                        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Indicadores de Custo Propostos

| Indicador | Nome | Descrição | Meta Sugerida | Lógica de Cor |
|-----------|------|-----------|---------------|---------------|
| **CPL** | Custo por Lead | Investimento ÷ Leads | R$ 200 | Invertida (menor = verde) |
| **CPMQL** | Custo por MQL | Investimento ÷ MQLs | R$ 280 | Invertida |
| **CPRM** | Custo por RM | Investimento ÷ Reuniões Marcadas | R$ 450 | Invertida |
| **CPRR** | Custo por RR | Investimento ÷ Reuniões Realizadas | R$ 550 | Invertida |
| **CPP** | Custo por Proposta | Investimento ÷ Propostas | R$ 650 | Invertida |
| **CPV** | Custo por Venda | Investimento ÷ Vendas | R$ 9.500 | Invertida |

---

### Drill-Down ao Clicar no Acelerômetro

Ao clicar em um acelerômetro (ex: CPMQL), abre um modal com:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  CPMQL - Custo por MQL                                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                                │
│  │ 💰 R$ 246│  │ 📊 711   │  │ 🎯 R$ 280│  │ 📉 12%   │                                │
│  │CPMQL Geral│  │ MQLs     │  │ Meta     │  │ Abaixo   │                                │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │   📊 CPMQL por Canal                │  │       📈 Eficiência (MQLs/Investimento) │  │
│  │                                     │  │                                         │  │
│  │   Meta Ads   ████████░░  R$ 234     │  │   Meta Ads    ██████████████░░  70%     │  │
│  │   Google Ads █████████░  R$ 233     │  │   Google Ads  █████████████░░░  65%     │  │
│  │   Eventos    ██████░░░░  R$ 346 ⚠️  │  │   Eventos     ████████░░░░░░░░  45%     │  │
│  │                                     │  │                                         │  │
│  └─────────────────────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  📋 Detalhamento por Canal                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│  │  Canal      │ Investimento │ MQLs  │ CPMQL  │ % Invest │ Taxa Conv │              ││
│  │  Meta Ads   │ R$ 85k       │ 364   │ R$ 234 │ 48.6%    │ 70%       │              ││
│  │  Google Ads │ R$ 62k       │ 266   │ R$ 233 │ 35.4%    │ 70%       │              ││
│  │  Eventos    │ R$ 28k       │ 81    │ R$ 346 │ 16.0%    │ 85%       │              ││
│  └─────────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Seção Técnica

#### Novos Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/planning/marketing-indicators/CostPerStageGauges.tsx` | Linha de acelerômetros radiais para CPL, CPMQL, etc. |

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/marketing-indicators/types.ts` | Adicionar `CostPerStageGoals` e métricas por canal |
| `src/hooks/useMarketingIndicators.ts` | Adicionar metas de custo e cálculos por canal |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Adicionar o novo componente, estado de drill-down |

#### Novas Interfaces

```typescript
// Metas de custo por etapa
interface CostPerStageGoals {
  cpl: number;    // Meta R$ 200
  cpmql: number;  // Meta R$ 280
  cprm: number;   // Meta R$ 450
  cprr: number;   // Meta R$ 550
  cpp: number;    // Meta R$ 650
  cpv: number;    // Meta R$ 9500
}

// Custo por canal por etapa
interface CostPerChannelStage {
  channelId: string;
  channelName: string;
  investment: number;
  leads: number;
  mqls: number;
  rms: number;
  rrs: number;
  propostas: number;
  vendas: number;
  cpl: number;
  cpmql: number;
  cprm: number;
  cprr: number;
  cpp: number;
  cpv: number;
}
```

#### Componente CostPerStageGauges

```typescript
interface CostGaugeProps {
  label: string;
  sublabel: string;
  value: number;
  goal: number;
  onClick?: () => void;
}

function CostGauge({ label, sublabel, value, goal, onClick }: CostGaugeProps) {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;
  // Invertido: abaixo da meta = verde (bom), acima = vermelho (ruim)
  const isGood = percentage <= 100;
  
  return (
    <Card className="cursor-pointer hover:border-primary/50" onClick={onClick}>
      <CardContent className="flex flex-col items-center p-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <RadialBarChart ...>
          {/* Gráfico radial */}
        </RadialBarChart>
        <span className="text-xl font-bold">{formatCurrency(value)}</span>
        <span className={isGood ? 'text-green-500' : 'text-red-500'}>
          {percentage.toFixed(0)}%
        </span>
        <span className="text-xs text-muted-foreground">Meta: {formatCurrency(goal)}</span>
      </CardContent>
    </Card>
  );
}

export function CostPerStageGauges({ 
  costPerStage, 
  goals,
  onCostClick 
}: CostPerStageGaugesProps) {
  const stages = [
    { key: 'cpl', label: 'CPL', sublabel: 'Lead' },
    { key: 'cpmql', label: 'CPMQL', sublabel: 'MQL' },
    { key: 'cprm', label: 'CPRM', sublabel: 'RM' },
    { key: 'cprr', label: 'CPRR', sublabel: 'RR' },
    { key: 'cpp', label: 'CPP', sublabel: 'Proposta' },
    { key: 'cpv', label: 'CPV', sublabel: 'Venda' },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custo por Etapa do Funil</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stages.map(stage => (
            <CostGauge
              key={stage.key}
              label={stage.label}
              sublabel={stage.sublabel}
              value={costPerStage[stage.key]}
              goal={goals[stage.key]}
              onClick={() => onCostClick(stage.key)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Fluxo de Implementação

1. **Atualizar tipos** - Adicionar `CostPerStageGoals` em `types.ts`
2. **Atualizar hook** - Adicionar metas de custo no `useMarketingIndicators`
3. **Criar componente** - `CostPerStageGauges.tsx` com acelerômetros clicáveis
4. **Integrar drill-down** - Usar `DetailSheet` existente para mostrar breakdown por canal
5. **Substituir visualização** - Trocar `CostPerStageChart` (círculos lineares) pelos acelerômetros radiais

---

### Valores de Meta Sugeridos

Baseado nas melhores práticas e benchmarks de CAC do mercado B2B SaaS:

| Métrica | Meta | Justificativa |
|---------|------|---------------|
| CPL | R$ 200 | Custo eficiente de lead em mercado B2B |
| CPMQL | R$ 280 | ~40% acima do CPL (conversão ~70%) |
| CPRM | R$ 450 | Considera taxa de agendamento (~60%) |
| CPRR | R$ 550 | Taxa show ~80% do agendado |
| CPP | R$ 650 | Taxa de proposta ~80% do RR |
| CPV | R$ 9.500 | Alinhado com CAC atual ~R$ 9.2k |

Esses valores serão configuráveis depois que a função de dados reais for implementada.

---

### Próximos Passos

1. ✅ Criar componentes e integrar na UI
2. 🔜 Conectar com dados reais (função a ser criada depois)
3. 🔜 Permitir configuração de metas pelo usuário

