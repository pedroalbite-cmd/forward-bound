
## Solução: Área Colapsável de KPIs e Gráficos no Drill-Down

### Problema

O modal de drill-down (DetailSheet) exibe:
- KPIs (5 cards) → ~100px
- Gráficos (3 charts) → ~200px
- Contador de registros → ~40px
- Header do modal → ~60px

**Total ocupado: ~400px** de um modal de 90vh (~700px em tela típica)

Resultado: **Sobram apenas ~300px para a tabela** (3-4 linhas visíveis), e o cálculo `h-[calc(90vh-220px)]` não considera o conteúdo dinâmico.

---

### Solução Recomendada: Collapsible Analytics Section

Implementar um **Collapsible** (acordeão) que agrupa KPIs + Charts e permite ao usuário:
- Ver a análise completa quando quiser (expandido por padrão)
- Minimizar para ver mais registros da tabela (1 clique)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Vendas - Análise de Valor (TCV)                            [X] │
│  19 contratos | TCV: R$ 1.6M | MRR: R$ 106k...                  │
├─────────────────────────────────────────────────────────────────┤
│  ▼ Análise Visual                                    [Recolher] │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                        │
│  │ 19  │ │262k │ │106k │ │ 36k │ │1.6M │  ← KPIs                │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                        │
│  [Chart: TCV por Closer] [Chart: TCV por SDR] [Pie: Composição] │
├─────────────────────────────────────────────────────────────────┤
│  19 registros                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Produto │ Empresa       │ Data │ MRR   │ Setup  │ TCV  │...││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ CaaS    │ KV TRANSPORT. │ -    │ -     │ 12.000 │ 12k  │...││
│  │ CaaS    │ MV ATACADO    │ 29/1 │10.000 │ -      │ 10k  │...││
│  │ ...     │ ...           │ ...  │ ...   │ ...    │ ...  │...││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

Quando recolhido:
```text
│  ▶ Análise Visual                                    [Expandir] │
├─────────────────────────────────────────────────────────────────┤
│  19 registros                                                   │
│  [... TABELA COM MUITO MAIS ESPAÇO ...]                         │
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/indicators/DetailSheet.tsx` | Adicionar Collapsible ao redor de KPIs + Charts |

---

### Implementação

#### 1. Adicionar import do Collapsible

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
```

#### 2. Adicionar estado para controlar expansão

```typescript
const [analyticsExpanded, setAnalyticsExpanded] = useState(true);
```

#### 3. Envolver KPIs + Charts em Collapsible

Substituir a seção atual por:

```tsx
{(kpis && kpis.length > 0) || (charts && charts.length > 0) ? (
  <Collapsible open={analyticsExpanded} onOpenChange={setAnalyticsExpanded}>
    <div className="flex items-center justify-between mb-2">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-sm font-medium">
          {analyticsExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Análise Visual
        </Button>
      </CollapsibleTrigger>
      <span className="text-xs text-muted-foreground">
        {analyticsExpanded ? 'Clique para recolher' : 'Clique para expandir'}
      </span>
    </div>
    <CollapsibleContent>
      {kpis && kpis.length > 0 && <KpiCardsRow kpis={kpis} />}
      {charts && charts.length > 0 && <DrillDownCharts charts={charts} />}
    </CollapsibleContent>
  </Collapsible>
) : null}
```

#### 4. Resetar estado ao fechar modal

Na função `handleOpenChange`:

```typescript
const handleOpenChange = (isOpen: boolean) => {
  if (!isOpen) {
    setSortState({ column: null, direction: 'none' });
    setAnalyticsExpanded(true); // Reset para próxima abertura
  }
  onOpenChange(isOpen);
};
```

---

### Alternativa: Ajustar altura dinâmica (mais complexa)

Se preferir não usar collapsible, outra opção é usar `flex-1` para a tabela ocupar todo o espaço restante:

```tsx
<div className="flex-1 overflow-hidden flex flex-col mt-4">
  {/* KPIs e Charts - altura fixa ou auto */}
  <div className="flex-shrink-0">
    {kpis && <KpiCardsRow kpis={kpis} />}
    {charts && <DrillDownCharts charts={charts} />}
  </div>
  
  {/* Tabela - ocupa o resto */}
  <div className="flex-1 min-h-0 overflow-hidden">
    <ScrollArea className="h-full">
      <Table>...</Table>
    </ScrollArea>
  </div>
</div>
```

Esta opção garante que a tabela use todo o espaço restante automaticamente, mas pode resultar em tabela muito pequena quando há muitos charts.

---

### Recomendação Final

A **solução Collapsible** é a mais flexível porque:

1. Usuário tem controle sobre o que ver
2. Mantém ambas as informações acessíveis
3. Padrão UX comum em dashboards
4. Simples de implementar

---

### Resultado Esperado

- **Modo expandido** (padrão): Dashboard analítico completo como está hoje
- **Modo recolhido** (1 clique): Tabela ocupa ~80% do modal, mostrando 10+ registros
