

## Plano: Usar valores reais do CRM para Tipo de Origem

### Problema
A funcao `inferTipoOrigem` cria categorias inventadas ("Midia Paga", "Organico", "Indicacao") que nao correspondem aos valores reais do CRM. Os valores reais sao: Indicacao de BD, Indicacao de Parceiro, Site/Redes Sociais, Prospecsao Ativa, Colaborador O2, Cliente, Indicacao prospect, Cross-sell, Indicacao Cliente, Indicacao Colaborador O2, Eventos, Social media.

### Solucao

**Arquivo**: `ConversionsByChannelChart.tsx` - atualizar `inferTipoOrigem`

Quando `tipoOrigem` esta preenchido, ja usa o valor direto (linha 12-13, correto). O problema esta nos fallbacks (linhas 18-27) que inventam categorias. Atualizar para:

1. Se `tipoOrigem` preenchido -> usar como esta (ja funciona)
2. Fallbacks quando vazio:
   - `fonte` contem "evento" ou "g4" -> "Eventos"
   - `fbclid` ou ID Meta ou fonte ig/fb/instagram/facebook/meta -> "Site/Redes Sociais"
   - `gclid` ou fonte googleads/google -> "Site/Redes Sociais"
   - `origemLead` contem "indica" -> "Indicacao Cliente"
   - `fonte` contem "site" ou "organic" -> "Site/Redes Sociais"
   - Fallback final -> "Outros"

Midia paga (Meta/Google) vai para "Site/Redes Sociais" pois no CRM esse e o tipo de origem que engloba leads vindos de canais digitais. O drill-down por `origemLead` ja diferencia Instagram, Google Ads, etc.

