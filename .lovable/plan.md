

## Plano: Reorganizar layout e unificar abas

### Mudança 1: Mover gráfico de Faturamento para baixo dos acelerômetros

**Atual**: Header → Revenue Pace Chart → Radials Qty → Radials Monetários → MQLs/Funil
**Novo**: Header → Radials Qty → Radials Monetários → Revenue Pace Chart → MQLs/Funil

Alteração em `src/components/planning/IndicatorsTab.tsx`: mover o bloco do `RevenuePaceChart` (linhas 2426-2546) para depois dos radials monetários (após linha 2577).

### Mudança 2: Unificar 3 abas em 1 com sub-abas

Remover as abas separadas `indicators`, `marketing_indicators` e `nps` do menu principal. Manter apenas `indicators` ("Indicadores") que internamente terá sub-abas:

- **Comercial** → conteúdo atual do `IndicatorsTab`
- **Marketing** → conteúdo atual do `MarketingIndicatorsTab`
- **NPS** → conteúdo atual do `NpsTab`
- **Growth** → placeholder vazio por enquanto

**Alterações**:

1. **`src/pages/Planning2026.tsx`**:
   - Remover entradas `marketing_indicators` e `nps` do `TAB_CONFIG`
   - Remover os `TabsContent` correspondentes
   - O `TabsContent` de `indicators` já renderiza o novo componente wrapper

2. **`src/components/planning/IndicatorsTab.tsx`** (ou criar wrapper):
   - Envolver o conteúdo atual em uma sub-aba "Comercial"
   - Adicionar `Tabs` internas com 4 sub-abas: Comercial, Marketing, NPS, Growth
   - Importar `MarketingIndicatorsTab` e `NpsTab`

3. **`src/hooks/useUserPermissions.ts`**:
   - Manter `marketing_indicators` e `nps` como permissões válidas mas mapear para acesso à aba `indicators`
   - Quem tem permissão a `indicators`, `marketing_indicators` ou `nps` vê a aba "Indicadores"

### Arquivos alterados
- `src/components/planning/IndicatorsTab.tsx` — reordenar Revenue chart + adicionar sub-abas
- `src/pages/Planning2026.tsx` — remover abas separadas
- `src/hooks/useUserPermissions.ts` — ajustar permissões

