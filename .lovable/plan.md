

## Plano: Definir Lucas como Closer e Carlos como SDR para Todos os Cards da O2 TAX

### Contexto

A BU **O2 TAX** possui uma estrutura de equipe fixa:
- **Closer**: Lucas Ilha (único closer da O2 TAX)
- **SDR**: Carlos (único SDR da O2 TAX)

Atualmente, os dados vindos do banco externo (`pipefy_cards_movements`) podem não ter esses campos preenchidos corretamente em todos os registros. A solicitação é garantir que:
1. Todos os cards da O2 TAX exibam **"Lucas"** como Closer
2. Todos os cards da O2 TAX exibam **"Carlos"** como SDR

---

### Alterações Necessárias

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useO2TaxAnalytics.ts` | Definir valores fixos para `sdr` e `closer` no mapeamento de cards |

---

### Seção Técnica

#### Alterações na Interface O2TaxCard

```typescript
export interface O2TaxCard {
  // ... campos existentes ...
  sdr: string;  // NOVO: SDR responsável (fixo: "Carlos" para O2 TAX)
}
```

#### Alterações no Mapeamento de Dados

Na `queryFn`, ao criar os movements:

```typescript
const movements = responseData.data.map((row: any) => ({
  // ... campos existentes ...
  // O2 TAX tem equipe fixa: Lucas (closer) e Carlos (SDR)
  closer: 'Lucas',
  sdr: 'Carlos',
}));
```

No `useMemo` que transforma movements em O2TaxCards:

```typescript
return {
  // ... campos existentes ...
  closer: 'Lucas',  // Fixo para O2 TAX
  sdr: 'Carlos',    // Fixo para O2 TAX
} as O2TaxCard;
```

#### Alterações na Função toDetailItem

```typescript
const toDetailItem = (card: O2TaxCard): DetailItem => ({
  // ... campos existentes ...
  sdr: card.sdr || 'Carlos',         // SDR fixo para O2 TAX
  closer: card.closer || 'Lucas',    // Closer fixo para O2 TAX
  responsible: 'Lucas',              // Usar Lucas como responsável padrão
});
```

---

### Comportamento Esperado

Após a implementação:

| Coluna | Valor Exibido (O2 TAX) |
|--------|------------------------|
| SDR | Carlos |
| Closer | Lucas |

Isso se aplica a:
- Drill-down dos aceleradores (Leads, MQL, RM, RR, Proposta, Venda)
- Drill-down do funil
- Filtros de SDR e Closer

---

### Impacto nos Filtros

Com esta alteração:
- Ao filtrar por **SDR = Carlos** com BU = O2 TAX, todos os registros serão exibidos
- Ao filtrar por **Closer = Lucas** com BU = O2 TAX, todos os registros serão exibidos
- Se o usuário tentar filtrar por outro SDR/Closer na O2 TAX, nenhum resultado será retornado (comportamento correto)

---

### Resumo das Alterações

1. **useO2TaxAnalytics.ts** - Adicionar campo `sdr` na interface `O2TaxCard`
2. **useO2TaxAnalytics.ts** - Definir `closer: 'Lucas'` e `sdr: 'Carlos'` no mapeamento dos movements
3. **useO2TaxAnalytics.ts** - Atualizar `toDetailItem` para incluir `sdr` no objeto retornado

