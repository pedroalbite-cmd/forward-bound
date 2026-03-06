

## Plano: Filtrar drill-down de canal para mostrar apenas vendas

### Alteração

**`src/components/planning/MarketingIndicatorsTab.tsx`** (linhas 446-483)

- Adicionar `.filter(card => card.fase === 'Contrato assinado')` após o filtro de canal existente, para mostrar apenas os cards que chegaram à fase de venda
- Atualizar o título de `"Leads — {canal}"` para `"Vendas — {canal}"`
- Atualizar a descrição para refletir que são vendas

Somente essa alteração pontual no filtro e textos. Nenhum outro arquivo precisa mudar.

