
Objetivo: corrigir de vez a percepção de “não consigo digitar” no login/cadastro e separar isso dos erros de console que não são do app.

Diagnóstico (com base no que vi):
- Os erros `net::ERR_BLOCKED_BY_CLIENT` (Posthog, Facebook, TikTok, LinkedIn) são bloqueios de rastreadores pelo navegador/extensão e não impedem digitação no formulário.
- O replay mostra eventos de teclado chegando no input (ou seja, o campo recebe digitação). O problema é de exibição/estilo do texto (ou máscara de senha), não de captura do teclado.
- O formulário de auth está funcional em lógica; o foco é reforçar renderização dos campos em todos os estados do browser.

Plano de implementação:

1) Endurecer visual dos inputs no componente base
- Arquivo: `src/components/ui/input.tsx`
- Aplicar estilo explícito para texto e cursor com prioridade alta para evitar sobrescritas:
  - `color: hsl(var(--foreground))`
  - `caret-color: hsl(var(--foreground))`
  - `WebkitTextFillColor: hsl(var(--foreground))`
  - `opacity: 1`
- Manter classes atuais e adicionar fallback inline para casos de autofill/engine WebKit.

2) Corrigir estados de autofill que podem “sumir” com texto
- Arquivo: `src/index.css`
- Adicionar regras globais para:
  - `input:-webkit-autofill`
  - `input:-webkit-autofill:hover`
  - `input:-webkit-autofill:focus`
- Forçar `-webkit-text-fill-color` para foreground e normalizar background interno do autofill para não “apagar” texto.

3) Garantir controle explícito dos campos no Auth
- Arquivo: `src/pages/Auth.tsx`
- Em todos os `<Input {...field} />`, usar fallback de valor controlado:
  - `value={field.value ?? ''}`
- Evita qualquer edge case de undefined/controlado que possa causar comportamento visual inconsistente em alguns navegadores.

4) Melhorar clareza no campo senha (sem mudar segurança)
- Arquivo: `src/pages/Auth.tsx`
- Manter senha mascarada por padrão, mas reforçar UX:
  - manter/ajustar botão de olho para mostrar senha
  - opcional: texto curto “clique no olho para visualizar”
- Isso reduz a interpretação de que “não está digitando” quando na verdade está mascarando.

5) Tratamento dos erros de console reportados
- Sem alteração funcional no app para `ERR_BLOCKED_BY_CLIENT` e avisos de consentimento do ambiente externo.
- Deixar registrado que são ruídos de tracking/consent fora da lógica do formulário e não bloqueiam cadastro/login.

Validação após implementação:
- Testar login e cadastro em `/auth` com tema claro e escuro.
- Confirmar visualização do texto em:
  - email login
  - senha login (mascarada e visível ao clicar olho)
  - email cadastro
  - senha cadastro (mascarada e visível ao clicar olho)
- Confirmar que o cadastro com email+senha continua funcionando sem confirmação de email (já configurado).

Arquivos previstos:
- `src/components/ui/input.tsx`
- `src/index.css`
- `src/pages/Auth.tsx`
