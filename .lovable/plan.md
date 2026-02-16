

# Corrigir indicador de Proposta na O2 TAX - apenas "Proposta enviada / Follow Up"

## Problema

Atualmente, 3 fases estao mapeadas como "proposta":
- "Enviar proposta"
- "Proposta enviada / Follow Up"
- "Enviar para assinatura"

O correto: apenas **"Proposta enviada / Follow Up"** deve contar como proposta.

## Mudancas

### Arquivo 1: `src/hooks/useO2TaxAnalytics.ts`

Remover "Enviar proposta" e "Enviar para assinatura" do mapeamento de proposta:

```
// Antes:
'Enviar proposta': 'proposta',
'Proposta enviada / Follow Up': 'proposta',
'Enviar para assinatura': 'proposta',

// Depois:
'Proposta enviada / Follow Up': 'proposta',
```

"Enviar proposta" e "Enviar para assinatura" deixarao de ter mapeamento para indicador (nao contarao em nenhum KPI).

Tambem remover "Enviar proposta" da lista `ACTIVE_PHASES` e do mapeamento de labels de exibicao.

### Arquivo 2: `src/hooks/useO2TaxMetas.ts`

Mesma alteracao no `PHASE_TO_INDICATOR`:

```
// Antes:
'Enviar proposta': 'proposta',
'Proposta enviada / Follow Up': 'proposta',
'Enviar para assinatura': 'proposta',

// Depois:
'Proposta enviada / Follow Up': 'proposta',
```

## Resultado esperado

- Apenas cards que chegaram a "Proposta enviada / Follow Up" contarao como proposta
- Cards em "Enviar proposta" (fase preparatoria) nao serao contados
- Cards em "Enviar para assinatura" (fase pos-proposta) nao serao contados como proposta

