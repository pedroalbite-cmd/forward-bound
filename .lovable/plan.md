

## Plano: Drill-down por Origem do Lead dentro de Tipo de Origem

### Objetivo
Ao clicar em uma linha de Tipo de Origem (ex: "Mídia Paga"), expandir sub-linhas mostrando o breakdown por `origemLead` com os mesmos dados de funil.

### Alterações

**`ConversionsByChannelChart.tsx`** — Único arquivo modificado

1. **State**: Adicionar `useState<string | null>` para controlar qual tipo está expandido (toggle)

2. **Dados**: No `useMemo`, além de agrupar por `tipoOrigem`, também agrupar por `tipoOrigem + origemLead` para gerar sub-linhas
   - Novo map: `Map<string, Map<string, OrigemRow>>` onde a chave externa é `tipoOrigem` e interna é `origemLead`
   - `origemLead` vazio → "(Sem origem)"

3. **UI**: 
   - Linha do tipo de origem vira clicável com `cursor-pointer` e ícone `ChevronRight`/`ChevronDown`
   - Quando expandida, renderizar sub-linhas com `origemLead` indentadas (padding-left maior, texto menor, bg levemente diferente)
   - Sub-linhas têm os mesmos 7 dados: Leads, MQLs, RM, RR, Propostas, Vendas, Conv. L→V

### Estrutura visual

```text
▶ Mídia Paga        | 120 | 80 | 45 | 30 | 15 | 8 | 6.7%
▼ Indicação         |  40 | 25 | 18 | 12 |  6 | 4 | 10.0%
    Indicação cliente|  25 | 15 | 12 |  8 |  4 | 3 | 12.0%
    Indicação parceiro| 15 | 10 |  6 |  4 |  2 | 1 |  6.7%
  Evento            |  30 | 20 | 10 |  8 |  5 | 3 | 10.0%
  Total             | 205 |130 | 75 | 51 | 26 |15 |  7.3%
```

