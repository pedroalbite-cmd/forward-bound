

## Plano: Resolver "(Sem tipo)" na tabela de Conversão por Tipo de Origem

### Problema
362 cards não têm o campo `Tipo de Origem do lead` preenchido no CRM, resultando em "(Sem tipo)". Porém esses cards possuem outros campos de atribuição (`Fonte`, `Origem do lead`, `fbclid`, `gclid`, `Campanha`) que permitem inferir o tipo.

### Solução
Adicionar lógica de fallback no `ConversionsByChannelChart.tsx` para inferir o tipo de origem quando `tipoOrigem` está vazio, usando os mesmos campos que o `detectChannel` já utiliza.

### Regras de fallback (em ordem de prioridade)

1. Se `tipoOrigem` preenchido → usar como está
2. Se `fonte`/`origemLead` contém "evento" ou "g4" → "Evento"
3. Se tem `fbclid`, ou `fonte` é "ig"/"fb"/"facebook"/"instagram"/"meta", ou campanha é ID numérico longo → "Mídia Paga"
4. Se tem `gclid`, ou `fonte` contém "google" → "Mídia Paga"
5. Se `origemLead` contém "indicaç" → "Indicação"
6. Se `fonte` contém "site" ou "organic" → "Orgânico"
7. Fallback final → "Outros"

### Alterações

**`src/components/planning/marketing-indicators/ConversionsByChannelChart.tsx`**
- Criar função `inferTipoOrigem(card)` com as regras acima
- No `useMemo`, trocar `card.tipoOrigem?.trim() || '(Sem tipo)'` por `inferTipoOrigem(card)`
- Isso elimina a categoria "(Sem tipo)" redistribuindo os cards para tipos reais

### Impacto
- Apenas visual na tabela de conversão por tipo de origem
- Não afeta `detectChannel` nem nenhuma outra lógica de atribuição

