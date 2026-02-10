

# Branding O2 Inc. - Melhorias de Design no Dashboard

## Resumo

Aplicar a identidade visual do site o2inc.com.br ao dashboard: adicionar o logo SVG no header e na pagina de login, refinar efeitos visuais nos cards (glow verde no hover), ajustar tipografia para mais impacto, e garantir consistencia visual com o branding da empresa.

## Mudancas

### 1. Adicionar logo SVG ao projeto

- Copiar `user-uploads://696655fa4a1ef257c894567f_logo_o2.svg` para `src/assets/logo_o2.svg`
- O SVG usa verde (#63F161) e branco -- perfeito para dark mode
- Para light mode, as partes brancas (texto "O2 INC.") precisam ser escuras, entao criaremos um componente React que adapta o fill conforme o tema

### 2. Componente `O2Logo` reutilizavel

**Novo arquivo: `src/components/O2Logo.tsx`**

- Componente que renderiza o SVG inline
- Aceita props de `className` e `height`
- Adapta a cor do texto (branco no dark, preto no light) usando `currentColor`
- O verde (#63F161) permanece fixo em ambos os temas

### 3. Header do Dashboard (`src/pages/Planning2026.tsx`)

**Antes:**
```
<h1 className="font-display text-xl font-bold text-gradient">
  Planejamento Estrategico
</h1>
```

**Depois:**
- Substituir o h1 por `<O2Logo />` com altura ~32px
- Ao lado, manter um texto menor "Planejamento Estrategico" como subtitulo
- Layout: logo + separador vertical + subtitulo

### 4. Pagina de Login (`src/pages/Auth.tsx`)

**Melhorias:**
- Fundo escuro forcar com gradiente sutil (`bg-[#0A0A0A]` ou `bg-background`)
- Adicionar `<O2Logo />` acima do card de login (centralizado, tamanho maior ~48px de altura)
- Card com borda sutil verde no dark mode (`border-primary/20`)
- Botao de submit com estilo verde solido (ja usa `bg-primary`)
- Adicionar um glow sutil verde atras do logo (`shadow-[0_0_60px_rgba(99,241,97,0.15)]`)

### 5. Efeito de glow nos cards (`src/index.css`)

**Nova utility class `.card-glow`:**
```css
.card-glow {
  transition: border-color 0.3s, box-shadow 0.3s;
}
.dark .card-glow:hover {
  border-color: hsl(145 100% 42% / 0.3);
  box-shadow: 0 0 20px hsl(145 100% 42% / 0.08);
}
```

- Aplicar ao componente `Card` base (ou usar seletivamente nos cards do dashboard)

### 6. Tipografia dos titulos

**`src/index.css`:**
- Aumentar peso dos h1/h2 para `font-weight: 700` (ja esta, confirmar)
- Adicionar `letter-spacing: -0.02em` nos titulos para visual mais moderno e compacto (igual ao site O2)

### 7. Ajuste fino no footer (`src/pages/Planning2026.tsx`)

- Substituir texto "Planejamento Estrategico 2026" por logo O2 pequeno + texto
- Adicionar um separador com borda verde sutil

## Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `src/assets/logo_o2.svg` | Novo (copia do upload) |
| `src/components/O2Logo.tsx` | Novo componente |
| `src/pages/Planning2026.tsx` | Header e footer com logo |
| `src/pages/Auth.tsx` | Login page redesign |
| `src/index.css` | Card glow + tipografia |

## Resultado esperado

- Logo O2 Inc. visivel no header do dashboard e na pagina de login
- Cards com efeito de glow verde sutil no hover (dark mode)
- Pagina de login com visual premium alinhado ao site o2inc.com.br
- Tipografia mais impactante nos titulos
- Identidade visual consistente em todo o dashboard

