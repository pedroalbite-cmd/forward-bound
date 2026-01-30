

## Plano: Corrigir Fluxo de Recuperacao de Senha

### Problema

Quando o usuario clica no link de recuperacao de senha no email, o Supabase redireciona com tokens no hash fragment:
```
/auth?mode=reset#access_token=...&refresh_token=...&type=recovery
```

O codigo atual:
- Detecta `mode=reset` nos query params
- **NAO processa os tokens do hash fragment**
- Tenta chamar `updatePassword()` sem sessao autenticada
- Resulta em erro silencioso ou falha na atualizacao

---

### Solucao

Adicionar logica para:
1. Detectar tokens de recovery no hash fragment da URL
2. Processar a sessao usando esses tokens antes de mostrar o formulario
3. Exibir loading enquanto processa
4. Tratar erros se os tokens forem invalidos ou expirados

---

### Secao Tecnica

**Arquivo:** `src/pages/Auth.tsx`

**1. Adicionar estado para controlar processamento inicial:**
```typescript
const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);
const [recoveryError, setRecoveryError] = useState<string | null>(null);
```

**2. Adicionar useEffect para processar tokens de recovery:**
```typescript
useEffect(() => {
  // Verifica se ha tokens de recovery no hash fragment
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const type = hashParams.get('type');
  
  if (type === 'recovery' && accessToken && refreshToken) {
    setIsProcessingRecovery(true);
    setMode('reset');
    
    // O Supabase SDK automaticamente processa os tokens do hash
    // Precisamos aguardar a sessao ser estabelecida
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setIsProcessingRecovery(false);
      if (error || !session) {
        setRecoveryError('Link de recuperacao invalido ou expirado. Solicite um novo link.');
        setMode('forgot');
      }
      // Limpa o hash da URL para evitar reprocessamento
      window.history.replaceState(null, '', '/auth?mode=reset');
    });
  }
}, []);
```

**3. Adicionar UI para estado de processamento:**
```typescript
if (isProcessingRecovery) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Processando link de recuperacao...</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**4. Exibir erro de recovery se houver:**
```typescript
{recoveryError && (
  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
    {recoveryError}
  </div>
)}
```

**5. Verificar sessao antes de permitir reset:**
No `handleResetPassword`, verificar se ha sessao ativa:
```typescript
const handleResetPassword = async (values: ResetPasswordFormValues) => {
  // Verifica se ha sessao ativa (necessario para updateUser)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast({
      variant: 'destructive',
      title: 'Sessao expirada',
      description: 'Solicite um novo link de recuperacao de senha.',
    });
    setMode('forgot');
    return;
  }
  
  setIsSubmitting(true);
  const { error } = await updatePassword(values.password);
  // ... resto do codigo
};
```

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Auth.tsx` | Adicionar processamento de tokens de recovery do hash, estados de loading e erro, validacao de sessao |

---

### Fluxo Corrigido

```text
1. Usuario clica "Esqueci minha senha"
2. Digita email e envia
3. Recebe email com link (ex: /auth?mode=reset#access_token=...&type=recovery)
4. Clica no link
5. [NOVO] App detecta tokens no hash
6. [NOVO] App processa tokens e estabelece sessao
7. [NOVO] Exibe loading durante processamento
8. Exibe formulario de nova senha
9. Usuario digita nova senha
10. [NOVO] Valida que ha sessao ativa
11. Atualiza senha com sucesso
12. Redireciona para home logado
```

---

### Tratamento de Erros

| Cenario | Comportamento |
|---------|---------------|
| Link expirado | Mostra mensagem e redireciona para "Esqueci senha" |
| Token invalido | Mostra mensagem e redireciona para "Esqueci senha" |
| Sessao perdida durante digitacao | Toast de erro e redireciona para "Esqueci senha" |
| Sucesso | Toast de sucesso e redireciona para home |

