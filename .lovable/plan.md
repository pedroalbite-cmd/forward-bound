

## Plano: Inferir Origem do Lead quando vazia

### Problema
Muitos cards têm `tipoOrigem` preenchido (ou inferido), mas `origemLead` está vazio, gerando muitas sub-linhas "(Sem origem)" no drill-down.

### Solução
Na linha 84 do `ConversionsByChannelChart.tsx`, substituir o fallback simples por uma função `inferOrigemLead(card)` que usa campos disponíveis como fallback:

**Regras de inferência (em ordem):**
1. Se `origemLead` preenchido → usar como está
2. Se `fonte` preenchido → usar `fonte` como origem (ex: "ig" → "Instagram", "fb" → "Facebook", "googleads" → "Google Ads", "site" → "Site")
3. Se `campanha` preenchido e é ID numérico Meta → "Meta Ads"
4. Se `fbclid` presente → "Facebook Ads"
5. Se `gclid` presente → "Google Ads"
6. Fallback → "(Sem origem)"

**Mapeamento de nomes legíveis para `fonte`:**
- `ig` → "Instagram"
- `fb` → "Facebook"  
- `googleads` → "Google Ads"
- Outros → capitalizar o valor original

### Alteração
Único arquivo: `ConversionsByChannelChart.tsx` — adicionar função `inferOrigemLead` e usá-la na linha 84

