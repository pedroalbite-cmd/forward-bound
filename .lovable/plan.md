

## Corrigir formulario de cadastro e desativar confirmacao por email

### Problema identificado

O formulario de cadastro tem campos demais e possivelmente um problema de visibilidade do texto nos inputs (cor do texto vs fundo no tema escuro). Alem disso, o signup atual exige confirmacao por email.

### Alteracoes

**1. Simplificar o formulario de signup (`src/pages/Auth.tsx`)**
- Remover campo "Nome completo" (fullName)
- Remover campo "Confirmar senha" (confirmPassword)
- Manter apenas Email e Senha
- Atualizar o schema `signupSchema` para refletir isso
- Garantir que os inputs tenham `autoComplete` correto para que o browser nao interfira

**2. Forcar visibilidade do texto nos inputs**
- Adicionar `className` explicito com `text-foreground` nos inputs do formulario de auth para garantir contraste

**3. Desativar confirmacao por email**
- Usar `cloud--configure_auth` para habilitar auto-confirm de email signups
- Atualizar a mensagem de sucesso do signup (ja diz "conectado automaticamente", manter)

**4. Ajustar `handleSignup`**
- Remover referencia a `fullName` (passar string vazia ou remover parametro)

