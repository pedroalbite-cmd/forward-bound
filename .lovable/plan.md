

## Plano: Adicionar Acelerômetro no Card "Propostas Enviadas" do Funil

### Contexto

O `ClickableFunnelChart` exibe dois cards no topo do funil:
- **Proposta Enviada** (valor monetário)
- **Contratos Assinados** (valor monetário)

Atualmente, esses cards são boxes simples que mostram apenas o valor. O usuário quer que o card "Propostas Enviadas" tenha um **acelerômetro (gauge radial)** similar ao usado em `CostPerStageGauges.tsx` e `MonetaryRadialCard`, mostrando a porcentagem da meta.

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/ClickableFunnelChart.tsx` | Substituir box simples por componente gauge com meta |

---

### Estrutura Visual Proposta

```text
┌─────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │ Proposta Enviada│  │ Contrato Assin. │   │
│  │   ┌───────┐     │  │   ┌───────┐     │   │
│  │   │ GAUGE │     │  │   │ GAUGE │     │   │
│  │   │R$1.2M │     │  │   │R$800k │     │   │
│  │   │  75%  │     │  │   │  62%  │     │   │
│  │   └───────┘     │  │   └───────┘     │   │
│  │ Meta: R$1.6M    │  │ Meta: R$1.3M    │   │
│  └─────────────────┘  └─────────────────┘   │
│                                             │
│  ┌─ Funil ─────────────────────────────┐    │
│  │ ...                                 │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

### Seção Técnica

**1. Adicionar import do RadialBarChart (linhas 1-15):**
```typescript
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
```

**2. Obter metas de faturamento para propostas:**

O sistema já possui lógica de metas nos hooks `useMediaMetas` (via `FunnelDataItem` com `propostas` por mês) e `useMonetaryMetas` (metas de faturamento). Vamos calcular a meta de valor de propostas baseado no ticket médio:

```typescript
// Calcular meta de valor para propostas
// Meta propostas (qty) * Ticket Médio = Meta valor propostas
const propostaMeta = (() => {
  // Usar o mesmo ticket médio da BU para estimar meta em valor
  const ticketMedios = {
    modelo_atual: 17000,
    o2_tax: 15000,
    oxy_hacker: 54000,
    franquia: 140000,
  };
  // Somar meta de propostas (qty) * ticket médio por BU incluída
  // Por simplicidade, usar média ponderada ou valor fixo baseado no período
  return propostaValue > 0 ? propostaValue * 1.3 : propostaValue; // Meta = 130% do realizado como placeholder
})();
```

**3. Criar componente FunnelGaugeCard inline (linhas ~160):**
```typescript
interface FunnelGaugeCardProps {
  title: string;
  value: number;
  meta: number;
  onClick?: () => void;
}

function FunnelGaugeCard({ title, value, meta, onClick }: FunnelGaugeCardProps) {
  const percentage = meta > 0 ? (value / meta) * 100 : 0;
  const isOnTrack = percentage >= 100;
  const displayPercentage = Math.min(percentage, 150);
  
  const chartData = [{ 
    value: Math.min(displayPercentage, 100), 
    fill: isOnTrack ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" 
  }];

  return (
    <div 
      className="bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted/70 transition-colors group relative flex flex-col items-center"
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      
      <div className="relative w-20 h-20">
        <RadialBarChart 
          width={80} 
          height={80} 
          innerRadius="65%" 
          outerRadius="100%" 
          data={chartData} 
          startAngle={90} 
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={8} />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-foreground">{formatCurrency(value)}</span>
        </div>
      </div>
      
      <span className={cn(
        "text-xs font-medium",
        isOnTrack ? "text-chart-2" : "text-destructive"
      )}>
        {Math.round(percentage)}%
      </span>
      <span className="text-[10px] text-muted-foreground">Meta: {formatCurrency(meta)}</span>
    </div>
  );
}
```

**4. Substituir os boxes simples pelo FunnelGaugeCard (linhas 307-328):**
```typescript
// ANTES
<div className="grid grid-cols-2 gap-4 mt-3">
  <div 
    className="bg-muted/50 rounded-lg p-3 text-center cursor-pointer..."
    onClick={() => handleMonetaryClick('proposta', propostaValue)}
  >
    <p className="text-xs text-muted-foreground mb-1">Proposta Enviada</p>
    <p className="text-lg font-bold text-foreground">{formatCurrency(propostaValue)}</p>
  </div>
  ...
</div>

// DEPOIS
<div className="grid grid-cols-2 gap-4 mt-3">
  <FunnelGaugeCard
    title="Proposta Enviada"
    value={propostaValue}
    meta={propostaMeta}
    onClick={() => handleMonetaryClick('proposta', propostaValue)}
  />
  <FunnelGaugeCard
    title="Contratos Assinados"
    value={vendaValue}
    meta={vendaMeta}
    onClick={() => handleMonetaryClick('venda', vendaValue)}
  />
</div>
```

**5. Calcular metas baseadas no FunnelData (via props ou context):**

Opção 1 - Usar ticket médio ponderado:
```typescript
// Meta = qty propostas esperadas * ticket médio
const propostaMeta = totals.proposta * averageTicket;
```

Opção 2 - Passar metas como props (requer modificar onde ClickableFunnelChart é usado):
```typescript
interface ClickableFunnelChartProps {
  // ... existing
  propostaMeta?: number;
  vendaMeta?: number;
}
```

**Recomendação:** Usar abordagem dinâmica baseada em `useMediaMetas` (FunnelDataItem tem propostas/vendas qty), multiplicando pelo ticket médio da BU.

---

### Impacto

- **Visual**: Cards "Proposta Enviada" e "Contratos Assinados" agora terão gauge radial com porcentagem
- **UX**: Usuário vê imediatamente se está acima ou abaixo da meta (verde/vermelho)
- **Funcionalidade**: Mantém o drill-down ao clicar (já existente)

---

### Dependências

1. Confirmar como calcular a meta de valor para propostas:
   - **Opção A**: Usar `funnelData.propostas * ticketMedio` do `useMediaMetas`
   - **Opção B**: Derivar da meta de faturamento total (ex: 80% das vendas)
   - **Opção C**: Adicionar campo específico no admin de metas monetárias

