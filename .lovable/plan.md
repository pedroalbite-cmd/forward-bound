

# Trocar Authorization Code por Refresh Token

## Contexto

Voce completou o fluxo OAuth2 e recebeu um **authorization code** do Google. Esse code precisa ser trocado por um **refresh token** permanente atraves de uma chamada POST ao Google.

## Plano

### 1. Criar Edge Function temporaria `exchange-google-code`

Uma funcao simples que recebe o authorization code e faz o POST para `https://oauth2.googleapis.com/token` usando o `GOOGLE_ADS_CLIENT_ID` e `GOOGLE_ADS_CLIENT_SECRET` ja configurados. Retorna o `refresh_token` e `access_token`.

Parametros necessarios:
- `code`: o authorization code recebido na URL
- `redirect_uri`: deve ser exatamente o mesmo usado na autorizacao (provavelmente `http://localhost:3000`)

### 2. Chamar a funcao para obter o refresh token

Executar a funcao com o code `4/0AfrIepDaio4bs2RuGr5JFlehP5IIjkE1MQt0eZWXxG2VCweGFxCYevzNeEwTRIx_j4mH7Q` e o redirect_uri correto.

### 3. Atualizar o secret `GOOGLE_ADS_REFRESH_TOKEN`

Com o refresh_token retornado, atualizar o secret existente.

### 4. Remover a Edge Function temporaria

Apos obter o token, a funcao `exchange-google-code` sera removida pois nao e mais necessaria.

### 5. Testar a integracao

Chamar `fetch-google-campaigns` para validar que o novo refresh token funciona corretamente.

## Detalhes Tecnicos

A troca de code por token usa o endpoint `https://oauth2.googleapis.com/token` com:
- `grant_type`: `authorization_code`
- `code`: o code da URL
- `client_id` e `client_secret`: dos secrets ja configurados
- `redirect_uri`: deve bater exatamente com o usado na autorizacao

**Importante**: Authorization codes expiram em poucos minutos. Se demorar, sera necessario refazer o fluxo OAuth2.

## Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/exchange-google-code/index.ts` | Criar (temporario) |

