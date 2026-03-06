

## Diagnóstico: Divergência de Leads entre os dois cards

### O que está acontecendo

Os dois cards usam **fontes de dados diferentes** e isso é esperado em parte, mas a diferença é grande demais:

- **Card de cima** ("Mídia e Leads por Canal"): **1.509 leads** — dados da **API Meta Ads** (leads gerados na plataforma de anúncios)
- **Card de baixo** ("Atribuição por Canal - Dados Reais"): **958 leads** — dados do **Pipefy CRM** (leads que efetivamente entraram no funil de vendas)

A diferença (~550 leads) representa leads que a Meta contabilizou como conversão mas que não chegaram ao CRM, ou que chegaram mas não foram corretamente atribuídos ao canal "Meta Ads" pela lógica de detecção.

### Problema real

Não há um "bug" propriamente — são fontes diferentes. Porém, a interface não deixa isso claro, o que gera confusão. O card de cima diz "Leads" e o de baixo também diz "Leads", sem explicar que um é "leads de plataforma" e outro é "leads no CRM".

### Plano de correção (clareza na interface)

1. **Renomear métricas para distinguir as fontes**:
   - Card de cima: alterar label de "Leads" para "Leads (Plataforma)" no `ChannelMetricsCards`
   - Card de baixo: alterar label de "Leads" para "Leads (CRM)" no `ChannelAttributionCards`

2. **Adicionar tooltip explicativo** em cada seção:
   - Seção de cima: "Dados da API do Meta/Google Ads — leads registrados pela plataforma de anúncios"
   - Seção de baixo: "Dados do CRM Pipefy — leads atribuídos ao canal com base na origem cadastrada"

Isso elimina a confusão sem alterar a lógica de dados, que é correta para cada fonte.

