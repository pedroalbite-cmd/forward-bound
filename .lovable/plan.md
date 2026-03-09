

## Plano: Remover cards Oxy Hacker do `allAttributionCards`

### Problema
Os 23 cards de venda da Oxy Hacker em fevereiro estão sendo incluídos no `allAttributionCards`, inflando os números de vendas na seção Campanhas e Anúncios. Oxy Hacker não deve participar da atribuição de marketing.

### Solução

**Arquivo**: `src/components/planning/MarketingIndicatorsTab.tsx`

Remover o loop que adiciona `oxyHackerCards` ao array `allAttributionCards` (linhas 257-266). Os cards de Franquia e Modelo Atual permanecem.

Isso elimina automaticamente as 23 vendas Oxy Hacker de todas as métricas CRM na tabela de campanhas (leads, MQLs, vendas, receita, ROAS).

