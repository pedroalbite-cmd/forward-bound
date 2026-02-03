

## Adicionar Link e Thumbnail dos Anúncios na Tabela de Campanhas Meta

### Objetivo

Facilitar a identificação das campanhas e anúncios adicionando:
1. **Link direto** para abrir a campanha/anúncio no Meta Ads Manager
2. **Thumbnail do criativo** (imagem do anúncio) quando disponível

---

### O Que Será Adicionado

| Campo | Descrição |
|-------|-----------|
| `effectivePreviewUrl` | Link direto para o Meta Ads Manager |
| `thumbnailUrl` | URL da imagem do criativo (do primeiro anúncio da campanha) |

---

### Como Funciona no Meta API

**1. Link para o Ads Manager:**
O Meta tem um padrão de URL para acessar campanhas:
```
https://www.facebook.com/adsmanager/manage/campaigns?act={account_id}&selected_campaign_ids={campaign_id}
```

**2. Thumbnail do Criativo:**
Precisamos buscar os anúncios (`/ads`) de cada campanha e depois o creative deles com campos de imagem:
```
GET /{campaign_id}/ads?fields=creative{thumbnail_url,image_url,effective_object_story_id}
```

---

### Visual Proposto

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                             Campanhas e Anúncios                               [▼]      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  Preview    │ Campanha             │ Objetivo │ Impressões │ Leads │ Gasto  │ Status   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  [🖼️ img]   │ Lead Gen Premium 🔗  │ leads    │    45k     │  45   │ R$ 8k  │ 🟢 Ativo │
│  [🖼️ img]   │ Remarketing Isca 🔗  │ conv     │    32k     │  32   │ R$ 4k  │ 🟢 Ativo │
│  [  - ]     │ Brand Awareness 🔗   │ reach    │    12k     │  12   │ R$ 3k  │ 🟡 Pausado│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/fetch-meta-campaigns/index.ts` | Buscar ads e thumbnails do criativo |
| `src/hooks/useMetaCampaigns.ts` | Transformar thumbnailUrl e previewUrl |
| `src/components/planning/marketing-indicators/types.ts` | Adicionar campos thumbnailUrl e previewUrl |
| `src/components/planning/marketing-indicators/CampaignsTable.tsx` | Exibir thumbnail e link |

---

### Implementação - Edge Function

Adicionar busca de anúncios e criativos:

```typescript
// Para cada campanha, buscar o primeiro anúncio e seu criativo
const adsUrl = `${META_BASE_URL}/${campaign.id}/ads?fields=creative{thumbnail_url,image_url,effective_object_story_id}&limit=1&access_token=${accessToken}`;
const adsResponse = await fetch(adsUrl);
const adsData = await adsResponse.json();

const firstAd = adsData.data?.[0];
const thumbnailUrl = firstAd?.creative?.thumbnail_url || firstAd?.creative?.image_url || null;

return {
  ...campaign,
  insights: insightsData.data?.[0] || null,
  adSets: adSetsWithInsights,
  thumbnailUrl,
  previewUrl: `https://www.facebook.com/adsmanager/manage/campaigns?act=${formattedAccountId.replace('act_', '')}&selected_campaign_ids=${campaign.id}`,
};
```

---

### Implementação - Tipos Atualizados

```typescript
export interface CampaignData {
  id: string;
  name: string;
  // ... campos existentes ...
  thumbnailUrl?: string;  // NOVO: URL da imagem do criativo
  previewUrl?: string;    // NOVO: Link para o Ads Manager
}

export interface AdSetData {
  // ... campos existentes ...
  previewUrl?: string;    // NOVO: Link para o Ad Set no Ads Manager
}
```

---

### Implementação - Tabela

Adicionar coluna de preview e link:

```tsx
<TableHead className="w-16">Preview</TableHead>
<TableHead>Campanha</TableHead>

// Na célula:
<TableCell className="w-16">
  {campaign.thumbnailUrl ? (
    <img 
      src={campaign.thumbnailUrl} 
      alt={campaign.name}
      className="w-12 h-12 object-cover rounded"
    />
  ) : (
    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
      <Image className="h-4 w-4 text-muted-foreground" />
    </div>
  )}
</TableCell>

<TableCell className="font-medium">
  <div className="flex items-center gap-2">
    {campaign.name}
    {campaign.previewUrl && (
      <a 
        href={campaign.previewUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-primary hover:text-primary/80"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    )}
  </div>
</TableCell>
```

---

### Considerações

| Aspecto | Detalhe |
|---------|---------|
| **Chamadas extras** | +1 chamada por campanha para buscar ads/creatives |
| **Fallback** | Se não tiver thumbnail, mostra placeholder |
| **Segurança** | Links abrem em nova aba com `noopener noreferrer` |
| **Performance** | Imagens são pequenas thumbnails (~100x100px) |

---

### Benefícios

1. Identificar visualmente qual campanha é qual pela imagem
2. Clicar para abrir direto no Meta Ads Manager
3. Não precisar decorar nomes de campanhas
4. Acesso rápido para editar/pausar campanhas

