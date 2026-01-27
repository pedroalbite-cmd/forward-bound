

## Plano: Remover Dados de Conversão do ClickableFunnelChart

### Problema Identificado

O componente que está sendo renderizado na tela é o **`ClickableFunnelChart.tsx`**, não o `PeriodFunnelChart.tsx` que foi editado anteriormente. Por isso os percentuais de conversão continuam aparecendo.

---

### Modificações Necessárias

**Arquivo:** `src/components/planning/ClickableFunnelChart.tsx`

#### 1. Remover percentuais das barras (linhas 346-350)

```tsx
// REMOVER:
{index > 0 && (
  <span className="text-white/80 text-xs flex-shrink-0">
    ({stage.conversionPercent.toFixed(1)}%)
  </span>
)}
```

#### 2. Remover seção de legenda abaixo do funil (linhas 357-371)

```tsx
// REMOVER:
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

O funil exibirá apenas:
- Título "Funil do Período"
- Cards de "Proposta Enviada" e "Contratos Assinados" (valores monetários)
- Barras do funil com: número, nome da etapa e quantidade absoluta

**Sem** percentuais de conversão (nem dentro das barras, nem abaixo do funil).

---

### Resumo

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/planning/ClickableFunnelChart.tsx` | Modificar | Remover percentuais das barras (linhas 346-350) e seção de legenda (linhas 357-371) |

