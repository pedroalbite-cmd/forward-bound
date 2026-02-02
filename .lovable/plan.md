
## Atualizar Dark Mode com Visual Premium da Marca O2

### Objetivo

Atualizar as cores do dark mode para ficar mais alinhado com o visual da imagem de referência - um design moderno e premium com:
- Fundo mais escuro/preto puro
- Cards com grafite profundo
- Verde mais vibrante e brilhante para destaques
- Bordas sutis nos cards
- Contraste alto e visual "tech premium"

---

### Análise da Imagem de Referência

| Elemento | Cor Atual (Dark) | Cor da Referência |
|----------|------------------|-------------------|
| Background | hsl(0 0% 8%) = #141414 | #0A0A0A (preto puro) |
| Cards | hsl(0 0% 12%) = #1F1F1F | #151515 / #1A1A1A (grafite mais escuro) |
| Borders | hsl(0 0% 18%) = #2E2E2E | #2A2A2A ou verde sutil |
| Verde Primary | hsl(140 100% 28%) = #008F47 | #00FF66 (mais vibrante) |
| Verde Accent | hsl(140 100% 35%) = #00B24A | #00CC52 (brilhante) |
| Muted Text | hsl(0 0% 60%) = #999 | #888888 (mais sutil) |

---

### Arquivo a Modificar

| Arquivo | Seção | Ação |
|---------|-------|------|
| `src/index.css` | `.dark { ... }` (linhas 63-114) | Atualizar variáveis de cor para visual premium |

---

### Novas Cores para Dark Mode

```css
.dark {
  /* Fundo principal - preto puro premium */
  --background: 0 0% 4%;     /* #0A0A0A */
  --foreground: 0 0% 98%;    /* #FAFAFA branco suave */

  /* Cards - grafite profundo */
  --card: 0 0% 8%;           /* #141414 */
  --card-foreground: 0 0% 98%;

  /* Popover */
  --popover: 0 0% 8%;
  --popover-foreground: 0 0% 98%;

  /* Verde vibrante - mais brilhante */
  --primary: 145 100% 42%;   /* #00D65B - verde vibrante */
  --primary-foreground: 0 0% 4%;

  /* Secondary */
  --secondary: 0 0% 12%;     /* #1F1F1F */
  --secondary-foreground: 0 0% 98%;

  /* Muted - mais contrastante */
  --muted: 0 0% 14%;         /* #242424 */
  --muted-foreground: 0 0% 55%; /* #8C8C8C */

  /* Accent - verde neon */
  --accent: 145 100% 50%;    /* #00FF66 - verde neon */
  --accent-foreground: 0 0% 4%;

  /* Destructive - vermelho vibrante */
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;

  /* Borders - sutis */
  --border: 0 0% 16%;        /* #292929 */
  --input: 0 0% 16%;
  --ring: 145 100% 42%;

  /* Chart colors - paleta verde mais vibrante */
  --chart-1: 145 100% 42%;   /* Verde vibrante */
  --chart-2: 145 100% 50%;   /* Verde neon */
  --chart-3: 145 80% 35%;    /* Verde médio */
  --chart-4: 145 60% 55%;    /* Verde claro */
  --chart-5: 0 0% 45%;       /* Cinza */

  /* Success/Warning */
  --success: 145 100% 42%;
  --success-foreground: 0 0% 4%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 4%;
  --franquia: 250 60% 65%;
  --franquia-foreground: 0 0% 98%;

  /* Sidebar - ainda mais escuro */
  --sidebar-background: 0 0% 3%;  /* #080808 */
  --sidebar-foreground: 0 0% 98%;
  --sidebar-primary: 145 100% 42%;
  --sidebar-primary-foreground: 0 0% 4%;
  --sidebar-accent: 0 0% 10%;
  --sidebar-accent-foreground: 0 0% 98%;
  --sidebar-border: 0 0% 14%;
  --sidebar-ring: 145 100% 42%;
}
```

---

### Comparativo Visual

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Background** | Cinza escuro (#141414) | Preto puro (#0A0A0A) |
| **Cards** | Cinza médio (#1F1F1F) | Grafite premium (#141414) |
| **Verde** | Verde escuro (#008F47) | Verde vibrante (#00D65B) |
| **Accent** | Verde médio (#00B24A) | Verde neon (#00FF66) |
| **Contraste** | Moderado | Alto - premium |
| **Bordas** | Visíveis (#2E2E2E) | Sutis (#292929) |

---

### Melhorias Adicionais para Dark Mode

Além das cores, vou adicionar classes utilitárias específicas para dark mode:

```css
@layer utilities {
  /* Gradientes atualizados para dark mode */
  .dark .gradient-primary {
    background: linear-gradient(135deg, hsl(145 100% 50%) 0%, hsl(145 100% 35%) 100%);
  }

  /* Card com borda verde sutil no hover (estilo da referência) */
  .dark .glass-card {
    @apply bg-card/90 backdrop-blur-sm border border-border/60;
  }
  
  .dark .glass-card:hover {
    @apply border-primary/30;
  }
}
```

---

### Impacto Visual

Com essas mudanças, o dark mode terá:

1. **Fundo mais profundo** - Visual "abyss" premium como na referência
2. **Verde mais vibrante** - Destaque maior nos elementos de ação e indicadores
3. **Contraste alto** - Melhor legibilidade e visual moderno
4. **Cards integrados** - Fundos que se fundem suavemente com o background
5. **Bordas sutis** - Cards com definição sem ser pesado

---

### Nota Importante

Essas mudanças afetam **APENAS** o dark mode (classe `.dark`). O light mode permanece exatamente como está, garantindo que nada do que já foi construído seja afetado.
