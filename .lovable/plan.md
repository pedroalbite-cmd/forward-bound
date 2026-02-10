

# Ocultar campanhas, conjuntos e anuncios pausados

Filtrar itens com status "paused" em todos os 3 niveis da tabela de Campanhas e Anuncios.

## Arquivo afetado

`src/components/planning/marketing-indicators/CampaignsTable.tsx`

## Mudancas

### 1. Filtrar campanhas pausadas (linha ~438)
Adicionar `.filter(c => c.status !== 'paused')` antes do `.map()` na renderizacao das campanhas. Isso remove campanhas pausadas da listagem principal.

### 2. Filtrar conjuntos de anuncios pausados (linha ~288)
Adicionar `.filter(a => a.status !== 'paused')` antes do `.map()` na renderizacao dos ad sets dentro de `CampaignRow`.

### 3. Filtrar anuncios pausados (linha ~198)
Adicionar `.filter(a => a.status !== 'paused')` antes do `.map()` na renderizacao dos ads dentro de `AdSetRow`.

### 4. Atualizar contagem no footer (linha ~454)
Aplicar o mesmo filtro no calculo de totais do footer (`campaigns.length`, `reduce` de leads e gasto) para que os numeros reflitam apenas itens ativos/encerrados.

## Resultado

Apenas campanhas, conjuntos e anuncios com status **ativo** ou **encerrado** serao exibidos. Itens pausados ficam completamente ocultos.

