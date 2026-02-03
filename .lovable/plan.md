

## Adicionar Thumbnail nos Conjuntos de Anúncios (Ad Sets)

### Problema Identificado

1. A Edge Function `fetch-campaign-adsets` não busca thumbnails dos anúncios
2. A tabela mostra célula vazia na coluna Preview para ad sets

### Solução

Buscar o primeiro anúncio de cada ad set e extrair o thumbnail do criativo.

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/fetch-campaign-adsets/index.ts` | Buscar ads e thumbnail para cada ad set |
| `src/hooks/useCampaignAdSets.ts` | Mapear novo campo `thumbnailUrl` |
| `src/components/planning/marketing-indicators/types.ts` | Adicionar `thumbnailUrl` ao `AdSetData` |
| `src/components/planning/marketing-indicators/CampaignsTable.tsx` | Exibir thumbnail no ad set |

---

### Implementação - Edge Function

Atualizar `fetch-campaign-adsets/index.ts` para buscar anúncios:

```typescript
const adSetsWithInsights = await Promise.all(
  (adSetsData.data || []).map(async (adSet: MetaAdSet) => {
    try {
      // Buscar insights
      const adSetInsightsUrl = `...`;
      const adSetInsightsData = await ...;
      
      // NOVO: Buscar primeiro anúncio para pegar thumbnail
      const adsUrl = `${META_BASE_URL}/${adSet.id}/ads?fields=creative{thumbnail_url,image_url}&limit=1&access_token=${accessToken}`;
      const adsResponse = await fetch(adsUrl);
      const adsData = await adsResponse.json();
      
      const firstAd = adsData.data?.[0];
      const thumbnailUrl = firstAd?.creative?.thumbnail_url || 
                           firstAd?.creative?.image_url || 
                           null;
      
      return {
        ...adSet,
        insights: adSetInsightsData.data?.[0] || null,
        thumbnailUrl,  // NOVO
        previewUrl: `https://www.facebook.com/adsmanager/manage/adsets?...`,
      };
    } catch (err) {
      return { ...adSet, insights: null, thumbnailUrl: null, previewUrl: null };
    }
  })
);
```

---

### Implementação - Tipos

Adicionar ao `AdSetData` em `types.ts`:

```typescript
export interface AdSetData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'ended';
  dailyBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  previewUrl?: string;
  thumbnailUrl?: string;  // NOVO
}
```

---

### Implementação - Hook

Atualizar `useCampaignAdSets.ts` para mapear o novo campo:

```typescript
function transformAdSet(adSet: MetaAdSet): AdSetData {
  return {
    // ... campos existentes ...
    thumbnailUrl: adSet.thumbnailUrl,  // NOVO
    previewUrl: adSet.previewUrl,
  };
}
```

---

### Implementação - Tabela

Atualizar `CampaignsTable.tsx` para exibir thumbnail dos ad sets (linhas 135-136):

```tsx
{/* De: célula vazia */}
<TableCell className="w-14 p-2"></TableCell>

{/* Para: mostrar thumbnail */}
<TableCell className="w-14 p-2">
  {adSet.thumbnailUrl ? (
    <img 
      src={adSet.thumbnailUrl} 
      alt={adSet.name}
      className="w-8 h-8 object-cover rounded"
    />
  ) : (
    <div className="w-8 h-8 bg-muted/50 rounded flex items-center justify-center">
      <Image className="h-3 w-3 text-muted-foreground" />
    </div>
  )}
</TableCell>
```

---

### Resultado Visual Esperado

```text
│  [🖼️ img]   │ Lead Gen Premium 🔗      │ leads │  45k  │ R$ 8k │ Ativo  │
│    [🖼️]     │ ├─ Conjunto Diretores 🔗 │ Conj. │  28k  │ R$ 5k │ Ativo  │
│    [🖼️]     │ └─ Conjunto C-Level 🔗   │ Conj. │  17k  │ R$ 3k │ Ativo  │
```

---

### Considerações

| Aspecto | Detalhe |
|---------|---------|
| +1 chamada por ad set | Busca anúncios para cada conjunto |
| Limite de 1 | Só busca o primeiro anúncio para economizar chamadas |
| Fallback | Mostra placeholder se não tiver thumbnail |

