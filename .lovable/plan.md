

## Plano: Tornar Cada Gráfico de Indicador Colapsável Individualmente

### Objetivo

Permitir que o usuário minimize/expanda **cada gráfico individualmente** dentro da seção "Gráficos de Indicadores", em vez de colapsar toda a seção de uma vez.

---

### O Que Será Revertido

Remover a implementação anterior que envolvia toda a seção de gráficos em um único Collapsible:
- Remover o estado `chartsOpen` (linha 167)
- Remover o wrapper `Collapsible` da seção inteira (linhas 759-818)
- Restaurar a estrutura original da seção com o título "Gráficos de Indicadores" e o ToggleGroup

---

### Nova Implementação

Modificar o componente `IndicatorChartSection` (linhas 105-149) para ser colapsável individualmente:

**ANTES:**
```tsx
const IndicatorChartSection = ({ title, ... }) => (
  <Card className="bg-card border-border">
    <CardHeader className="pb-2">
      {/* Header com título e totais */}
    </CardHeader>
    <CardContent className="pt-0">
      {/* Gráfico */}
    </CardContent>
  </Card>
);
```

**DEPOIS:**
```tsx
const IndicatorChartSection = ({ title, ... }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="bg-card border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
                {isAccumulated && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Acumulado</span>
                )}
                {/* Chevron indicator */}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">{realizedLabel}: <span className="text-foreground font-medium">{formatNumber(realizedTotal)}</span></span>
                <span className="text-muted-foreground">Meta: <span className="text-foreground font-medium">{formatNumber(metaTotal)}</span></span>
              </div>
            </div>
            {/* Legenda fica visível sempre */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-chart-1 rounded" /><span className="text-xs text-muted-foreground">{isAccumulated ? 'Meta Acumulada' : 'Meta'}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-chart-2 rounded" /><span className="text-xs text-muted-foreground">{isAccumulated ? 'Realizado Acumulado' : 'Realizado'}</span></div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="h-72">
              {/* Gráfico ComposedChart */}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
```

---

### Comportamento por Gráfico

| Estado | Visualização |
|--------|-------------|
| Expandido (padrão) | Header clicável (título, valores, legenda) + gráfico completo |
| Minimizado | Apenas header (título, valores realizados/meta, legenda) com chevron indicando que pode expandir |

---

### UX Melhorado

- Cada card de gráfico tem um **chevron** no header indicando que é clicável
- **Hover effect** no header para indicar interatividade
- **Totais (Realizado/Meta) sempre visíveis** mesmo quando minimizado
- **Legenda sempre visível** para contexto
- Usuário pode minimizar gráficos específicos que não precisa ver no momento

---

### Resumo de Modificações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Modificar | 1) Remover estado `chartsOpen` e Collapsible da seção inteira. 2) Refatorar `IndicatorChartSection` para ter seu próprio estado e Collapsible interno. 3) Restaurar estrutura original da seção "Gráficos de Indicadores" |

