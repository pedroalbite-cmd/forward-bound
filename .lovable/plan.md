

## Plano: Match direto de CRM no nível de anúncio via `palavraChaveAnuncio`

### Problema
O CRM (Pipefy) já tem o campo `Palavra-chave/anúncio` preenchido com IDs numéricos dos anúncios, mas esse campo não é passado para `AttributionCard` nem usado no `useMarketingAttribution`. Por isso, o nível de anúncio usa distribuição proporcional em vez de match direto.

### Alterações

**1. `src/components/planning/marketing-indicators/types.ts`**
- Adicionar `palavraChaveAnuncio?: string` ao `AttributionCard`

**2. `src/components/planning/MarketingIndicatorsTab.tsx`**
- Passar `palavraChaveAnuncio: c.palavraChaveAnuncio` ao construir cada `AttributionCard` nos 3 loops (modeloAtual, franquia, oxyHacker)

**3. `src/hooks/useMarketingAttribution.ts`**
- Armazenar `palavraChaveAnuncio` no `cardInfos`
- Criar novo `adFunnels` de nível 3: `Map<string, CampaignFunnel>` com chave `campaign::conjunto::anuncio::channel`
- Exportar como `adFunnels` (renomear o existente para `adSetFunnels` se necessário — já é `adSetFunnels`)
- Novo export: `adCreativeFunnels` (ou similar)

**4. `src/components/planning/marketing-indicators/CampaignsTable.tsx`**
- Receber `adCreativeFunnels` como prop
- No `AdSetRow`, antes do fallback proporcional, tentar lookup direto no `adCreativeFunnels` usando `campaign::conjunto::adId::channel`
- Se encontrar match direto, usar. Se não, manter o fallback proporcional atual

### Fluxo de dados
```text
Pipefy "Palavra-chave/anúncio" (ex: 120238863590130418)
  → AttributionCard.palavraChaveAnuncio
    → useMarketingAttribution → adCreativeFunnels Map
      → CampaignsTable → AdSetRow → lookup por ad.id
        → match direto → CrmCells com dados reais
```

