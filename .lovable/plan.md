

## Plano: Corrigir normalização que não está sendo aplicada

### Diagnóstico
O código de `normalizeOrigemLead` está correto em teoria, mas os valores sujos continuam aparecendo. O problema pode estar na forma como o split funciona com esses valores específicos. Vou trocar a abordagem para ser mais agressiva:

### Solução

**Arquivo**: `ConversionsByChannelChart.tsx` — reescrever `normalizeOrigemLead`

Em vez de confiar no split por delimitadores, usar regex para remover tudo a partir de `,utm_` ou `,utm`:

```text
1. Remover tudo após ",utm" (case-insensitive) → pega "Google", "Fb", "Instagram.com/", etc.
2. Também remover tudo após "?" 
3. Limpar trailing "/" e ".com"
4. Aplicar ORIGEM_MAP expandido (adicionar "googleads" → "Google Ads")
5. Tratar "{{...}}" como "(Sem origem)"
```

Também adicionar ao `ORIGEM_MAP`:
- `'googleleads'` → `'Google Ads'`  

Isso garante que strings como `"Googleads,utm_medium=jrfinancas.com,..."` virem `"Google Ads"` e `"Fb,utm_medium=facebook_mobile_feed,..."` virem `"Facebook"`.

### Alteração
Único arquivo, ~5 linhas na função `normalizeOrigemLead`.

