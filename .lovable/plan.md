

## Remover Mock Data da Aba Marketing Indicadores

### Problema Atual

Quando a aba "Mkt Indicadores" não consegue buscar os dados da planilha Google (erro ou loading), ela exibe **dados fictícios** (mock data) que podem confundir o usuário.

### Solução

Remover o fallback para mock data e:
1. Retornar valores zerados quando não há dados
2. Expor o estado de erro para a UI poder exibir uma mensagem apropriada

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useMarketingIndicators.ts` | Remover `getMockData()` e retornar dados zerados + erro |
| `src/components/planning/MarketingIndicatorsTab.tsx` | Mostrar mensagem de erro quando dados não carregam |

---

### Mudanças no Hook

**Arquivo: `src/hooks/useMarketingIndicators.ts`**

1. **Remover a função `getMockData`** (linhas 33-141)

2. **Adicionar `error` no retorno do hook**:
```typescript
interface UseMarketingIndicatorsResult {
  data: MarketingMetrics;
  goals: MarketingGoals;
  costGoals: CostPerStageGoals;
  costByChannel: CostPerChannelStage[];
  isLoading: boolean;
  error: Error | null;  // NOVO
  refetch: () => void;
}
```

3. **Criar função para dados zerados** (substituir getMockData):
```typescript
function getEmptyData(): MarketingMetrics {
  return {
    roas: 0,
    roasLtv: 0,
    roiLtv: 0,
    cac: 0,
    ltv: 0,
    totalInvestment: 0,
    totalLeads: 0,
    totalMqls: 0,
    totalRms: 0,
    totalRrs: 0,
    totalPropostas: 0,
    totalVendas: 0,
    channels: [],
    campaigns: [],
    instagram: { instagramO2: 0, instagramPedro: 0, instagramTotal: 0 },
    revenue: { mrr: 0, setup: 0, pontual: 0, educacao: 0, gmv: 0 },
    costPerStage: { cpl: 0, cpmql: 0, cprm: 0, cprr: 0, cpp: 0, cpv: 0 },
  };
}
```

4. **Atualizar o useMemo** para usar dados zerados:
```typescript
const data = useMemo<MarketingMetrics>(() => {
  if (!sheetData || sheetError) {
    console.log('No sheet data available:', { sheetError });
    return getEmptyData();  // Retorna zerado, não mock
  }
  // ... resto do código de transformação
}, [sheetData, sheetError, selectedChannels]);
```

5. **Retornar error no hook**:
```typescript
return {
  data,
  goals,
  costGoals,
  costByChannel,
  isLoading: sheetLoading,
  error: sheetError,  // NOVO
  refetch,
};
```

---

### Mudanças na UI

**Arquivo: `src/components/planning/MarketingIndicatorsTab.tsx`**

Adicionar estado de erro:

```tsx
const { data, goals, costGoals, costByChannel, isLoading, error, refetch } = useMarketingIndicators({...});

// No início do conteúdo, após os filtros:
{error && (
  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
    <p className="text-destructive font-medium">Erro ao carregar dados de marketing</p>
    <p className="text-sm text-muted-foreground mt-1">
      Não foi possível conectar à planilha. Verifique a conexão e tente novamente.
    </p>
    <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
      Tentar novamente
    </Button>
  </div>
)}
```

---

### Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Erro ao buscar dados | Mostra dados fictícios | Mostra mensagem de erro |
| Loading | Mostra dados fictícios | Mostra skeleton/loading |
| Sucesso | Mostra dados reais | Mostra dados reais |

