

## Plano: Ampliar normalização de `origemLead`

### Problema
A função `normalizeOrigemLead` não cobre todos os padrões de valores sujos. Exemplos que escapam:
- `"Instagram.com/"` → após strip de `/` vira `"instagram.com"` que **não está** no `ORIGEM_MAP` (só `instagram` está)
- `"Facebook"` → vira `"facebook"` que **não está** no map (só `fb` está)
- Valores com `?` ou `&` em vez de `,` para UTMs (ex: `"site?utm_source=..."`)
- `"Google Ads"` (com espaço) não está mapeado

### Solução

**Arquivo**: `ConversionsByChannelChart.tsx`

1. **Expandir `ORIGEM_MAP`** com variantes adicionais:
   - `'facebook'` → `'Facebook'`
   - `'instagram.com'` → `'Instagram'`
   - `'facebook.com'` → `'Facebook'`
   - `'google ads'` → `'Google Ads'`
   - `'meta ads'` → `'Meta Ads'`
   - `'meta'` → `'Meta Ads'`

2. **Melhorar `normalizeOrigemLead`**:
   - Além de cortar na vírgula, também cortar em `?` e `&` (UTM query strings)
   - Remover sufixo `.com` e `.com/` antes de fazer lookup no mapa
   - Isso garante que `"Instagram.com/"` → `"instagram"` → `"Instagram"`

### Alteração
Único arquivo, ~15 linhas modificadas.

