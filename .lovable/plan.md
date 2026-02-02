

## Correção: Scroll Bloqueado no Modal de Drill-Down dos Acelerômetros

### Problema Identificado

Quando você clica em um acelerômetro de custo (CPL, CPMQL, etc.), o modal de drill-down abre mas **não permite rolagem** para ver o restante dos cards e tabela.

### Causa Raiz

O problema está em duas áreas:

1. **Tabela com `overflow-hidden`** (linha 243 do MarketingIndicatorsTab.tsx):
   ```tsx
   <div className="border rounded-lg overflow-hidden">
   ```
   Isso pode causar conflito com o scroll do modal.

2. **Estrutura do DialogContent**: O componente base usa `grid` layout que pode não propagar corretamente a altura para o scroll funcionar.

### Solução

Modificar o componente de drill-down para garantir scroll correto:

| Arquivo | Ação |
|---------|------|
| `src/components/planning/MarketingIndicatorsTab.tsx` | Ajustar estrutura de scroll do modal |

---

### Mudanças Propostas

**Arquivo: `src/components/planning/MarketingIndicatorsTab.tsx`**

```tsx
// ANTES (linha 180)
<DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">

// DEPOIS
<DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col">
  <DialogHeader>...</DialogHeader>
  
  {/* Área scrollável separada do header */}
  <div className="flex-1 overflow-y-auto pr-2">
    {/* Conteúdo do drill-down aqui */}
  </div>
</DialogContent>
```

A mudança:
1. Remove `overflow-auto` do DialogContent
2. Adiciona `flex flex-col` para layout flexível
3. Cria um `div` interno com `overflow-y-auto` que contém todo o conteúdo scrollável
4. Isso separa o header fixo da área de conteúdo scrollável

---

### Também Corrigir

**Tabela (linha 243):**
```tsx
// ANTES
<div className="border rounded-lg overflow-hidden">

// DEPOIS (manter overflow-x para scroll horizontal se necessário)
<div className="border rounded-lg overflow-x-auto">
```

---

### Resultado Esperado

Após a correção:
1. O modal abrirá corretamente ao clicar em qualquer acelerômetro
2. O conteúdo será scrollável verticalmente
3. O header do modal ficará fixo no topo
4. A tabela de canais será visível com scroll

