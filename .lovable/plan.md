

# Cascata: comparar com A Vender e mostrar todos os indicadores realizados

## Problema atual

A cascata expandida compara o realizado com a **Meta total** (faturamento), mas deveria comparar com o **A Vender** (incremento). Alem disso, so mostra o valor monetario realizado, sem as demais metricas do funil (vendas, propostas, RRs, RMs, MQLs, leads).

## O que vai mudar

Ao expandir um mes, a cascata mostrara:

1. **Atingimento vs A Vender** (nao vs Meta) - porque o A Vender e o que precisa ser conquistado de novo
2. **Todas as metricas do funil realizadas**: Vendas (qtd), Propostas, RRs, RMs, MQLs, Leads - comparando meta vs realizado em cada uma
3. Barra de progresso e status baseados no A Vender

## Layout da cascata expandida

```text
Linha do mes normal: | Jan | R$ 1.1M | R$ 700k | R$ 400k | 24 | 39 | ... |

Cascata expandida:
+---------------------------------------------------------------+
| [icone status]                                                 |
|                                                                |
| Incremento (A Vender)                                          |
| Meta: R$ 400.000  |  Realizado: R$ 85.000  |  21.3%  |  ████  |
|                                                                |
| Funil Realizado                                                |
|  Vendas   Propostas   RRs   RMs   MQLs   Leads                |
|  Meta: 24    39        44    61    125    291                   |
|  Real:  5    12        15    22     48    110                   |
+---------------------------------------------------------------+
```

## Mudancas tecnicas

### 1. `useIndicatorsRealized.ts` - Expandir para retornar funil completo

Atualmente retorna apenas vendas (valor monetario). Precisa retornar tambem as quantidades de cada etapa do funil por BU e por mes.

**Novo retorno** - `realizedFunnelByBU`:
```ts
{
  modelo_atual: {
    Jan: { vendas: 5, propostas: 12, rrs: 15, rms: 22, mqls: 48, leads: 110, valor: 85000 },
    Fev: { ... },
  },
  o2_tax: { ... },
  ...
}
```

Para cada mes, chamar `getQtyForPeriod` com cada indicador ('venda', 'proposta', 'rr', 'rm', 'mql', 'leads') dos hooks ja existentes (useModeloAtualMetas, useO2TaxMetas, useOxyHackerMetas, useExpansaoMetas).

### 2. `MediaInvestmentTab.tsx` - Atualizar BUInvestmentTable

**Novas props:**
- `realizedFunnelByMonth`: dados completos do funil realizado por mes (nao so valor)

**Cascata expandida - mudar logica:**
- O `pctAtingimento` passa a comparar `realized.valor` vs `data.faturamentoVender` (A Vender), nao vs `data.faturamentoMeta`
- O gap passa a ser `data.faturamentoVender - realized.valor`
- Adicionar uma secao "Funil Realizado" com grid mostrando cada indicador:
  - Linha "Meta": valores do funnelData (vendas, propostas, rrs, rms, mqls, leads)
  - Linha "Real": valores do realizedFunnelByMonth
  - Cada indicador com cor verde se >= 80% da meta, amarelo >= 50%, vermelho < 50%

### 3. `MediaInvestmentTab.tsx` - Componente principal

- Passar `realizedFunnelByMonth` para cada BUInvestmentTable em vez de `realizedByMonth` simples
- Adaptar o KPI hero para tambem usar A Vender como referencia

## Resultado

- O atingimento mostra o progresso real vs o que precisa ser conquistado (A Vender)
- Todas as metricas do funil ficam visiveis na cascata para acompanhamento completo
- O usuario ve de relance se esta gerando leads, MQLs, propostas e vendas suficientes para cada mes
