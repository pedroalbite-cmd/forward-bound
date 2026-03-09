

## Confirmação da Lógica: Faturamento = MRR Base + Setup + Pontual

Sim, a lógica é exatamente essa. Vou resumir para confirmar:

### Como funciona mês a mês

```text
Fev realizado = MRR_fev (R$607k) + Setup_fev + Pontual_fev = ex: R$650k
Mar realizado = MRR_mar (R$613k) + Setup_mar + Pontual_mar = ex: R$680k

Acumulado até Mar = R$650k + R$680k = R$1.33M
```

Para a **linha de META** no gráfico:
```text
Mar meta = MRR_mar (R$613k) + meta_setup_mar + meta_pontual_mar
         = R$613k + ex: R$137k = R$750k

Acumulado meta até Mar = meta_fev + meta_mar
```

O MRR Base é **recorrente** — ele entra em todo mês como piso, e setup + pontual somam por cima.

### Implementação

1. **Criar tabela `mrr_base_monthly`** com os 15 valores fornecidos (Jan/2025 a Mar/2026)
2. **Criar hook `useMrrBase.ts`** para buscar esses valores
3. **Alterar o bloco do RevenuePaceChart** no `IndicatorsTab.tsx`:
   - **Realizado(mês)** = `MRR_base[mês]` + `setup_realizado[mês]` + `pontual_realizado[mês]`
   - **Meta(mês)** = `MRR_base[mês]` + `meta_setup[mês]` + `meta_pontual[mês]`
   - Acumular ambos para o gráfico cumulativo
4. **Separar setup e pontual dos cards de venda** — em vez de pegar `c.valor` (total), usar `c.valorSetup` e `c.valorPontual` individualmente

### O que muda vs. lógica atual

| Aspecto | Antes | Depois |
|---------|-------|--------|
| MRR Base | Derivado de metasPorBU (estimativa) | Valores reais da tabela |
| Realizado | mrrBase_prorata + valor total vendas | MRR_base(mês) + setup + pontual realizados |
| Meta | mrrBase_prorata + meta faturamento | MRR_base(mês) + meta setup + meta pontual |

### Arquivos
- **Migração SQL** — tabela + seed com 15 valores
- **`src/hooks/useMrrBase.ts`** — novo hook
- **`src/components/planning/IndicatorsTab.tsx`** — refatorar bloco do RevenuePaceChart (~linhas 2458-2577)

