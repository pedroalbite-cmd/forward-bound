

## Adicionar Breakdown por Tier de Faturamento no Card de Contratos Assinados

### Objetivo

Enriquecer o card "Vendas" (Contratos Assinados) na aba Indicadores para mostrar, além do total e percentual de meta, uma distribuição visual por tier de faturamento do cliente. Isso permitirá ver rapidamente a composição das vendas sem precisar abrir o drill-down.

---

### Visual Proposto

O card de Vendas será expandido para incluir mini-barras horizontais mostrando a quantidade de vendas por tier:

```text
┌──────────────────────────────┐
│           Vendas             │
│     ┌─────────────────┐      │
│     │       12        │      │
│     │      75%        │      │
│     │   (Meta: 16)    │      │
│     └─────────────────┘      │
│ ─────────────────────────────│
│  Até R$ 50k      ██░░░░  2   │
│  R$ 50k - 200k   ████░░  4   │
│  R$ 200k - 1M    ██████  6   │
│  Acima de 1M     ░░░░░░  0   │
└──────────────────────────────┘
```

---

### Abordagem Técnica

**1. Criar um novo componente especializado:**

Criar `VendasRadialCard` que estende o `RadialProgressCard` atual para incluir a seção de breakdown por tier.

**2. Passar dados de tier para o card:**

- Usar o hook `getItemsForIndicator('venda')` para obter os items de vendas
- Agrupar por `revenueRange` e calcular quantidade por tier
- Passar esses dados como prop adicional

**3. Renderizar mini-barras horizontais:**

Dentro do card, abaixo da meta, adicionar mini-barras compactas mostrando a distribuição.

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planning/IndicatorsTab.tsx` | Adicionar componente `VendasRadialCard` e lógica de agrupamento por tier |

---

### Implementação Detalhada

**1. Definir interface para breakdown por tier:**

```typescript
interface TierBreakdown {
  label: string;
  count: number;
  order: number;
}
```

**2. Criar o componente VendasRadialCard:**

```typescript
interface VendasRadialCardProps {
  title: string;
  realized: number;
  meta: number;
  tierBreakdown: TierBreakdown[];
  onClick?: () => void;
  isClickable?: boolean;
}

const VendasRadialCard = ({ 
  title, 
  realized, 
  meta, 
  tierBreakdown,
  onClick, 
  isClickable = false 
}: VendasRadialCardProps) => {
  const percentage = meta > 0 ? (realized / meta) * 100 : 0;
  const isAboveMeta = percentage >= 100;
  const maxCount = Math.max(...tierBreakdown.map(t => t.count), 1);

  return (
    <Card 
      className={cn(
        "bg-card border-border relative group transition-all duration-200",
        isClickable && "cursor-pointer hover:border-primary/50 hover:shadow-md"
      )}
      onClick={onClick}
    >
      {/* Header e gráfico radial existente */}
      ...
      
      {/* Novo: Breakdown por Tier */}
      {tierBreakdown.length > 0 && (
        <div className="px-4 pb-3 pt-2 border-t border-border/50 space-y-1.5">
          {tierBreakdown.map(tier => (
            <div key={tier.label} className="flex items-center gap-2 text-xs">
              <span className="w-20 truncate text-muted-foreground">{tier.label}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(tier.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right font-medium text-foreground">{tier.count}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
```

**3. Calcular breakdown no render:**

Na seção onde os cards são renderizados, calcular o breakdown para o indicador de vendas:

```typescript
const getVendasTierBreakdown = (): TierBreakdown[] => {
  const vendaItems = getItemsForIndicator('venda');
  const tierCounts = new Map<string, number>();
  
  vendaItems.forEach(item => {
    const tier = item.revenueRange || 'Não informado';
    tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1);
  });
  
  const tierOrder = ['Até R$ 50k', 'R$ 50k - 200k', 'R$ 200k - 1M', 'Acima de 1M'];
  
  return tierOrder
    .filter(tier => tierCounts.has(tier))
    .map((tier, index) => ({
      label: tier.replace('R$ ', '').replace('Até ', '<'),
      count: tierCounts.get(tier) || 0,
      order: index
    }));
};
```

**4. Usar o componente especializado para Vendas:**

```typescript
{indicatorConfigs.map((indicator) => (
  indicator.key === 'venda' ? (
    <VendasRadialCard 
      key={indicator.key}
      title={indicator.label}
      realized={getRealizedForIndicator(indicator)}
      meta={getMetaForIndicator(indicator)}
      tierBreakdown={getVendasTierBreakdown()}
      isClickable={true}
      onClick={() => handleRadialCardClick(indicator)}
    />
  ) : (
    <RadialProgressCard 
      key={indicator.key}
      title={indicator.label}
      realized={getRealizedForIndicator(indicator)}
      meta={getMetaForIndicator(indicator)}
      isClickable={true}
      onClick={() => handleRadialCardClick(indicator)}
    />
  )
))}
```

---

### Resultado Esperado

O card de Vendas será visualmente distinto dos demais, mostrando:
- O total de contratos assinados e percentual da meta (como hoje)
- Uma seção compacta abaixo com mini-barras horizontais por tier de faturamento
- Labels abreviados para economizar espaço (ex: "<50k", "50k-200k", etc.)

---

### Benefícios

1. **Visão rápida** - Ver distribuição sem precisar abrir drill-down
2. **Insight estratégico** - Identificar se as vendas estão concentradas em clientes maiores ou menores
3. **Consistência** - Mantém o visual dos outros cards, apenas expandindo o de Vendas
4. **Performance** - Usa os mesmos dados já carregados para o drill-down

