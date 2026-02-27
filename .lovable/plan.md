

## Alterar hierarquia Google Ads: Campanha → Grupo → Palavras-chave

Atualmente o drill-down do Google Ads e: Campanha → Grupo de Anuncio → Anuncios. O usuario quer trocar o terceiro nivel de **Anuncios** para **Palavras-chave**.

### Alteracoes em `src/components/planning/marketing-indicators/CampaignsTable.tsx`

1. **Substituir import**: trocar `useGoogleAds` por `useGoogleKeywords`
2. **Criar componente `GoogleKeywordRow`** (nivel 3): exibir texto da keyword, tipo de correspondencia (BROAD/PHRASE/EXACT), gasto, cliques, conversoes, CPL
3. **Modificar `GoogleAdGroupRow`**: ao expandir, carregar keywords via `useGoogleKeywords({ adGroupId })` em vez de ads via `useGoogleAds`
4. **Ajustar textos**: "Carregando anuncios..." → "Carregando palavras-chave...", "Nenhum anuncio encontrado" → "Nenhuma palavra-chave encontrada"

### Visualizacao do novo nivel 3

```text
Campanha Google        | Leads | Invest | CPL  | ...
├─ Grupo de Anuncio 1  |   12  | R$ 5k  | R$42 | ...
│  ├─ [BROAD] keyword1 |    5  | R$ 2k  | R$40 | ...
│  ├─ [EXACT] keyword2 |    7  | R$ 3k  | R$43 | ...
├─ Grupo de Anuncio 2  |    8  | R$ 3k  | R$38 | ...
```

Nenhuma alteracao na Edge Function ou hook necessaria - a infraestrutura ja existe.

