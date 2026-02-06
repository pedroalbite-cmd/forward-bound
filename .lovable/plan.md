
# Plano: Exibir Data da Primeira Qualificação MQL

## Problema Identificado

O card **1291436814 (A3P Transporte)** aparece na aba MQLs com data **02/02/2026**, mas sua primeira qualificação como MQL foi em **31/01/2026**.

### Histórico do Card:
| Fase | Entrada |
|------|---------|
| MQLs | 31/01/2026 19:08:49 |
| Tentativas de contato | 02/02/2026 09:15:32 |

### Causa Raiz

Quando o período selecionado é **Fevereiro 2026**:
1. O sistema filtra apenas movimentações dentro do período (01/02 a 28/02)
2. A entrada em "MQLs" (31/01) está **fora do período**, não é carregada
3. A entrada em "Tentativas de contato" (02/02) está **dentro do período**
4. Como ambas as fases são mapeadas para `mql`, o card aparece com data 02/02

## Solução Proposta

Modificar a lógica para que, ao exibir um MQL, sempre use a **data da primeira entrada em qualquer fase MQL** (a mais antiga entre "MQLs" e "Tentativas de contato").

### Arquivo a Modificar

**`src/hooks/useModeloAtualAnalytics.ts`**

```text
Mudanças na função getCardsForIndicator (linhas 205-237):

ANTES:
- Filtra apenas cards no período (cardsInPeriod)
- Para MQL, pega a entrada mais antiga DENTRO do período filtrado

DEPOIS (Opção A - Mostrar sempre a primeira entrada):
- Usar histórico completo do card (não apenas período)
- Para cada card único no período, buscar a primeira entrada em fase MQL
- Exibir com a data da primeira qualificação

DEPOIS (Opção B - Mostrar entrada no período selecionado):
- Manter comportamento atual
- Card aparece com a data da movimentação que ocorreu no período selecionado
```

## Pergunta de Esclarecimento

Qual comportamento você prefere?

**Opção A - Data da Primeira Qualificação:**
- Card 1291436814 aparece como MQL com data **31/01/2026**
- Mesmo quando você seleciona Fevereiro, mostra a data original de qualificação
- Porém, o card apareceria em AMBOS os meses (Janeiro e Fevereiro)

**Opção B - Data da Movimentação no Período (atual):**
- Em Janeiro: card aparece com data 31/01 (entrada em MQLs)
- Em Fevereiro: card aparece com data 02/02 (entrada em Tentativas de contato)
- Card conta apenas uma vez por período (não duplica)

**Opção C - Aparecer Apenas no Primeiro Mês:**
- Card conta como MQL apenas em Janeiro (31/01) 
- Em Fevereiro, não aparece mais (já foi contado)
- Evita contagem dupla, mostra apenas a primeira qualificação

## Recomendação

**Opção C** é a mais precisa para métricas de funil:
- Um lead qualifica como MQL apenas uma vez
- A data mostrada é sempre a da primeira qualificação
- Evita duplicação entre períodos
