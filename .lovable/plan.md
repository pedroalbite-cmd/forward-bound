

## Incluir SaaS no Modelo Atual

O grupo "SaaS" do DRE (R$ 321k em Jan, R$ 295k em Fev) será mapeado para `modelo_atual`, somando-se ao CaaS.

### Alteração

**Arquivo**: `src/hooks/useOxyFinance.ts` — linha 9-14

Adicionar `'SaaS': 'modelo_atual'` e `'saas': 'modelo_atual'` ao `DRE_GROUP_TO_BU`:

```typescript
const DRE_GROUP_TO_BU: Record<string, BuType> = {
  'CaaS': 'modelo_atual',
  'caas': 'modelo_atual',
  'SaaS': 'modelo_atual',
  'saas': 'modelo_atual',
  'Tax': 'o2_tax',
  'tax': 'o2_tax',
};
```

### Impacto

- Modelo Atual Jan passará de R$ 665k → R$ 987k (665k CaaS + 321k SaaS)
- Gap contra meta de R$ 1.125M cairá de R$ 460k → R$ 138k
- Rollover para Fev será menor, metas efetivas mais realistas

