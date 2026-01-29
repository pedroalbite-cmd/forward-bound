

## Plano: Adicionar Porcentagens de Conversão Entre Etapas do Funil

### Situação Atual

O código já calcula as taxas de conversão (linhas 133-140):
```typescript
{ number: 2, name: 'MQL', indicator: 'mql', value: totals.mql, conversionPercent: totals.leads > 0 ? (totals.mql / totals.leads) * 100 : 100 },
{ number: 3, name: 'Reuniões Agendadas', indicator: 'rm', value: totals.rm, conversionPercent: totals.mql > 0 ? (totals.rm / totals.mql) * 100 : 0 },
// etc...
```

Porém, a renderização (linhas 329-335) exibe apenas o número da etapa, nome e quantidade:
```typescript
<span className="bg-white/20 rounded-full w-5 h-5">{stage.number}</span>
<span className="hidden sm:inline truncate">{stage.name}</span>
<span className="font-bold">{formatNumber(stage.value)}</span>
```

---

### Solução Proposta

Adicionar a porcentagem de conversão ao lado do valor de cada etapa (exceto Leads que é sempre 100%):

```text
                        ANTES                           DEPOIS
   ┌─────────────────────────────────┐    ┌─────────────────────────────────────┐
   │ (1) Leads              1.234    │    │ (1) Leads                   1.234   │
   │ (2) MQL                  567    │    │ (2) MQL              567 (46%)      │
   │ (3) Reuniões Agendadas   234    │    │ (3) Reuniões Agend.  234 (41%)      │
   │ (4) Reunião Realizada    189    │    │ (4) Reunião Realiz.  189 (81%)      │
   │ (5) Proposta Enviada      87    │    │ (5) Proposta Env.     87 (46%)      │
   │ (6) Contrato Assinado     23    │    │ (6) Contrato Ass.     23 (26%)      │
   └─────────────────────────────────┘    └─────────────────────────────────────┘
```

---

### Arquivo a Modificar

**`src/components/planning/ClickableFunnelChart.tsx`**

#### Linhas 329-335 - Adicionar Conversão

**Antes:**
```tsx
<div className="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap overflow-hidden">
  <span className="bg-white/20 rounded-full w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs">
    {stage.number}
  </span>
  <span className="hidden sm:inline truncate">{stage.name}</span>
  <span className="font-bold flex-shrink-0">{formatNumber(stage.value)}</span>
</div>
```

**Depois:**
```tsx
<div className="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap overflow-hidden">
  <span className="bg-white/20 rounded-full w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs">
    {stage.number}
  </span>
  <span className="hidden sm:inline truncate">{stage.name}</span>
  <span className="font-bold flex-shrink-0">{formatNumber(stage.value)}</span>
  {index > 0 && stage.value > 0 && (
    <span className="text-xs text-white/70 flex-shrink-0">
      ({stage.conversionPercent.toFixed(0)}%)
    </span>
  )}
</div>
```

---

### Resultado Visual

| Etapa | Quantidade | Conversão |
|-------|------------|-----------|
| Leads | 1.234 | - |
| MQL | 567 | (46%) |
| Reuniões Agendadas | 234 | (41%) |
| Reunião Realizada | 189 | (81%) |
| Proposta Enviada | 87 | (46%) |
| Contrato Assinado | 23 | (26%) |

A porcentagem indica quantas pessoas "sobreviveram" de uma etapa para a próxima.

---

### Observação

A conversão é calculada de etapa para etapa anterior (não em relação ao topo do funil):
- MQL→Leads: 567/1234 = 46%
- RM→MQL: 234/567 = 41%
- RR→RM: 189/234 = 81%
- Proposta→RR: 87/189 = 46%
- Venda→Proposta: 23/87 = 26%

