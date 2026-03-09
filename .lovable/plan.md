

## Plano: Adicionar override de Março 2026

Atualizar o registro de Março/2026 na tabela `mrr_base_monthly` com o valor previsto de **R$ 939.408,18** e marcar como `is_total_override = true`, igual foi feito para Janeiro e Fevereiro.

### Alteração

Uma única operação de UPDATE no banco:
```sql
UPDATE mrr_base_monthly 
SET value = 939408.18, is_total_override = true 
WHERE month = 'Mar' AND year = 2026;
```

Nenhuma alteração de código é necessária — a lógica do `IndicatorsTab.tsx` já trata `is_total_override = true` usando o valor direto.

