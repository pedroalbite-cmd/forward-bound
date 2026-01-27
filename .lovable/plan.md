

## Plano: Corrigir Drill-Down dos Acelerômetros O2 TAX

### Problema Identificado

Os acelerômetros (radial cards) mostram números corretos (ex: 25 MQLs), mas ao clicar, o modal de detalhes aparece **vazio** (0 registros).

### Causa Raiz

Existem **dois hooks separados** fazendo a mesma busca com **queryKeys diferentes**:

| Hook | QueryKey | Propósito |
|------|----------|-----------|
| `useO2TaxMetas` | `o2tax-metas-movements` | Números dos acelerômetros |
| `useO2TaxAnalytics` | `o2tax-analytics` | Lista para drill-down |

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    Problema de Sincronização                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   useO2TaxMetas ─────► Busca DB ─────► Acelerômetro: 25 MQLs ✓     │
│                        (completa)                                   │
│                                                                     │
│   useO2TaxAnalytics ──► Busca DB ──────────────────────────────────│
│                        (ainda carregando)     cards = [] vazio     │
│                                                                     │
│   Usuário clica ──────────► Drill-down mostra: 0 registros ✗       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Solução Proposta

**Unificar os hooks** para compartilhar o mesmo cache de dados, garantindo que quando os números aparecem nos acelerômetros, os dados para drill-down também estejam disponíveis.

---

### Mudanças por Arquivo

#### 1. `src/hooks/useO2TaxAnalytics.ts`

**Alterar a queryKey para compartilhar cache com useO2TaxMetas:**

```typescript
// ANTES (linha 88):
queryKey: ['o2tax-analytics', startDate.toISOString(), endDate.toISOString()],

// DEPOIS:
queryKey: ['o2tax-metas-movements', startDate?.toISOString(), endDate?.toISOString()],
```

**Problema**: A estrutura de dados retornada é diferente (movements vs cards).

**Solução alternativa - Remover parâmetros de data da queryKey:**

Como ambos os hooks buscam TODOS os dados (limite 5000) e filtram localmente, a queryKey não deveria depender das datas:

```typescript
// useO2TaxAnalytics - linha 88:
queryKey: ['o2tax-movements-data'],

// useO2TaxMetas - linha 46:
queryKey: ['o2tax-movements-data'],
```

Isso garante que ambos compartilhem o mesmo cache.

---

#### 2. Ajustar estrutura de dados para compatibilidade

Como os dois hooks processam os dados de forma diferente, a melhor solução é:

**Opção A: Criar hook base compartilhado**

Criar um hook `useO2TaxRawData` que apenas busca os dados brutos e é usado por ambos:

```typescript
// src/hooks/useO2TaxRawData.ts (NOVO ARQUIVO)
export function useO2TaxRawData() {
  return useQuery({
    queryKey: ['o2tax-raw-movements'],
    queryFn: async () => {
      const { data: responseData } = await supabase.functions.invoke('query-external-db', {
        body: { table: 'pipefy_cards_movements', action: 'preview', limit: 5000 }
      });
      return responseData?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Depois useO2TaxMetas e useO2TaxAnalytics usam este hook base
```

**Opção B (mais simples): Usar mesma queryKey e processar dados localmente**

Modificar `useO2TaxAnalytics` para usar a mesma queryKey que `useO2TaxMetas`, garantindo cache compartilhado.

---

### Implementação Recomendada (Opção B)

#### Arquivo: `src/hooks/useO2TaxAnalytics.ts`

**Mudança 1 - Alterar queryKey (linha 88):**

```typescript
// DE:
queryKey: ['o2tax-analytics', startDate.toISOString(), endDate.toISOString()],

// PARA (remover dependência de datas já que filtragem é local):
queryKey: ['o2tax-movements-all'],
```

#### Arquivo: `src/hooks/useO2TaxMetas.ts`

**Mudança 2 - Usar mesma queryKey (linha 46):**

```typescript
// DE:
queryKey: ['o2tax-metas-movements', startDate?.toISOString(), endDate?.toISOString()],

// PARA:
queryKey: ['o2tax-movements-all'],
```

---

### Benefícios da Correção

1. **Cache unificado**: Uma única busca ao banco, compartilhada entre ambos os hooks
2. **Consistência garantida**: Quando os acelerômetros mostram números, os dados de drill-down estarão disponíveis
3. **Performance**: Reduz chamadas duplicadas ao banco externo
4. **Sem condição de corrida**: Elimina o problema de timing

---

### Resumo de Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useO2TaxAnalytics.ts` | Modificar | Alterar queryKey para `['o2tax-movements-all']` |
| `src/hooks/useO2TaxMetas.ts` | Modificar | Alterar queryKey para `['o2tax-movements-all']` (mesma chave) |

---

### Consideração Técnica

A razão pela qual a queryKey original incluía as datas era para invalidar o cache quando o período mudasse. Porém, como:
1. A busca sempre retorna os mesmos dados (primeiros 5000 registros, sem filtro de data no servidor)
2. A filtragem por data é feita localmente nos métodos `getQtyForPeriod` e `getDetailItemsForIndicator`

Não há necessidade de incluir datas na queryKey. O cache pode ser compartilhado globalmente, e os filtros de data são aplicados dinamicamente ao usar os dados.

