

## Usar Meta de Faturamento do Plan Growth no Gráfico de Faturamento

### Problema atual
O gráfico RevenuePaceChart calcula a meta como `MRR Base + Meta Setup + Meta Pontual` (componentes separados). O usuário quer que use a coluna **"Meta" (faturamento)** diretamente do Plan Growth / monetary_metas, somando as BUs selecionadas.

### O que será feito

**Arquivo: `src/components/planning/IndicatorsTab.tsx`**

Na seção do RevenuePaceChart (linhas ~2545-2700), substituir o cálculo da meta:

**De** (atual):
```typescript
// Meta: MRR base pro-rata + meta setup + meta pontual
let metaSetupMonth = 0;
let metaPontualMonth = 0;
selectedBUs.forEach(bu => {
  metaSetupMonth += getConsolidatedMeta(bu, monthName, 'setup').value;
  metaPontualMonth += getConsolidatedMeta(bu, monthName, 'pontual').value;
});
totalMeta += (mrrBaseMonth * fraction) + ((metaSetupMonth + metaPontualMonth) * fraction);
```

**Para** (novo):
```typescript
// Meta: faturamento total do Plan Growth por BU selecionada
let metaFaturamentoMonth = 0;
selectedBUs.forEach(bu => {
  metaFaturamentoMonth += getConsolidatedMeta(bu, monthName, 'faturamento').value;
});
totalMeta += metaFaturamentoMonth * fraction;
```

A mesma substituição será aplicada nas 3 ocorrências dentro do bloco do RevenuePaceChart:
1. Cálculo do `totalMeta` para o header (linhas ~2580-2588)
2. Cálculo do `periodMeta` para os dados do gráfico (linhas ~2659-2666)
3. Ajuste do `mrrBaseTotal` no header (linhas ~2680-2698) — não será mais necessário subtrair MRR base do header, já que o faturamento já é o valor total

### Impacto
- O gráfico mostrará a meta de faturamento real do Plan Growth
- Ao selecionar múltiplas BUs, as metas serão somadas
- A linha "Meta Acumulada" no gráfico refletirá os valores do banco de dados (monetary_metas)

