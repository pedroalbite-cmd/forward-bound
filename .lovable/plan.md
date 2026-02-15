
# Corrigir contagem de Leads/MQL para Franquia e Oxy Hacker

## Problema identificado

Ao consultar o banco externo, descobri que o pipe de expansao (Franquia/Oxy Hacker) usa fases diferentes do que o codigo espera:

- Fases reais no banco: **"Start form"** → **"Lead"** → "Reuniao agendada / Qualificado" → ...
- Fases mapeadas no codigo: `'Start form': 'leads'`, `'MQL': 'mql'`

A fase **"Lead"** (que eh a fase real onde os leads ficam) nao esta mapeada. Alem disso, a fase "MQL" praticamente nao existe nesse pipe.

## Dados reais de fevereiro 2026

- Total de movimentos no banco: **274 registros**
- Cards unicos Franquia: **~23** (com movimentos no periodo)
- Cards unicos Oxy Hacker: **~30** (com movimentos no periodo)
- MQL exibido atualmente: Franquia = 1, Oxy Hacker = 0

## Solucao

### Arquivo 1: `src/hooks/useExpansaoAnalytics.ts`

Adicionar a fase "Lead" ao mapeamento `PHASE_TO_INDICATOR`:

```
// Antes:
'Start form': 'leads',
'MQL': 'mql',

// Depois:
'Start form': 'leads',
'Lead': 'leads',
'MQL': 'mql',
```

Isso garante que cards na fase "Lead" sejam contados como leads (e consequentemente como MQL, pela logica ja implementada de mql = leads).

### Arquivo 2: `src/hooks/useExpansaoMetas.ts`

Mesmo ajuste no mapeamento:

```
'Start form': 'leads',
'Lead': 'leads',
'MQL': 'mql',
```

### Arquivo 3: `src/hooks/useOxyHackerMetas.ts`

Mesmo ajuste no mapeamento:

```
'Start form': 'leads',
'Lead': 'leads',
'MQL': 'mql',
```

## Resultado esperado

- Franquia: Leads e MQL mostrarao o total real de cards que entraram no pipe (~23 no periodo)
- Oxy Hacker: Leads e MQL mostrarao o total real de cards que entraram no pipe (~30 no periodo)
- Os drill-downs e funis tambem refletirao os numeros corretos
- Nenhuma alteracao nas BUs Modelo Atual e O2 TAX (usam hooks separados)

## Detalhes tecnicos

A mudanca eh de 1 linha adicionada em 3 arquivos. O impacto eh:
- Cards que estao na fase "Lead" (a maioria dos leads ativos) passam a ser reconhecidos pelo sistema
- Como o codigo usa `Set` para contar cards unicos, nao ha risco de duplicacao entre "Start form" e "Lead" do mesmo card
