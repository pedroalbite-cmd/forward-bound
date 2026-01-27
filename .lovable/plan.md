
## Plano: Corrigir Estrutura de Dados Compartilhada do O2 TAX

### Problema Identificado

Após unificar a `queryKey` para `['o2tax-movements-all']`, os dois hooks continuam retornando estruturas de dados diferentes:

- **useO2TaxMetas**: retorna `{ movements: O2TaxMovement[] }`
- **useO2TaxAnalytics**: retorna `{ cards: O2TaxCard[] }`

Quando `useO2TaxMetas` executa primeiro, o cache é preenchido com `{ movements: [...] }`, mas `useO2TaxAnalytics` tenta acessar `data?.cards`, que resulta em `undefined`, gerando um array vazio no drill-down.

---

### Solução Proposta

Modificar `useO2TaxAnalytics` para:
1. **Remover sua própria queryFn** - não precisa buscar dados
2. **Reutilizar o cache de `useO2TaxMetas`** - acessando `data?.movements`
3. **Processar os movements localmente** para criar os O2TaxCards que o drill-down precisa

---

### Mudanças no Arquivo

#### `src/hooks/useO2TaxAnalytics.ts`

**1. Alterar a query para reutilizar o cache existente:**

```typescript
// ANTES (linhas 86-157):
const { data, isLoading, error } = useQuery({
  queryKey: ['o2tax-movements-all'],
  queryFn: async () => {
    // ... busca própria que retorna { cards: [] }
  },
  staleTime: 5 * 60 * 1000,
  retry: 1,
});

const cards = data?.cards ?? [];

// DEPOIS:
const { data, isLoading, error } = useQuery({
  queryKey: ['o2tax-movements-all'],
  queryFn: async () => {
    // Mesma busca que useO2TaxMetas faz, retornando mesma estrutura
    const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
      body: { table: 'pipefy_cards_movements', action: 'preview', limit: 5000 }
    });

    if (fetchError) {
      console.error('Error fetching O2 TAX movements:', fetchError);
      throw fetchError;
    }

    if (!responseData?.data) {
      return { movements: [] };  // ← MESMA estrutura que useO2TaxMetas
    }

    const movements = responseData.data.map((row: any) => ({
      id: String(row.ID),
      titulo: row['Título'] || '',
      fase: row['Fase'] || '',
      faseAtual: row['Fase Atual'] || '',
      dataEntrada: parseDate(row['Entrada']) || new Date(),
      dataSaida: parseDate(row['Saída']),
      valorMRR: row['Valor MRR'] ? parseFloat(row['Valor MRR']) : null,
      valorPontual: row['Valor Pontual'] ? parseFloat(row['Valor Pontual']) : null,
      valorSetup: row['Valor Setup'] ? parseFloat(row['Valor Setup']) : null,
    }));

    return { movements };
  },
  staleTime: 5 * 60 * 1000,
  retry: 1,
});

// Processar movements para criar cards para drill-down
const cards = useMemo(() => {
  if (!data?.movements) return [];
  
  return data.movements.map((mov) => {
    const dataEntrada = mov.dataEntrada;
    const dataSaida = mov.dataSaida;
    
    // Calcular duração
    let duracao = 0;
    if (dataSaida) {
      duracao = Math.floor((dataSaida.getTime() - dataEntrada.getTime()) / 1000);
    } else {
      duracao = Math.floor((Date.now() - dataEntrada.getTime()) / 1000);
    }
    
    const valorPontual = mov.valorPontual || 0;
    const valorSetup = mov.valorSetup || 0;
    const valorMRR = mov.valorMRR || 0;
    
    return {
      id: mov.id,
      titulo: mov.titulo,
      fase: mov.fase,
      faseAtual: mov.faseAtual,
      faixa: null, // Será populado se precisar
      valorMRR,
      valorPontual,
      valorSetup,
      valor: valorPontual + valorSetup + valorMRR,
      responsavel: null,
      motivoPerda: null,
      dataEntrada,
      dataSaida,
      contato: null,
      setor: null,
      duracao,
    } as O2TaxCard;
  });
}, [data?.movements]);
```

**2. Adicionar campos faltantes na estrutura de movements (opcional):**

Alternativamente, podemos enriquecer a estrutura de `movements` em `useO2TaxMetas` para incluir todos os campos que `useO2TaxAnalytics` precisa, evitando processamento duplicado.

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useO2TaxAnalytics.ts` | Modificar queryFn para retornar `{ movements: [] }` e processar via useMemo |

---

### Benefícios

1. **Cache consistente**: Ambos os hooks compartilham a mesma estrutura de dados
2. **Sem race condition**: Qualquer hook que executar primeiro preenche o cache com a estrutura correta
3. **Drill-down funcional**: `getDetailItemsForIndicator` terá dados disponíveis

---

### Observações Técnicas

O processamento de `movements` → `cards` é feito em `useMemo`, garantindo que:
- Só é recalculado quando `data.movements` muda
- Mantém boa performance mesmo com 5000+ registros
- Aplica a mesma lógica de cálculo de duração que o código original
