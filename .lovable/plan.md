

## Remover feature de badge "excluídos" do acelerômetro MQL

### O que será feito
Remover o badge amarelo "X excluídos" que aparece abaixo do acelerômetro de MQL. O badge e todo o bloco de cálculo serão removidos.

### Alterações

**`src/components/planning/IndicatorsTab.tsx`**
- Linha 2462-2468: remover a prop `badge` inteira do `ClickableRadialCard` de MQL, deixando apenas as props existentes (key, title, realized, meta, isClickable, isLoading, onClick)

**Opcional — limpeza:**
- Linhas 215-220: o bloco `{badge && (...)}` no componente `RadialCard` interno pode permanecer (não causa efeito sem ninguém passar badge), ou ser removido para limpeza

