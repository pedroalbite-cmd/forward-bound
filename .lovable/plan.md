

# Mostrar campanhas com atividade no periodo (em vez de filtrar por status)

## Problema

O filtro atual (`status !== 'paused'`) usa o status **atual** da campanha. Isso significa que uma campanha que estava ativa em janeiro mas foi pausada em fevereiro nao aparece ao consultar janeiro -- mesmo tendo dados naquele periodo.

## Solucao

Trocar o criterio de filtro: em vez de verificar o status, verificar se houve **gasto no periodo** (`investment > 0`). Se a API do Meta retornou dados de gasto para aquele periodo, a campanha estava ativa nele.

A mesma logica se aplica aos 3 niveis:

| Nivel | Filtro atual | Novo filtro |
|-------|-------------|-------------|
| Campanha | `status !== 'paused'` | `investment > 0` |
| Conjunto | `status !== 'paused'` | `spend > 0` |
| Anuncio | `status !== 'paused'` | `spend > 0` |

## Arquivo afetado

`src/components/planning/marketing-indicators/CampaignsTable.tsx`

## Mudancas

### 1. Campanhas (linha ~438, 454, 458, 462)
Substituir todos os `.filter(c => c.status !== 'paused')` por `.filter(c => c.investment > 0)`.

### 2. Conjuntos de anuncios (linha ~288)
Substituir `.filter(a => a.status !== 'paused')` por `.filter(a => a.spend > 0)`.

### 3. Anuncios (linha ~198)
Substituir `.filter(a => a.status !== 'paused')` por `.filter(a => a.spend > 0)`.

## Resultado

- **Mes atual**: campanhas pausadas sem gasto ficam ocultas (mesmo comportamento de antes).
- **Mes passado**: campanhas que estavam ativas e tiveram gasto aparecem normalmente, mesmo que hoje estejam pausadas.
- Campanhas que nunca tiveram gasto em nenhum periodo continuam ocultas.

