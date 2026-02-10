
# Remover preview/thumbnail dos niveis Campanha e Conjunto de Anuncio

Manter imagens de preview apenas no nivel de Anuncio (Ad). Nos niveis Campanha e Conjunto de Anuncio, remover a coluna de thumbnail.

## Mudancas

**Arquivo:** `src/components/planning/marketing-indicators/CampaignsTable.tsx`

### 1. CampaignRow (linha 240-250)
Substituir a celula com `Thumbnail` por uma celula vazia para manter o alinhamento da tabela.

### 2. AdSetRow (linha 152-162)
Substituir a celula com `Thumbnail` por uma celula vazia.

### 3. AdRow (linha 98-107)
Manter como esta -- continua exibindo a thumbnail normalmente.

### 4. Header da tabela (linha ~437)
Manter a coluna "Preview" no header, pois ela ainda e usada no nivel de anuncio.

## Resultado

| Nivel | Preview |
|-------|---------|
| Campanha | Celula vazia |
| Conjunto | Celula vazia |
| Anuncio | Thumbnail com clique para modal |
