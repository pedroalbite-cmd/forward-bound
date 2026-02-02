
## Adicionar Visualização de Funil aos Cards do Plan Growth

### Problema Atual

Os cards de funil na aba "Plan Growth" (Consolidado 2026, Modelo Atual, O2 TAX, Oxy Hacker, Franquia) exibem apenas texto e badges sem uma representação visual clara do funil. O fundo das barras aparece "vazio" ou muito sutil.

### Solução

Adicionar barras coloridas com gradiente ao componente `SalesFunnelVisual` para criar uma visualização de funil mais impactante, similar ao usado na aba "Indicadores" (`ClickableFunnelChart`).

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planning/SalesFunnelVisual.tsx` | Adicionar barras coloridas com gradiente para cada etapa |

---

### Mudanças no Componente

**Arquivo: `src/components/planning/SalesFunnelVisual.tsx`**

**1. Adicionar cores para cada etapa do funil:**

```typescript
// Cores gradientes para cada etapa do funil (6 etapas)
const stageColors = [
  'from-orange-400 to-orange-500',   // Leads - laranja
  'from-emerald-400 to-cyan-500',    // MQL - verde/cyan
  'from-cyan-500 to-blue-500',       // RM - cyan/azul
  'from-blue-500 to-blue-600',       // RR - azul
  'from-blue-600 to-slate-500',      // Proposta - azul/slate
  'from-slate-500 to-slate-600',     // Venda - slate
];
```

**2. Atualizar o layout da barra do funil:**

Substituir a renderização atual que usa `background: linear-gradient(135deg, ${color}, ${color}99)` por uma barra com gradiente Tailwind:

```tsx
<div 
  className={`relative h-12 bg-gradient-to-r ${stageColors[index]} rounded-sm transition-all duration-300`}
  style={{ 
    width: `${widthPercent}%`,
    marginLeft: 'auto',
    marginRight: 'auto'
  }}
>
  <p className="absolute inset-0 flex items-center justify-center font-display font-bold text-white text-sm">
    {item.stage}
  </p>
</div>
```

**3. Ajustar larguras do funil:**

Usar percentuais progressivos para criar a forma afunilada:

```typescript
const widthPercent = 100 - (index * 12); // 100%, 88%, 76%, 64%, 52%, 40%
```

---

### Resultado Visual Esperado

```text
Antes (fundo vazio):
┌────────────────────────────────────┐
│   Leads                      12.318│
├────────────────────────────────────┤
│   MQL                         5.299│
├────────────────────────────────────┤
│   RM                          2.599│
└────────────────────────────────────┘

Depois (barras coloridas em forma de funil):
┌════════════════════════════════════┐  ← Laranja (100%)
│           L E A D S          12.318│
└════════════════════════════════════┘
   ┌═══════════════════════════════┐    ← Verde (88%)
   │          M Q L          5.299 │
   └═══════════════════════════════┘
      ┌════════════════════════════┐    ← Cyan (76%)
      │         R M         2.599  │
      └════════════════════════════┘
         ┌═════════════════════════┐    ← Azul (64%)
         │       R R        1.874  │
         └═════════════════════════┘
            ┌══════════════════════┐    ← Azul/Slate (52%)
            │   Proposta     1.651 │
            └══════════════════════┘
               ┌═══════════════════┐    ← Slate (40%)
               │   Venda     400   │
               └═══════════════════┘
```

---

### Código Completo Proposto

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FunnelStage {
  stage: string;
  value: number;
  percent: string;
}

interface SalesFunnelVisualProps {
  title: string;
  icon: React.ReactNode;
  stages: FunnelStage[];
  mqlToVenda: number;
  leadToVenda: number;
  color: string;
}

// Cores gradientes para cada etapa do funil
const stageColors = [
  'from-orange-400 to-orange-500',   // Leads
  'from-emerald-400 to-cyan-500',    // MQL
  'from-cyan-500 to-blue-500',       // RM
  'from-blue-500 to-blue-600',       // RR
  'from-blue-600 to-slate-500',      // Proposta
  'from-slate-500 to-slate-600',     // Venda
];

export function SalesFunnelVisual({ 
  title, 
  icon, 
  stages, 
  mqlToVenda, 
  leadToVenda, 
  color 
}: SalesFunnelVisualProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-1">
          {stages.map((item, index) => {
            const widthPercent = 100 - (index * 10);
            const isFirst = index === 0;
            const colorClass = stageColors[index] || stageColors[stageColors.length - 1];
            
            return (
              <div key={item.stage} className="flex items-center w-full max-w-2xl">
                {/* Conversion percentage on the left */}
                <div className="w-16 text-right pr-3">
                  {!isFirst && (
                    <Badge variant="outline" className="text-xs">
                      {item.percent !== "-" ? item.percent : "-"}
                    </Badge>
                  )}
                </div>
                
                {/* Funnel bar with gradient */}
                <div 
                  className={`relative h-10 bg-gradient-to-r ${colorClass} rounded-sm transition-all duration-300 flex items-center justify-center`}
                  style={{ 
                    width: `${widthPercent}%`,
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}
                >
                  <p className="font-display font-bold text-white text-sm">
                    {item.stage}
                  </p>
                </div>
                
                {/* Absolute value on the right */}
                <div className="w-20 text-left pl-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
                    {item.value.toLocaleString('pt-BR')}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Overall conversion badges */}
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            Conversão MQL → Venda: {(mqlToVenda * 100).toFixed(1)}%
          </Badge>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            Conversão Lead → Venda: {(leadToVenda * 100).toFixed(1)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Principais Diferenças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Cores das barras | Uma cor única (transparente/sutil) | Gradientes coloridos por etapa |
| Altura das barras | `py-3` (padding) | `h-10` (altura fixa) |
| Gap entre barras | `mb-2` | `gap-1` |
| Texto | `text-primary-foreground` | `text-white` (contraste) |
| Largura mínima | 100% - (index * 12%) | 100% - (index * 10%) |

---

### Nota

A prop `color` será mantida na interface para compatibilidade, mas as cores do funil agora usarão o array `stageColors` fixo para manter consistência visual com a aba "Indicadores".
