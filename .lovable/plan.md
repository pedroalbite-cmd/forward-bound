

## Diagnóstico: lookup de ad set falha porque chave da campanha não bate

### Causa raiz

O `adSetFunnels` no hook `useMarketingAttribution` cria chaves usando o campo CRM `campanha` (geralmente o **ID numérico** do Meta, ex: `120214582110850482`):

```
key = "120214582110850482::nome do conjunto::meta_ads"
```

Mas o `lookupAdSetFunnel` na tabela tenta buscar usando o **nome da campanha da API** (ex: `cfoaas`):

```
exactKey = "cfoaas::nome do adset::meta_ads"
```

Essas chaves nunca batem. Por isso cai no fallback proporcional.

No nível de campanha isso funciona porque `resolveApiCampaign` faz lookup por ID numérico. Mas o lookup de ad set não tem essa lógica.

### Solução

**Arquivo**: `src/components/planning/marketing-indicators/CampaignsTable.tsx`

1. Alterar `lookupAdSetFunnel` para receber também o `campaignId` como parâmetro
2. Tentar primeiro a chave com o ID da campanha: `${campaignId}::${normAdSet}::${channelId}`
3. Se não bater, tentar com o nome (lógica atual)
4. Atualizar todas as chamadas para passar `campaign.id`

Isso faz o match direto funcionar, eliminando a necessidade do fallback proporcional na maioria dos casos.

