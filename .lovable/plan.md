
# Adicionar fase "Enviar proposta" ao indicador de Proposta na O2 TAX

## Contexto

Atualmente, apenas 2 fases contam como "Proposta" na O2 TAX:
- "Proposta enviada / Follow Up"
- "Enviar para assinatura"

A fase **"Enviar proposta"** (fase preparatoria, antes do envio) nao esta mapeada, o que faz com que 3 dos 4 cards de proposta do periodo nao aparecam no dashboard.

## Mudancas

### Arquivo 1: `src/hooks/useO2TaxAnalytics.ts`

Adicionar "Enviar proposta" ao mapeamento:

```
// Antes:
'Proposta enviada / Follow Up': 'proposta',
'Enviar para assinatura': 'proposta',

// Depois:
'Enviar proposta': 'proposta',
'Proposta enviada / Follow Up': 'proposta',
'Enviar para assinatura': 'proposta',
```

### Arquivo 2: `src/hooks/useO2TaxMetas.ts`

Mesma alteracao no mapeamento:

```
// Antes:
'Proposta enviada / Follow Up': 'proposta',
'Enviar para assinatura': 'proposta',

// Depois:
'Enviar proposta': 'proposta',
'Proposta enviada / Follow Up': 'proposta',
'Enviar para assinatura': 'proposta',
```

## Resultado esperado

- Os 3 cards em "Enviar proposta" (Sabia, M3 Tecnologia, Bhio Supply) passarao a aparecer no indicador de Proposta
- O card ROBSUS79 (ja em "Proposta enviada / Follow Up") continuara aparecendo
- Total de propostas unicas: 4 cards no periodo
- A logica de primeira entrada garante que cada card seja contado apenas uma vez, mesmo que passe por "Enviar proposta" e depois "Proposta enviada / Follow Up"
