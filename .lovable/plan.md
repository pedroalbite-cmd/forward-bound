

## Adicionar Opção de Dark Mode

### Contexto

O projeto já possui toda a infraestrutura para dark mode:
- Variáveis CSS para tema claro e escuro em `src/index.css`
- Tailwind configurado com `darkMode: ["class"]`
- Pacote `next-themes` já instalado

Só falta ativar o provider e adicionar um botão de toggle.

---

### Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/components/ThemeProvider.tsx` | Criar componente wrapper do ThemeProvider |
| `src/components/ThemeToggle.tsx` | Criar botão de toggle dark/light mode |
| `src/App.tsx` | Adicionar ThemeProvider envolvendo a aplicação |
| `src/pages/Planning2026.tsx` | Adicionar botão de toggle no header |

---

### Etapa 1: Criar ThemeProvider

```typescript
// src/components/ThemeProvider.tsx
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

---

### Etapa 2: Criar ThemeToggle

```typescript
// src/components/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="h-4 w-4 mr-2" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="h-4 w-4 mr-2" />
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### Etapa 3: Envolver App com ThemeProvider

```typescript
// src/App.tsx
import { ThemeProvider } from "@/components/ThemeProvider";

const App = () => (
  <ThemeProvider 
    attribute="class" 
    defaultTheme="system" 
    enableSystem
  >
    <QueryClientProvider client={queryClient}>
      {/* ... resto do código */}
    </QueryClientProvider>
  </ThemeProvider>
);
```

---

### Etapa 4: Adicionar Toggle no Header

No arquivo `src/pages/Planning2026.tsx`, adicionar o botão de toggle no header, ao lado do dropdown do usuario:

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

// No header, antes do dropdown do usuario:
<div className="flex items-center gap-2">
  <ThemeToggle />
  {/* ... botão de abas ocultas ... */}
  {/* ... dropdown do usuario ... */}
</div>
```

---

### Resultado Visual

| Tema | Aparencia |
|------|-----------|
| **Claro** | Background claro (#f7f7f7), texto escuro, cards brancos |
| **Escuro** | Background escuro (#141414), texto claro, cards grafite (#1f1f1f) |
| **Sistema** | Segue preferencia do SO do usuario |

O toggle ficara visivel no header com icone de sol/lua, permitindo alternar entre os modos a qualquer momento.

---

### Detalhes Tecnicos

- O `next-themes` persiste a preferencia do usuario em localStorage
- A transicao entre temas e suave, sem recarregar a pagina
- Todos os componentes UI ja usam variaveis CSS, entao funcionarao automaticamente
- Os graficos Recharts usam cores via variaveis CSS e se adaptarao ao tema

