
## Remover Filtro de BU do Marketing Indicadores

### Objetivo
Simplificar a aba de Marketing Indicadores removendo o seletor de Business Units, mantendo sempre a visão consolidada (todas as BUs).

---

### Alterações

| Arquivo | Ação |
|---------|------|
| `src/components/planning/MarketingIndicatorsTab.tsx` | Remover o componente MultiSelect de BU e ajustar a lógica para usar todas as BUs sempre |

---

### Detalhes Técnicos

1. **Remover o MultiSelect de BU** (linhas 195-201)
   - Eliminar o seletor visual do header

2. **Simplificar o estado `selectedBUs`**
   - Ao invés de `useState(['Modelo Atual'])`, usar uma constante com todas as BUs disponíveis
   - Isso fará com que o cálculo de receita sempre some Modelo Atual + O2 TAX

3. **Ajustar o cálculo de receita real** (linhas 88-122)
   - Com `selectedBUs` contendo sempre todas as BUs, o sistema automaticamente consolidará os dados

---

### Resultado Esperado

**Antes:**
- Header com: Data | **Filtro BU** | Filtro Canal | Refresh

**Depois:**
- Header com: Data | Filtro Canal | Refresh (sem filtro de BU)
- Dados sempre consolidados somando Modelo Atual + O2 TAX para receita

---

### Impacto
- Interface mais limpa e simples
- Dados de receita sempre consolidados automaticamente
- Mantém o filtro de Canal para segmentar por Meta Ads / Google Ads
