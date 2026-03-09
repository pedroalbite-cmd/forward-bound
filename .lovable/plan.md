

## Plano: Redesign do Banner TCV com Material Design do projeto

### Problema
O banner atual usa gradiente hardcoded (emerald/teal/cyan) que destoa completamente do design system do projeto. Precisa usar as CSS variables do tema, ter toggle de visibilidade, e ocupar mais espaço visual.

### Solução

**Arquivo**: `src/components/planning/indicators/TcvHeroBanner.tsx` — reescrever completamente

**Design alinhado ao projeto:**
- Usar `Card` + `bg-card border-border` como base (igual aos outros widgets)
- Borda left accent com `border-l-4 border-l-primary` para destaque
- Cores do tema: `text-foreground`, `text-muted-foreground`, `hsl(var(--chart-2))` para valores positivos
- Fundo sutil com `bg-primary/5` para diferenciar sem destoar

**Layout expandido (ocupa mais espaço):**
- Seção principal com valor TCV grande (`text-5xl font-display font-bold`)
- Grid 2x2 ou 4 colunas com cards internos para: MRR Anualizado, Setup, Pontual, Ticket Médio
- Cada sub-card com icone, label e valor — usando `bg-muted/50 rounded-lg p-4`
- Barra de progresso visual mostrando proporção MRR vs Setup vs Pontual (DistributionBar style)

**Toggle de visibilidade:**
- Botão com `Switch` ou `Button` outline no header: "Mostrar TCV" / "Ocultar TCV"
- Estado salvo em `useState` (colapsável)
- Quando oculto, mostra apenas uma linha compacta com o valor total e o botão para expandir
- Usar `Collapsible` do Radix (mesmo padrão do `RevenuePaceChart`)

**Alteração em `IndicatorsTab.tsx`:**
- Nenhuma mudança necessária, a prop `vendaItems` já é passada corretamente

### Estrutura visual (expandido)

```text
┌─────────────────────────────────────────────────────────┐
│ 💰 TCV Gerado no Período         12 contratos  [▼ Hide]│
│                                                         │
│   R$ 1.250.000                                          │
│   ████████████████░░░░░░  (barra MRR | Setup | Pontual) │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │MRR x12   │ │Setup     │ │Pontual   │ │Ticket Méd│   │
│  │R$ 960k   │ │R$ 180k   │ │R$ 110k   │ │R$ 104k   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

```text
Colapsado:
┌─────────────────────────────────────────────────────────┐
│ 💰 TCV Gerado: R$ 1.250.000  |  12 contratos   [▶ Show]│
└─────────────────────────────────────────────────────────┘
```

