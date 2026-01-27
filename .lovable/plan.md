

## Plano: Substituir Gráfico de Leads por Reuniões Marcadas

### Objetivo

Substituir o gráfico "Qtd Leads" (componente `LeadsStackedChart`) pelo gráfico "Qtd Reuniões Marcadas" (indicador 'rm'), mantendo a mesma estrutura de design e funcionalidades de drill-down.

---

### Mudanças Necessárias

#### 1. Renomear e Refatorar o Componente

**Arquivo a Modificar:** `src/components/planning/LeadsStackedChart.tsx`

Renomear para `src/components/planning/MeetingsScheduledChart.tsx`

**Alterações principais:**
- Mudar o título do card de "Qtd Leads" para "Qtd Reuniões Marcadas"
- Mudar o indicador de `'leads'` para `'rm'` em todas as chamadas de hook
- Mudar a cor do gráfico de laranja (`#f97316`) para a cor do indicador RM (ex: `#3b82f6` - azul)
- Atualizar a legenda de "Leads Realizados" para "Reuniões Realizadas"
- Atualizar as colunas do DetailSheet para refletir dados de reunião
- Ajustar as metas: O2 TAX (504/ano), Oxy Hacker (300/ano), Franquia (360/ano)

---

### Estrutura do Novo Componente

```typescript
// src/components/planning/MeetingsScheduledChart.tsx

interface MeetingsScheduledChartProps {
  startDate: Date;
  endDate: Date;
  selectedBU: BUType | 'all';
  selectedBUs?: BUType[];
  selectedClosers?: string[];
}

export function MeetingsScheduledChart({ ... }: MeetingsScheduledChartProps) {
  // Usar hooks existentes com indicador 'rm' em vez de 'leads'
  const { getGroupedData: getModeloAtualGroupedData, getQtyForPeriod: getModeloAtualQty } = useModeloAtualMetas(startDate, endDate);
  
  // Mesma lógica do LeadsStackedChart, mas para 'rm'
  const getChartData = () => {
    if (hasSingleBU) {
      if (useModeloAtual) return getModeloAtualGroupedData('rm', startDate, endDate, grouping);
      // ...
    }
    // Multi-BU aggregation
  };
  
  // Metas para RM:
  // - Modelo Atual: via closersMetas ou funnelData
  // - O2 TAX: 504/ano (42/mês)
  // - Oxy Hacker: 300/ano (25/mês)
  // - Franquia: 360/ano (30/mês)
  
  return (
    <Card className="bg-card border-2 border-blue-500 relative group">
      <CardHeader>
        <CardTitle>Qtd Reuniões Marcadas</CardTitle>
        {/* ... */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-xs text-muted-foreground">Reuniões Realizadas</span>
        </div>
      </CardHeader>
      <CardContent>
        <BarChart data={chartData}>
          <Bar dataKey="meetings" fill="#3b82f6" name="Reuniões" />
        </BarChart>
      </CardContent>
    </Card>
  );
}
```

---

### Metas de Reuniões Marcadas por BU

| BU | Meta Anual | Meta Diária (÷365) |
|----|------------|-------------------|
| Modelo Atual | Via funnelData/closersMetas | Dinâmico |
| O2 TAX | 504 | 1.38 |
| Oxy Hacker | 300 | 0.82 |
| Franquia | 360 | 0.99 |

---

### Integração com o IndicatorsTab.tsx

**Arquivo a Modificar:** `src/components/planning/IndicatorsTab.tsx`

1. Atualizar o import:
```typescript
// ANTES
import { LeadsStackedChart } from "./LeadsStackedChart";

// DEPOIS  
import { MeetingsScheduledChart } from "./MeetingsScheduledChart";
```

2. Atualizar o uso do componente (linha ~1130):
```tsx
// ANTES
<LeadsStackedChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedBUs={selectedBUs} selectedClosers={selectedClosers} />

// DEPOIS
<MeetingsScheduledChart startDate={startDate} endDate={endDate} selectedBU={selectedBU} selectedBUs={selectedBUs} selectedClosers={selectedClosers} />
```

---

### Drill-down para Reuniões

O DetailSheet mostrará informações relevantes para reuniões:

| Coluna | Descrição |
|--------|-----------|
| Título | Nome do card/oportunidade |
| Empresa/Contato | Empresa ou nome do contato |
| Fase | Status atual (Agendada, Remarcar, etc.) |
| Data | Data da reunião marcada |
| Responsável | Closer responsável |

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/planning/LeadsStackedChart.tsx` | Deletar/Renomear | Será substituído por MeetingsScheduledChart |
| `src/components/planning/MeetingsScheduledChart.tsx` | Criar | Novo componente para Reuniões Marcadas |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Atualizar import e uso do componente |

---

### Validação de Funcionamento

Após a implementação, o gráfico deverá:

1. Exibir a quantidade de reuniões marcadas (fase 'rm') por período
2. Respeitar os filtros de BUs selecionadas
3. Respeitar o filtro de Closers (para Modelo Atual)
4. Respeitar o filtro de datas
5. Permitir drill-down ao clicar nas barras do gráfico
6. Exibir a lista de reuniões no DetailSheet com informações relevantes

