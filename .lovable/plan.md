

## Atualizar MRR Base de Março/2026 para R$ 755.000

### Situação
- Tabela `mrr_base_monthly`, registro de `Mar` / `2026` está com valor **939.408,18**
- Precisa ser atualizado para **755.000**
- Este valor alimenta o cálculo de "A Vender" do Modelo Atual no Plan Growth via `useMrrBase` hook

### Ação
Executar um UPDATE na tabela `mrr_base_monthly`:

```sql
UPDATE mrr_base_monthly 
SET value = 755000, updated_at = now() 
WHERE month = 'Mar' AND year = 2026;
```

Além disso, verificar no código `usePlanGrowthData.ts` se o valor hardcoded de `realMrrBase.Mar = 756521.10` (linha ~270) precisa ser removido ou atualizado para 755000, pois esse override pode sobrescrever o valor do banco.

### Impacto
- O "A Vender" de Março do Modelo Atual será recalculado automaticamente (meta total - 755k)
- Nenhuma outra BU é afetada

