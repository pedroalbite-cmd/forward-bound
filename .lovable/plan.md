
Objetivo
- Fazer o filtro de Closer “Lucas” realmente refletir os números da O2 TAX na aba Indicadores (hoje tudo fica 0), validando com teste real na UI antes de concluir.

O que eu testei e confirmei (no preview)
- Entrei na aba “Indicadores”.
- Selecionei “Lucas” em Closers: os KPIs ficaram 0.
- Selecionei BU = “O2 TAX”: ainda assim os KPIs ficaram 0.
- No console, o hook de metas da O2 TAX mostra que existem dados no período:
  - mql 43, rm 21, rr 7, proposta 1, venda 3 (logo, não é “falta de dados”).

Causa raiz mais provável (com evidência no código)
1) Colisão de cache do React Query (mesma queryKey com “formatos diferentes”)
- useO2TaxMetas e useO2TaxAnalytics usam a mesma queryKey: ['o2tax-movements-all'].
- Mas eles não precisam/retornam exatamente o mesmo “shape” de dados:
  - useO2TaxMetas mapeia só campos de fase/valores (não inclui closer/sdr).
  - useO2TaxAnalytics precisa de closer/sdr etc para filtrar e montar drill-down.
- Com a mesma key, o React Query pode entregar para o useO2TaxAnalytics um cache “pobre” (sem closer), fazendo:
  - card.closer virar '' em praticamente tudo
  - quando o filtro de closer está ativo, tudo é filtrado fora => 0.

2) “Todos Closers” na UI pode significar “todos selecionados”, não “sem filtro”
- No MultiSelect, quando existe 1 único closer disponível (O2 TAX), selecionar Lucas faz selectedClosers.length === options.length, e o texto exibido vira “Todos Closers”.
- Isso pode manter o filtro efetivamente ativo sem ficar óbvio (mas o principal bug ainda é o cache/shapes).

Correção proposta (2 ajustes pequenos e seguros)

A) Eliminar colisão de cache entre metas e analytics (principal)
Opção preferida (mais direta, menor risco de regressão):
- Mudar a queryKey do useO2TaxAnalytics para uma key diferente, por exemplo:
  - ['o2tax-movements-analytics']
- Manter o queryFn do useO2TaxAnalytics como está (mapeando closer/sdr etc).
Resultado esperado:
- Ao filtrar por Lucas, o o2TaxAnalytics passa a ter closer preenchido (quando existe no banco) e o filtro volta a funcionar.

Alternativa (se você preferir “uma fonte única”):
- Padronizar o “shape” no useO2TaxMetas para incluir closer/sdr (mesmo que ele não use), garantindo que qualquer cache compartilhado tenha os campos necessários.
(Escolho a opção preferida para finalizar rápido e evitar dependências entre hooks.)

B) Tratar “todos closers selecionados” como “sem filtro” (qualidade/UX)
- Criar uma variável no IndicatorsTab:
  - effectiveSelectedClosers = (selectedClosers.length === availableClosers.length) ? [] : selectedClosers
- Usar effectiveSelectedClosers em:
  - matchesCloserFilter
  - filtros de meta/realizado (closersForBU)
Resultado esperado:
- Quando estiver aparecendo “Todos Closers”, o sistema se comporta como “sem filtro”, evitando casos confusos (especialmente em BU com 1 closer).

Como vou testar (antes de dizer que corrigiu)
Checklist de teste visual (no preview):
1) BU = O2 TAX, Closers = Todos Closers
- Esperado: MQL 43, RM 21, RR 7, Proposta 1, Vendas 3 (para 01/01/2026–29/01/2026)
2) BU = Consolidado, Closers = Lucas
- Esperado: os indicadores devem refletir apenas a O2 TAX (mesmos números acima), e não zerar tudo.
3) BU = Consolidado, Closers = Pedro ou Daniel
- Esperado: O2 TAX não entra no cálculo (continua funcionando como regra atual), e o Modelo Atual aparece normal.
4) (Sanidade) Abrir drill-down de um indicador (ex: MQL) com filtro Lucas
- Esperado: lista não vazia (desde que existam registros com closer preenchido para aquela etapa).

Arquivos a alterar
- src/hooks/useO2TaxAnalytics.ts (mudar queryKey para não colidir com useO2TaxMetas)
- src/components/planning/IndicatorsTab.tsx (introduzir effectiveSelectedClosers e usá-lo no matchesCloserFilter e nos pontos de cálculo que dependem de selectedClosers)

Risco/impacto
- Baixo: mudança isolada, sem alteração de backend.
- Benefício: filtro por Lucas deixa de zerar tudo e passa a refletir os dados reais.

Critério de “feito”
- Eu consigo reproduzir no preview que “BU Consolidado + Closer Lucas” não zera os KPIs e exibe números coerentes com os logs do useO2TaxMetas.
