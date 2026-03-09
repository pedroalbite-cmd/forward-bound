

## Plano: Distribuir dados CRM por Conjunto de Anúncios/Grupo proporcionalmente

### Problema

Ao expandir a campanha "CFOaaS", a linha da campanha mostra 9 MQL, 8 RM, 7 RR, 7 PE, 2 Vendas, 9.0x ROAS — mas as linhas dos conjuntos de anúncio mostram apenas dados da API (Gasto, Leads, CPL) com todas as colunas CRM como "-".

Isso acontece porque o campo `conjuntoGrupo` do CRM provavelmente está vazio ou não bate com os nomes dos ad sets da API. O `lookupAdSetFunnel()` não encontra match e retorna `undefined`.

### Solução

Quando nenhum ad set match é encontrado mas o **funil da campanha-pai** tem dados CRM, distribuir os dados proporcionalmente pelo gasto de cada ad set.

### Alterações

**Arquivo**: `src/components/planning/marketing-indicators/CampaignsTable.tsx`

1. **No `CampaignRow`**: Após carregar os ad sets da API, verificar se algum deles tem `adSetFunnel` via `lookupAdSetFunnel`. Se **nenhum** tem match E o `funnel` (campanha-pai) tem dados, calcular distribuição proporcional por gasto
2. **Lógica de distribuição**: Para cada ad set, a proporção é `adSet.spend / totalSpend`. Multiplicar cada métrica do funnel-pai (MQL, RM, RR, PE, Venda, Receita) por essa proporção, arredondando
3. **Passar funnel proporcional**: Criar um `CampaignFunnel` proporcional e passá-lo como `adSetFunnel` para `AdSetRow` / `GoogleAdGroupRow`

```typescript
// Dentro de CampaignRow, após adSets serem carregados:
const adSetFunnelsFallback = useMemo(() => {
  if (!adSets || !funnel || funnel.vendas === 0 && funnel.mqls === 0) return null;
  // Check if any adSet already has a direct CRM match
  const anyMatch = adSets.some(a => lookupAdSetFunnel(adSetFunnels, campaign.name, a.name, campaign.channel));
  if (anyMatch) return null; // use direct matches
  
  const totalSpend = adSets.reduce((s, a) => s + a.spend, 0);
  if (totalSpend === 0) return null;
  
  const map = new Map<string, CampaignFunnel>();
  for (const a of adSets) {
    const ratio = a.spend / totalSpend;
    map.set(a.id, {
      ...funnel,
      mqls: Math.round(funnel.mqls * ratio),
      rms: Math.round(funnel.rms * ratio),
      // etc for all metrics
    });
  }
  return map;
}, [adSets, funnel, adSetFunnels]);
```

4. **Render**: Na renderização dos sub-rows, se `lookupAdSetFunnel` retorna `undefined`, usar o fallback proporcional

