

## Correção do Parser DRE no useOxyFinance

### Problema Identificado

A API Oxy Finance retorna o DRE nesta estrutura:
```text
{
  groups: [
    { label: "CaaS", data: [{ period: "2026-01", value: 665383 }, ...] },
    { label: "SaaS", data: [{ period: "2026-01", value: 321839 }, ...] },
    ...
  ]
}
```

Mas o parser atual faz:
```text
const rows = dreData?.data || dreData?.rows || [];
```

Como a resposta tem `{ period, periods, groups }`, nenhuma dessas chaves bate — `rows` fica `[]` e `dreByBU` retorna tudo zero. Consequentemente, o rollover no `useEffectiveMetas` nunca calcula gaps reais.

### Dados reais da API (Jan-Fev 2026)

| BU | Jan | Fev |
|---|---|---|
| CaaS (modelo_atual) | R$ 665.383 | R$ 793.238 |
| SaaS (oxy_hacker) | R$ 321.839 | R$ 295.293 |
| Tax (o2_tax) | Não aparece nos logs | — |
| Expansão (franquia) | Não aparece nos logs | — |

**Nota**: Tax e Expansão podem não existir como grupos separados no DRE ou podem estar mais adiante nos dados (os logs foram truncados em 3000 chars).

### Alteração

**Arquivo**: `src/hooks/useOxyFinance.ts` — função `useMemo` do `dreByBU` (linhas 148-196)

Atualizar o parser para:
1. Verificar se `dreData.groups` existe (array de grupos DRE)
2. Iterar sobre `groups`, fazer `matchBU(group.label)` para mapear CaaS→modelo_atual, SaaS→oxy_hacker, etc.
3. Para cada grupo com BU válida, iterar `group.data[]` e extrair `period` ("2026-01") → converter para MonthType ("Jan") e somar `value`
4. Manter o fallback existente para o formato antigo (caso a API mude)

Isso é uma correção de parsing — não altera nenhuma lógica de negócio, apenas faz o `dreByBU` refletir os dados que a API já retorna corretamente.

### Impacto

- O `useEffectiveMetas` passará a receber valores reais de DRE por BU
- O rollover será calculado corretamente (ex: Jan CaaS meta 1.125M vs realizado 665k → gap real)
- Os cards de "Meta vs Realizado" no Financial tab mostrarão valores corretos

