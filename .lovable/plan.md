

## Integração Automática: Admin Metas Monetárias ↔ Plan Growth

### Problema

Atualmente existem duas fontes de dados **desconectadas**:

1. **Plan Growth** - Usa valores **hardcoded** (metasTrimestrais, oxyHackerUnits, etc.)
2. **Admin > Metas Monetárias** - Armazena no banco `monetary_metas`, mas **não é usado** pelo Plan Growth

O botão "Importar Plan Growth" é manual e vai na direção errada (Plan Growth → Banco).

---

### Solução

Inverter a hierarquia: **Banco é a fonte da verdade, Plan Growth é fallback**

```text
┌───────────────────────────────────────────────────────────────────┐
│                    FLUXO DE DADOS                                 │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  monetary_metas (Banco)  ───────────────────────────────────────► │
│         ↓                                                         │
│  [Se valor > 0] ─────► Plan Growth EXIBE esses valores           │
│         ↓               (tabelas, gráficos, funnelData)          │
│  [Se vazio] ─────────► Fallback para cálculos hardcoded          │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│  Admin edita Metas Monetárias → Salva no banco                   │
│                                 ↓                                │
│  React Query invalida cache → Plan Growth re-renderiza           │
│                                 ↓                                │
│  Indicadores usam useConsolidatedMetas (já implementado)         │
└───────────────────────────────────────────────────────────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/usePlanGrowthData.ts` | **Modificar** | Ler metas do banco via `useMonetaryMetas` |
| `src/components/planning/MediaInvestmentTab.tsx` | **Modificar** | Usar metas do banco para cálculos de faturamento |
| `src/components/planning/MonetaryMetasTab.tsx` | **Modificar** | Remover botão "Importar Plan Growth" |

---

### Implementação Detalhada

#### 1. Modificar `usePlanGrowthData.ts` - Ler do Banco

Adicionar `useMonetaryMetas` e priorizar valores do banco:

```typescript
import { useMonetaryMetas, BuType, MonthType } from './useMonetaryMetas';

export function usePlanGrowthData() {
  const { setMetasPorBU, setFunnelData, isLoaded } = useMediaMetas();
  const { metas, isLoading: isLoadingMetas } = useMonetaryMetas();

  // Verificar se há metas no banco para uma BU
  const getMetasFromDb = (bu: BuType): Record<string, number> | null => {
    const buMetas = metas.filter(m => m.bu === bu);
    if (buMetas.length === 0) return null;
    
    // Verificar se tem algum valor > 0
    const hasValues = buMetas.some(m => 
      Number(m.faturamento) > 0 || Number(m.pontual) > 0
    );
    if (!hasValues) return null;
    
    // Retornar metas mensais do banco
    const result: Record<string, number> = {};
    buMetas.forEach(m => {
      result[m.month] = Number(m.faturamento) || Number(m.pontual) || 0;
    });
    return result;
  };

  // Para Modelo Atual: prioriza banco, fallback para metasTrimestrais
  const metasMensaisModeloAtual = useMemo(() => {
    const dbMetas = getMetasFromDb('modelo_atual');
    if (dbMetas && Object.values(dbMetas).some(v => v > 0)) {
      return dbMetas;
    }
    // Fallback para cálculo hardcoded
    return distributeQuarterlyToMonthly(metasTrimestrais);
  }, [metas]);

  // Para outras BUs: similar
  const oxyHackerMonthly = useMemo(() => {
    const dbMetas = getMetasFromDb('oxy_hacker');
    if (dbMetas && Object.values(dbMetas).some(v => v > 0)) {
      return dbMetas;
    }
    // Fallback
    return calculateFromUnits(oxyHackerUnits, 54000);
  }, [metas]);

  // ... similar para o2_tax e franquia
}
```

#### 2. Modificar `MediaInvestmentTab.tsx` - Sincronizar com Banco

Adicionar leitura do banco para os valores de faturamento mensal:

```typescript
import { useMonetaryMetas, BuType } from '@/hooks/useMonetaryMetas';

// Dentro do componente
const { metas, isLoading: isLoadingMetas } = useMonetaryMetas();

// Helper para obter metas do banco
const getDbMetasForBU = (bu: BuType): Record<string, number> | null => {
  const buMetas = metas.filter(m => m.bu === bu);
  const hasValues = buMetas.some(m => Number(m.faturamento) > 0 || Number(m.pontual) > 0);
  if (!hasValues) return null;
  
  const result: Record<string, number> = {};
  buMetas.forEach(m => {
    // Para BUs pontual-only, usar pontual
    const value = (bu === 'oxy_hacker' || bu === 'franquia')
      ? Number(m.pontual) || 0
      : Number(m.faturamento) || 0;
    result[m.month] = value;
  });
  return result;
};

// Metas mensais: banco > cálculo hardcoded
const metasMensaisModeloAtual = useMemo(() => {
  const dbMetas = getDbMetasForBU('modelo_atual');
  if (dbMetas) return dbMetas;
  return distributeQuarterlyToMonthly(metasTrimestrais);
}, [metas, metasTrimestrais]);

const oxyHackerMonthly = useMemo(() => {
  const dbMetas = getDbMetasForBU('oxy_hacker');
  if (dbMetas) return dbMetas;
  return calculateFromUnits(oxyHackerUnits, 54000);
}, [metas]);

// Similar para o2Tax e franquia...
```

#### 3. Remover Botão "Importar Plan Growth"

```diff
// MonetaryMetasTab.tsx

- <Button 
-   variant="outline" 
-   size="sm"
-   onClick={handleImportFromPlanGrowth}
-   disabled={!hasPlanGrowthData}
- >
-   <Download className="h-4 w-4 mr-2" />
-   Importar Plan Growth
- </Button>
```

Também remover:
- Função `handleImportFromPlanGrowth`
- State `hasPlanGrowthData`
- Badges de "Plan Growth" / "Banco" (opcional, pode manter para referência)

---

### Fluxo de Uso Após Implementação

```text
1. Admin acessa "Metas Monetárias"
   ├── Edita valores de Pontual para Oxy Hacker (ex: R$ 162.000 em Mar)
   └── Clica "Salvar" → Grava no banco

2. Automaticamente:
   ├── React Query invalida cache de 'monetary-metas'
   ├── MediaInvestmentTab re-renderiza
   ├── usePlanGrowthData re-calcula funnelData
   └── Indicadores atualizam via useConsolidatedMetas

3. Usuário abre Plan Growth
   └── VÊ os valores que ele editou no Admin (sem precisar importar nada)
```

---

### Impacto

| Área | Antes | Depois |
|------|-------|--------|
| **Plan Growth** | Valores hardcoded | Lê do banco (com fallback) |
| **Admin Metas** | Botão manual de importação | Sincronização automática |
| **Indicadores** | Já usa hook consolidado | Sem mudança |
| **UX** | 2 etapas (editar + importar) | 1 etapa (editar) |

---

### Detalhes Técnicos

**Dependências do hook usePlanGrowthData:**
- Adicionar dependência de `metas` do `useMonetaryMetas`
- Recalcular funnelData quando `metas` mudar

**Recálculo do funil:**
- Quando banco tiver valores, usar `faturamento / ticketMedio` para obter vendas
- Manter lógica de funil reverso para calcular leads, mqls, etc.

**BUs Pontual-Only (Oxy Hacker, Franquia):**
- Usar campo `pontual` do banco (já é 100% do faturamento)
- Não há MRR/Setup

