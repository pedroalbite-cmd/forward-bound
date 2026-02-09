
# Plano: Incluir Todos os 116 MQLs no Dashboard

## Problema
- **Pipefy exporta**: 116 MQLs (critério: criado em Fev + faturamento >= 200k)
- **Dashboard mostra**: 108 MQLs
- **Diferença**: 8 cards não são contados

## Causa Raiz
O dashboard só conta cards que tiveram movimentação nas fases 'MQLs' ou 'Tentativas de contato'. Cards que ainda estão em fases anteriores (como 'Material ISCA' ou 'Start form') ou em fases não mapeadas nunca são carregados do banco.

### Cards Faltantes Identificados (do Excel):
| Card | Fase Atual | Faturamento |
|------|-----------|-------------|
| Ath | Material ISCA | R$ 350k-500k |
| Bigcasa | Material ISCA | R$ 500k-1M |
| Lamipack (1 dos 2) | Material ISCA | Acima de R$ 5M |
| Luuri | Material ISCA | R$ 350k-500k |
| Maxsum | Material ISCA | R$ 500k-1M |
| + 3 outros | Fases não mapeadas ou primeira entrada anterior |

## Solução

Adicionar as fases faltantes ao mapeamento `PHASE_TO_INDICATOR` em **ambos os hooks**, para que cards nessas fases sejam carregados e contados como MQL (desde que passem no filtro de faturamento >= 200k).

### Mudanças

**Arquivo 1: `src/hooks/useModeloAtualAnalytics.ts`**

Adicionar ao `PHASE_TO_INDICATOR`:
```
'Material ISCA': 'mql',
'Start form': 'mql',
'Enviar proposta': 'proposta',
'Contrato em elaboração': 'venda',
'Remarcar reunião / No show': 'rm',
```

Nota: 'Material ISCA' e 'Start form' são fases iniciais do funil. Cards nessas fases com faturamento >= 200k devem ser contados como MQL conforme critério do Pipefy.

**Arquivo 2: `src/hooks/useModeloAtualMetas.ts`**

Aplicar o mesmo mapeamento no hook de metas para manter consistência entre os dois hooks.

### Impacto nos Outros Indicadores
- **Leads**: Também aumentará, pois 'Material ISCA' e 'Start form' serão incluídos na união leads+mql
- **Proposta**: 'Enviar proposta' passará a ser contado (se ainda não era)
- **RM**: 'Remarcar reunião / No show' será contado (nome era ligeiramente diferente)
- **Venda**: 'Contrato em elaboração' será incluído

### Verificação
Após a mudança, o dashboard deverá mostrar 116 MQLs para Fevereiro 2026, alinhado com o export do Pipefy.

## Detalhes Técnicos

A tabela `pipefy_moviment_cfos` registra cada movimentação de fase. O campo 'Fase' indica a fase de destino do movimento. Cards em 'Material ISCA' possuem registros nessa tabela mas a fase não estava no mapeamento, então o `parseCardRow` retornava `null` e esses cards eram descartados completamente.

A função `isMqlQualified` continua sendo aplicada, garantindo que somente cards com faturamento >= R$ 200k sejam contados como MQL, independentemente da fase.
