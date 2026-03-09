

## Análise: Discrepância entre vendas no funil e na tabela de campanhas

### Fontes de dados

| Componente | Fonte | BUs incluídas |
|---|---|---|
| **Funil / Gauges** (`pipefyVolumes`) | `getCardsForIndicator('venda')` de cada BU | MA + O2 TAX + Franquia + **Oxy Hacker** |
| **Tabela de Campanhas** (`campaignFunnels`) | `allAttributionCards` → `useMarketingAttribution` | MA + Franquia |
| **CAC / ROAS** (`realPerformanceMetrics`) | Usa `pipefyVolumes.vendas` (4 BUs) | 4 BUs |

### Discrepâncias identificadas

1. **O2 TAX nunca foi incluído** no `allAttributionCards` — logo suas vendas nunca aparecem na tabela de campanhas
2. **Oxy Hacker foi removido** na última alteração — correto para atribuição de mídia, mas gera diferença com o funil
3. **Lógica de contagem diferente**: O funil usa first-entry deduplication por card ID; a atribuição usa cumulative stages (um card em "Contrato assinado" conta para leads, mqls, rms, etc.)

### Conclusão

A diferença é **esperada por design**: a tabela de campanhas faz atribuição de marketing (só BUs com campanhas rastreáveis), enquanto o funil conta volume total de todas as BUs. Não há bug — são perspectivas diferentes.

### Opções

**A) Aceitar a diferença** — Sem alteração de código. As duas visões têm propósitos diferentes.

**B) Alinhar removendo Oxy Hacker do funil** — Remover `oxyGetCards` do `pipefyVolumes` para que funil e CAC reflitam apenas as BUs com atribuição de mídia.

**C) Adicionar O2 TAX à atribuição** — Incluir cards O2 TAX no `allAttributionCards` para que vendas O2 TAX apareçam na tabela de campanhas (se eles tiverem dados de campanha/fonte no CRM).

