

## Plano: Remover Dados de Andamento do Funil

### Objetivo

Remover a seção de legenda/andamento que aparece abaixo do funil visual, que exibe as taxas de conversão entre cada etapa.

---

### Modificação

**Arquivo:** `src/components/planning/PeriodFunnelChart.tsx`

**O que remover (linhas 176-190):**

```tsx
{/* Legend */}
<div className="mt-4 pt-4 border-t border-border">
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
    {stages.slice(1).map((stage, index) => (
      <div key={stage.indicator} className="flex items-center gap-2">
        <span className="text-muted-foreground">
          {stages[index].name} → {stage.name}:
        </span>
        <span className="font-medium text-foreground">
          {stage.conversionPercent.toFixed(1)}%
        </span>
      </div>
    ))}
  </div>
</div>
```

---

### Resultado Esperado

O componente `PeriodFunnelChart` exibirá apenas:
1. O título "Funil do Período"
2. Os cards de "Proposta Enviada" e "Contratos Assinados" com valores monetários
3. O funil visual com as 6 etapas (Leads, MQL, RM, RR, Proposta, Venda)

A seção com as taxas de conversão entre etapas (ex: "Leads → MQL: 45.2%") será removida.

---

### Arquivo Modificado

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/planning/PeriodFunnelChart.tsx` | Modificar | Remover seção de legenda (linhas 176-190) |

