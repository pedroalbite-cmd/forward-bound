

## Plano: Adicionar Botao de Visibilidade de Senha no Login

### O Que Sera Adicionado

Botao com icone de olho em todos os campos de senha para permitir visualizar/ocultar a senha digitada.

| Formulario | Campos Afetados |
|------------|-----------------|
| Login | password |
| Cadastro | password, confirmPassword |
| Redefinir Senha | password, confirmPassword |

---

### Resultado Visual

```text
+------------------------------------------+
| Senha                                     |
| +--------------------------------------+ |
| | ••••••                          [👁] | |
| +--------------------------------------+ |
+------------------------------------------+

Ao clicar no icone:
- Olho aberto (Eye): senha visivel
- Olho fechado (EyeOff): senha oculta
```

---

### Secao Tecnica

**Arquivo:** `src/pages/Auth.tsx`

**1. Adicionar estados para controlar visibilidade:**
```typescript
const [showLoginPassword, setShowLoginPassword] = useState(false);
const [showSignupPassword, setShowSignupPassword] = useState(false);
const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
const [showResetPassword, setShowResetPassword] = useState(false);
const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
```

**2. Importar icones Eye e EyeOff:**
```typescript
import { Loader2, LogIn, UserPlus, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
```

**3. Atualizar campo de senha do Login (linhas 329-340):**
```typescript
<FormField
  control={loginForm.control}
  name="password"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Senha</FormLabel>
      <FormControl>
        <div className="relative">
          <Input 
            type={showLoginPassword ? "text" : "password"} 
            placeholder="••••••" 
            {...field} 
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowLoginPassword(!showLoginPassword)}
          >
            {showLoginPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**4. Aplicar o mesmo padrao para:**
- Senha do cadastro (linha 280)
- Confirmar senha do cadastro (linha 293)
- Nova senha (redefinir) (linha 213)
- Confirmar nova senha (redefinir) (linha 226)

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Auth.tsx` | Adicionar estados de visibilidade, importar icones, envolver inputs de senha com botao de toggle |

