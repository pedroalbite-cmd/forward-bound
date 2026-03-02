

## Restaurar Metas Originais da O2 TAX

### O que sera feito
Atualizar os 6 meses alterados (Jan-Jun) da O2 TAX na tabela `monetary_metas` de volta aos valores originais. Jul-Dez ja estao corretos.

### Valores a restaurar

| Mes | Atual | Original |
|-----|-------|----------|
| Jan | R$ 80 | R$ 123.600 |
| Fev | R$ 80 | R$ 135.960 |
| Mar | R$ 152.440 | R$ 152.440 (ok) |
| Abr | R$ 262.566 | R$ 176.100 |
| Mai | R$ 280.176 | R$ 193.710 |
| Jun | R$ 303.658 | R$ 217.190 |

Os campos derivados (MRR 25%, Setup 60%, Pontual 15%) e vendas serao recalculados proporcionalmente.

### Como
Executar 5 UPDATEs na tabela `monetary_metas` para os IDs correspondentes, restaurando faturamento, mrr, setup, pontual e vendas aos valores originais.

