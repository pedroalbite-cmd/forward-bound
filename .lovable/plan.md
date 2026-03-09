

## Plano: Adicionar linhas de Realizado e Gap na tabela de Metas Monetárias

### O que será feito

Adicionar duas linhas visuais na tabela existente da aba Metas Monetárias — **Realizado** e **Gap** — sem alterar nenhuma estrutura de banco ou lógica existente. Apenas leitura de dados já disponíveis.

### Alteração única

**Arquivo**: `src/components/planning/MonetaryMetasTab.tsx`

1. Importar `useIndicatorsRealized` do hook existente
2. Após a linha de "Pontual", adicionar um separador visual e duas novas `TableRow`:
   - **✅ Realizado**: mostra `realizedFunnelByBU[selectedBu][month].valor` formatado. Meses sem dados = "—"
   - **📊 Gap**: calcula `realizado - meta(faturamento)`. Verde se ≥ 0, vermelho se < 0. Totais acumulados na coluna Total

### Lógica

- Dados vêm de `useIndicatorsRealized().realizedFunnelByBU` que já retorna `{ [bu]: { [month]: { valor } } }`
- O mapeamento de BU keys é idêntico (`modelo_atual`, `o2_tax`, `oxy_hacker`, `franquia`)
- Meses do futuro (valor = 0 e sem dados) exibem "—" em cinza
- Nenhuma alteração de banco, hooks ou estrutura necessária

### Visual

```text
Pontual (15%) | 165k  | 165k  | 180k  | ... | Total
──────────────┼───────┼───────┼───────┼─────┼──────
✅ Realizado   | 980k  | 1.1M  |  —    | ... | 2.08M
📊 Gap        | -120k | +10k  |  —    | ... | -110k
```

