

## Correção da Normalização de Tiers de Faturamento

### Problema Identificado

Os dados são **reais e vêm do banco de dados** (tabela `pipefy_moviment_cfos`), mas a tabela de normalização está **incompleta**. 

Analisando os dados reais do banco, encontrei estes formatos que **não estão mapeados**:

| Valor no Banco | Tier Esperado | Status |
|----------------|---------------|--------|
| `"Entre R$ 500 mil e R$ 1 milhão"` | R$ 200k - 1M | **Faltando** |
| `"Entre R$ 200 mil e R$ 350 mil"` | R$ 200k - 1M | **Faltando** |
| `"Entre R$ 350 mil e R$ 500 mil"` | R$ 200k - 1M | **Faltando** |
| `"Ainda não faturamos"` | Até R$ 50k | **Faltando** |
| `"Abaixo de R$ 50.000"` | Até R$ 50k | **Faltando** |

### Consequência

Registros com esses valores estão caindo no fallback "Não informado", distorcendo as taxas de conversão calculadas.

---

### Solução

Expandir a tabela `TIER_NORMALIZATION` no arquivo `FunnelConversionByTierWidget.tsx` para incluir **todos** os formatos encontrados no banco de dados.

### Mapeamento Completo

```typescript
const TIER_NORMALIZATION: Record<string, string> = {
  // Até R$ 50k variants
  'Até R$ 50.000': 'Até R$ 50k',
  'Até R$ 50 mil': 'Até R$ 50k',
  'Até R$ 50k': 'Até R$ 50k',
  'Ainda não faturamos': 'Até R$ 50k', // NOVO
  'Abaixo de R$ 50.000': 'Até R$ 50k', // NOVO
  'Abaixo de R$ 50 mil': 'Até R$ 50k', // NOVO
  
  // R$ 50k - 200k variants
  'Entre R$ 50.000 e R$ 200.000': 'R$ 50k - 200k',
  'Entre R$ 50 mil e R$ 200 mil': 'R$ 50k - 200k',
  
  // R$ 200k - 1M variants (MUITOS NOVOS)
  'Entre R$ 200.000 e R$ 1.000.000': 'R$ 200k - 1M',
  'Entre R$ 200 mil e R$ 350 mil': 'R$ 200k - 1M',   // NOVO
  'Entre R$ 350 mil e R$ 500 mil': 'R$ 200k - 1M',   // NOVO
  'Entre R$ 500 mil e R$ 1 milhão': 'R$ 200k - 1M',  // NOVO - Encontrado nos dados!
  'Entre R$ 200 mil e R$ 500 mil': 'R$ 200k - 1M',   // NOVO
  
  // Acima de 1M variants
  'Entre R$ 1 milhão e R$ 5 milhões': 'Acima de 1M',
  'Entre R$ 5 milhões e R$ 10 milhões': 'Acima de 1M',
  'Acima de R$ 5 milhões': 'Acima de 1M',
  'Acima de R$ 10 milhões': 'Acima de 1M',           // NOVO
};
```

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/indicators/FunnelConversionByTierWidget.tsx` | Expandir `TIER_NORMALIZATION` com todos os valores do banco |

---

### Verificação Adicional

Também melhorarei a lógica de fallback (linhas 112-127) para capturar padrões como:

```typescript
// Improved fallback logic
if (lowerRange.includes('500 mil') || lowerRange.includes('350 mil')) {
  return 'R$ 200k - 1M';
}
if (lowerRange.includes('não fatur') || lowerRange.includes('ainda não')) {
  return 'Até R$ 50k';
}
```

---

### Resultado Esperado

Após a correção:
- Todos os registros serão corretamente categorizados
- As taxas de conversão refletirão os dados reais do banco
- Menos registros cairão em "Não informado"

