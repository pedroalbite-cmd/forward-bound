# Plano: SLA nos Indicadores

## Status: ✅ Implementado

O indicador SLA (tempo médio entre criação do lead e primeira tentativa de contato) foi implementado substituindo o ROI na aba de Indicadores.

### Cálculo
```
SLA = Entrada na fase "Tentativas de contato" - Data de Criação do Card
```

### Alterações Realizadas

| Arquivo | Mudança |
|---------|---------|
| `useModeloAtualAnalytics.ts` | Campo `dataCriacao`, mapeamento "Tentativas de contato" → mql, método `getAverageSlaMinutes` |
| `IndicatorsTab.tsx` | Substituição ROI → SLA, formato `duration` (Xh Ym), lógica de cores invertida |

### Meta Padrão
**30 minutos** - Pode ser ajustado posteriormente conforme KRs da equipe.

### Lógica de Cores
- 🟢 Verde: SLA ≤ meta (rápido = bom)
- 🔴 Vermelho: SLA > meta (lento = ruim)

### Observações
- SLA disponível apenas para Modelo Atual (única BU com fase "Tentativas de contato")
- ROI permanece disponível na aba Marketing Indicators
