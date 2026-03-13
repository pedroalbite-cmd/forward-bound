

## Correção do Mapeamento DRE → BUs

### Situação Atual (Errada)

O mapeamento no `useOxyFinance.ts` está assim:
- CaaS → modelo_atual
- **SaaS → oxy_hacker** (ERRADO)
- **Expansão → franquia** (INCOMPLETO)
- Tax → o2_tax

### Dados Reais da API DRE (code: "RB", Jan 2026)

| Grupo DRE | Jan | Fev | Mapeamento correto |
|-----------|-----|-----|-------------------|
| CaaS | R$ 665.383 | R$ 793.238 | modelo_atual |
| Tax | R$ 59.935 | R$ 40.977 | o2_tax |
| Expansão | R$ 54.000 | R$ 104.000 | oxy_hacker + franquia (combinados) |
| SaaS | R$ 321.839 | R$ 295.293 | ? (não mencionado pelo usuário) |
| Education | R$ 0 | R$ 0 | ignorar |

### Metas no banco (monetary_metas, Jan)

| BU | Meta Jan | Meta Fev |
|----|----------|----------|
| modelo_atual | R$ 1.125.000 | R$ 1.181.500 |
| o2_tax | R$ 80.000 | R$ 139.923 |
| oxy_hacker | R$ 54.000 | R$ 108.000 |
| franquia | R$ 0 | R$ 140.000 |

### Problema central

O grupo "Expansão" no DRE contém oxy_hacker + franquia **juntos**. Não existe separação no DRE. Para o rollover funcionar por BU individual, preciso distribuir o valor de Expansão proporcionalmente entre as metas de cada BU.

### Plano de alteração

**Arquivo**: `src/hooks/useOxyFinance.ts`

1. **Remover** mapeamento SaaS → oxy_hacker (SaaS não é oxy_hacker)
2. **Remover** mapeamento direto Expansão → franquia
3. **Criar lógica de split**: quando o grupo for "Expansão", dividir o valor proporcionalmente entre `oxy_hacker` e `franquia` com base na razão das metas daquele mês:
   - Ex Jan: oxy_hacker meta = 54k, franquia meta = 0 → 100% vai pra oxy_hacker (54k)
   - Ex Fev: oxy_hacker meta = 108k (43.5%), franquia meta = 140k (56.5%) → split proporcional de 104k
4. **Filtrar** apenas grupos com `code === "RB"` para evitar somar deduções/custos
5. Manter CaaS → modelo_atual e Tax → o2_tax

Para fazer o split proporcional, o hook `useOxyFinance` vai precisar receber as metas (ou os ratios) como parâmetro. Alternativa mais simples: fazer o split no `useEffectiveMetas` que já tem acesso a ambos os dados.

### Dúvida pendente

O grupo **SaaS** (R$ 321k em Jan) — deve ser ignorado? Ou pertence a alguma BU? Atualmente ele está sendo mapeado incorretamente para oxy_hacker, inflando o realizado dessa BU.

