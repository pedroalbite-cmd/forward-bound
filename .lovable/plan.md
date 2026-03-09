

## Plano: Normalizar valores sujos de `origemLead`

### Problema
O campo `origemLead` do CRM contém strings brutas com UTMs concatenados (ex: `"Google,utm_medium=cpc,utm_campaign=null,utm_content=null,utm_term=null"`, `"Fb,utm_medium=facebook_mobile_feed,utm_campaign=120238..."`, `"{{site_source_name}}"`). A função `inferOrigemLead` retorna esses valores como estão porque não são vazios.

### Solução

**Arquivo**: `ConversionsByChannelChart.tsx` — adicionar função `normalizeOrigemLead` aplicada **antes** do return na `inferOrigemLead`

**Regras de normalização:**
1. Se contém `,utm_medium=` → extrair apenas a primeira parte (antes da vírgula) como base
2. Aplicar mapeamento da base extraída:
   - `Google` / `Googleads` → "Google Ads"
   - `Fb` → "Facebook"
   - `Instagram` / `Instagram.com/` → "Instagram"
   - `Bing` → "Bing"
3. Se o valor é um template não resolvido (ex: `{{site_source_name}}`) → tratar como "(Sem origem)"
4. Se o valor é um ID numérico Meta puro → "Meta Ads"
5. Valores limpos (ex: "Instagram", "Meta Ads - Lead Nativo", "Google Ads") → manter como estão

**Lógica resumida:**
```text
function normalizeOrigemLead(raw: string): string {
  // Remove UTM params: pega só antes da primeira vírgula seguida de utm_
  // Mapeia abreviações conhecidas
  // Filtra templates {{...}}
  // Retorna valor limpo
}
```

Isso vai colapsar as dezenas de sub-linhas sujas em poucas linhas limpas (Instagram, Facebook, Google Ads, etc).

