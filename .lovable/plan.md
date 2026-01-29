

## Plano: Criar Seção Admin para Metas de MRR, Setup e Pontual por BU

### Contexto

Atualmente, as metas de MRR, Setup e Pontual sao calculadas como percentuais fixos do Faturamento:
- MRR: 60% do Faturamento
- Setup: 25% do Faturamento
- Pontual: 15% do Faturamento

O usuario quer poder definir valores absolutos (R$) para cada um desses indicadores por BU, configurados no Admin.

---

### O Que Sera Criado

| Item | Descricao |
|------|-----------|
| Nova tabela `monetary_metas` | Armazena metas de faturamento, MRR, Setup e Pontual por BU/mes |
| Nova aba no Admin | "Metas Monetarias" para configurar valores por BU |
| Hook `useMonetaryMetas` | Gerencia leitura/escrita das metas monetarias |
| Integracao no Context | MediaMetasContext armazena as metas monetarias |
| Atualizacao no IndicatorsTab | Usa valores do banco em vez de percentuais fixos |

---

### Estrutura da Nova Tabela

```sql
CREATE TABLE monetary_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bu text NOT NULL,           -- 'modelo_atual', 'o2_tax', 'oxy_hacker', 'franquia'
  month text NOT NULL,        -- 'Jan', 'Fev', etc.
  year integer NOT NULL DEFAULT 2026,
  faturamento numeric DEFAULT 0,
  mrr numeric DEFAULT 0,
  setup numeric DEFAULT 0,
  pontual numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bu, month, year)
);
```

---

### Nova Aba no Admin

```text
+-----------------------------------------------------------------------+
| Admin                                                                  |
+-----------------------------------------------------------------------+
| [Usuarios] [Metas por Closer] [Metas Monetarias] <-- NOVA ABA         |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| Metas Monetarias por BU                                               |
| Configure as metas de faturamento, MRR, Setup e Pontual por mes       |
+-----------------------------------------------------------------------+
| BU: [Modelo Atual v]                                                  |
+-----------------------------------------------------------------------+
|          | Jan    | Fev    | Mar    | Abr    | ... | Dez    | Total  |
+----------+--------+--------+--------+--------+-----+--------+--------+
| Fat.     | 1.125M | 1.238M | 1.387M | ...    | ... | ...    | 22.25M |
| MRR      |  675k  |  743k  |  832k  | ...    | ... | ...    | 13.35M |
| Setup    |  281k  |  309k  |  347k  | ...    | ... | ...    |  5.56M |
| Pontual  |  169k  |  186k  |  208k  | ...    | ... | ...    |  3.34M |
+----------+--------+--------+--------+--------+-----+--------+--------+
| [Calcular de % Padrao]  [Salvar]                                      |
+-----------------------------------------------------------------------+
```

**Funcionalidades:**
- Selector de BU no topo
- Tabela editavel com os 12 meses
- Coluna de Total calculada automaticamente
- Botao "Calcular de % Padrao" que preenche MRR/Setup/Pontual baseado no Faturamento (60/25/15)
- Valores do Faturamento vem do Plan Growth como sugestao inicial

---

### Secao Tecnica

**1. Nova Tabela no Supabase:**
- Criar migracao para `monetary_metas`
- RLS: Admins podem ler/escrever, usuarios autenticados apenas leem

**2. Hook `useMonetaryMetas.ts`:**
```typescript
export function useMonetaryMetas(year = 2026) {
  // Queries
  const { data: metas } = useQuery({
    queryKey: ['monetary-metas', year],
    queryFn: async () => {
      const { data } = await supabase
        .from('monetary_metas')
        .select('*')
        .eq('year', year);
      return data;
    }
  });

  // Getters
  const getMeta = (bu: string, month: string, field: 'faturamento' | 'mrr' | 'setup' | 'pontual') => {
    const meta = metas?.find(m => m.bu === bu && m.month === month);
    return meta?.[field] ?? 0;
  };

  // Mutations
  const bulkUpdateMetas = useMutation({...});

  return { metas, getMeta, bulkUpdateMetas };
}
```

**3. Componente `MonetaryMetasTab.tsx`:**
- Similar ao CloserMetasTab
- Selector de BU
- Tabela editavel com inputs numericos formatados como moeda
- Validacao para garantir que MRR + Setup + Pontual nao exceda Faturamento
- Botao para calcular percentuais padrao

**4. Atualizacao no `AdminTab.tsx`:**
```typescript
<TabsTrigger value="monetary-metas" className="gap-2">
  <DollarSign className="h-4 w-4" />
  Metas Monetarias
</TabsTrigger>

<TabsContent value="monetary-metas">
  <MonetaryMetasTab />
</TabsContent>
```

**5. Atualizacao no `MediaMetasContext.tsx`:**
- Adicionar estado para metas monetarias
- Expor getters para os valores

**6. Atualizacao no `IndicatorsTab.tsx`:**
```typescript
// ANTES
case 'mrr':
  return getFilteredFaturamentoMeta() * 0.6;

// DEPOIS
case 'mrr':
  if (monetaryMetas && hasMonetaryMetas(bu)) {
    return getMonetaryMeta(bu, month, 'mrr');
  }
  return getFilteredFaturamentoMeta() * 0.6; // fallback
```

**7. Atualizacao no Plan Growth:**
- Exibir aviso se existem metas monetarias customizadas no banco
- Permitir sincronizar do Plan Growth para o banco

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/migrations/XXX_create_monetary_metas.sql` | Tabela + RLS |
| `src/hooks/useMonetaryMetas.ts` | Hook para CRUD das metas |
| `src/components/planning/MonetaryMetasTab.tsx` | UI da aba no Admin |

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/planning/AdminTab.tsx` | Adicionar nova aba "Metas Monetarias" |
| `src/contexts/MediaMetasContext.tsx` | Adicionar estado para metas monetarias |
| `src/components/planning/IndicatorsTab.tsx` | Usar metas do banco em vez de percentuais |
| `src/components/planning/MediaInvestmentTab.tsx` | Sincronizar com banco (opcional) |

---

### Fluxo de Dados

```text
Admin (MonetaryMetasTab)
         |
         v
  monetary_metas table
         |
         v
  useMonetaryMetas hook
         |
         v
  MediaMetasContext
         |
    +----+----+
    |         |
    v         v
IndicatorsTab  Plan Growth
(usa metas)   (exibe/sincroniza)
```

---

### Valores Iniciais Sugeridos (Modelo Atual - Janeiro)

| Indicador | Valor (R$) | Calculo |
|-----------|------------|---------|
| Faturamento | 1.125.000 | Meta do Q1 * 30% |
| MRR | 675.000 | 60% do Faturamento |
| Setup | 281.250 | 25% do Faturamento |
| Pontual | 168.750 | 15% do Faturamento |

