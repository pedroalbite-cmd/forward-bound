

## Conectar "Controle Metas" com dados do "Indicadores"

### Problema Identificado

O **Controle Metas** (SalesGoalsTab) e o **Indicadores** (IndicatorsTab) usam fontes de dados diferentes para o "Realizado":

| Componente | Fonte do Realizado |
|------------|-------------------|
| Controle Metas | `sales_realized` (tabela manual) |
| Indicadores | `pipefy_moviment_cfos` + Google Sheets (automático) |

Isso causa discrepância: o Indicadores mostra vendas automaticamente calculadas do Pipefy, enquanto o Controle Metas espera valores inseridos manualmente.

---

### Solucao Proposta

Criar um hook `useIndicatorsRealized` que:
1. Reutiliza os hooks existentes de analytics (`useModeloAtualMetas`, `useO2TaxMetas`, `useExpansaoMetas`)
2. Agrupa os dados por mes
3. Substitui o `useSalesRealized` no SalesGoalsTab

```text
SalesGoalsTab
    |
    v
useSalesRealized (tabela manual)  ->  useIndicatorsRealized (calcula do Pipefy/Sheets)
    |                                        |
    v                                        v
sales_realized (manual)             pipefy_moviment_cfos + Google Sheets
```

---

### Arquitetura da Integracao

```text
+----------------------+     +---------------------------+
|   IndicatorsTab      |     |     SalesGoalsTab         |
+----------------------+     +---------------------------+
         |                              |
         v                              v
+--------------------+        +------------------------+
| useModeloAtualMetas|        | useIndicatorsRealized  | <- NOVO HOOK
| useO2TaxMetas      |        |  (agrupa por mes)      |
| useExpansaoMetas   |        +------------------------+
+--------------------+                  |
         |                              v
         v                   Mesmos hooks do Indicadores
+------------------------+
| pipefy_moviment_cfos   |
| Google Sheets          |
+------------------------+
```

---

### Novo Hook: useIndicatorsRealized

O hook vai:

1. **Modelo Atual**: Usar `useModeloAtualMetas.getValueForPeriod` por mes
2. **O2 TAX**: Usar `useO2TaxMetas.getQtyForPeriod` * R$ 15.000 (ticket medio)
3. **Oxy Hacker**: Usar `useOxyHackerMetas.getQtyForPeriod` * R$ 54.000
4. **Franquia**: Usar `useExpansaoMetas.getQtyForPeriod` * R$ 140.000

```typescript
// src/hooks/useIndicatorsRealized.ts
export function useIndicatorsRealized(year: number = 2026) {
  // Definir periodo do ano inteiro
  const startOfYr = startOfYear(new Date(year, 0, 1));
  const endOfYr = endOfYear(new Date(year, 0, 1));
  
  // Usar os mesmos hooks do Indicadores
  const { getValueForPeriod: getModeloAtualValue } = useModeloAtualMetas(startOfYr, endOfYr);
  const { getQtyForPeriod: getO2TaxQty } = useO2TaxMetas(startOfYr, endOfYr);
  const { getQtyForPeriod: getOxyHackerQty } = useOxyHackerMetas(startOfYr, endOfYr);
  const { getQtyForPeriod: getExpansaoQty } = useExpansaoMetas(startOfYr, endOfYr);
  
  // Calcular realizado por mes para cada BU
  const realizedByBU = useMemo(() => {
    const result = { modelo_atual: {}, o2_tax: {}, oxy_hacker: {}, franquia: {} };
    
    months.forEach(month => {
      const monthStart = ... // calcular inicio do mes
      const monthEnd = ... // calcular fim do mes
      
      result.modelo_atual[month] = getModeloAtualValue('venda', monthStart, monthEnd);
      result.o2_tax[month] = getO2TaxQty('venda', monthStart, monthEnd) * 15000;
      result.oxy_hacker[month] = getOxyHackerQty('venda', monthStart, monthEnd) * 54000;
      result.franquia[month] = getExpansaoQty('venda', monthStart, monthEnd) * 140000;
    });
    
    return result;
  }, [...]);
  
  return { realizedByBU, totalRealized, isLoading };
}
```

---

### Alteracoes no SalesGoalsTab

Substituir o hook atual:

```diff
- import { useSalesRealized } from "@/hooks/useSalesRealized";
+ import { useIndicatorsRealized } from "@/hooks/useIndicatorsRealized";

export function SalesGoalsTab() {
-  const { realizedByBU, totalRealized, isLoading } = useSalesRealized(2026);
+  const { realizedByBU, totalRealized, isLoading } = useIndicatorsRealized(2026);
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/hooks/useIndicatorsRealized.ts` | **CRIAR** | Novo hook que calcula realizado do Pipefy/Sheets |
| `src/components/planning/SalesGoalsTab.tsx` | **MODIFICAR** | Usar novo hook no lugar de useSalesRealized |

---

### Resultado Esperado

Apos a integracao:

1. O **Controle Metas** mostrara automaticamente os valores realizados do Pipefy/Sheets
2. Consistencia total entre os valores do "Indicadores" e "Controle Metas"
3. Nao sera mais necessario inserir dados manualmente na tabela `sales_realized`
4. Qualquer venda registrada no Pipefy aparecera imediatamente em ambas as abas

---

### Decisao: Manter ou Remover sales_realized?

A tabela `sales_realized` pode continuar existindo para:
- Cenarios onde o usuario quer sobrescrever o valor calculado
- Historico de dados manuais

Podemos implementar uma logica hibrida:
```text
Realizado Final = sales_realized (se existir e > 0) || Calculado do Pipefy
```

Ou simplificar e usar apenas o valor calculado. **Qual preferencia?**

