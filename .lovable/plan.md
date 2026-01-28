
## Plano: Expandir Gráfico de Faturamento para Todas as BUs

### Contexto

Atualmente, o gráfico "Faturamento por Período" só é exibido quando o **Modelo Atual** está selecionado. Isso ocorre porque o componente possui uma verificação na linha 284 que retorna `null` se `useModeloAtual` for `false`.

O objetivo é fazer o gráfico funcionar para **todas as BUs**: Modelo Atual, O2 TAX, Oxy Hacker e Franquia.

---

### Fontes de Dados por BU

| BU | Tabela | Hook | Campos Monetários |
|----|--------|------|-------------------|
| Modelo Atual | `pipefy_moviment_cfos` | `useModeloAtualMetas` | MRR, Setup, Pontual (campos individuais) |
| O2 TAX | `pipefy_cards_movements` | `useO2TaxMetas` | MRR + Setup + Pontual (ou ticket fixo R$ 15k) |
| Oxy Hacker | `pipefy_cards_movements_expansao` | `useOxyHackerMetas` | Taxa de franquia (ou ticket fixo R$ 54k) |
| Franquia | `pipefy_cards_movements_expansao` | `useExpansaoMetas` | Taxa de franquia (ou ticket fixo R$ 140k) |

---

### Mudanças Propostas

#### 1. Remover condição de renderização exclusiva do Modelo Atual

**Arquivo:** `src/components/planning/RevenueBreakdownChart.tsx` (linhas 283-286)

```typescript
// REMOVER este bloco:
if (!useModeloAtual) {
  return null;
}
```

#### 2. Adicionar hooks das outras BUs

```typescript
import { useO2TaxMetas } from "@/hooks/useO2TaxMetas";
import { useOxyHackerMetas } from "@/hooks/useOxyHackerMetas";
import { useExpansaoMetas } from "@/hooks/useExpansaoMetas";

// Dentro do componente:
const o2TaxMetas = useO2TaxMetas(startDate, endDate);
const oxyHackerMetas = useOxyHackerMetas(startDate, endDate);
const franquiaMetas = useExpansaoMetas(startDate, endDate);

// Flags para cada BU selecionada
const useModeloAtual = selectedBUs.includes('modelo_atual');
const useO2Tax = selectedBUs.includes('o2_tax');
const useOxyHacker = selectedBUs.includes('oxy_hacker');
const useFranquia = selectedBUs.includes('franquia');
```

#### 3. Criar funções para processar dados de cada BU

Para O2 TAX, Oxy Hacker e Franquia, os hooks já possuem a estrutura de `movements` com valores monetários. Precisamos criar lógica para:

- Filtrar cards da fase `'Ganho'` (venda)
- Agrupar por período (daily/weekly/monthly)
- Somar os valores usando a lógica de cada BU:
  - **O2 TAX**: valorMRR + valorSetup + valorPontual (fallback: R$ 15.000)
  - **Oxy Hacker**: taxaFranquia (fallback: R$ 54.000)
  - **Franquia**: taxaFranquia (fallback: R$ 140.000)

#### 4. Agregar dados de todas as BUs selecionadas

```typescript
const getGroupedMonetaryData = useMemo(() => {
  const result: ChartDataPoint[] = [];
  
  // Inicializar períodos baseado no grouping
  const periods = getPeriods(startDate, endDate, grouping);
  
  for (const period of periods) {
    let mrr = 0, setup = 0, pontual = 0, meta = 0;
    
    // Modelo Atual
    if (useModeloAtual) {
      const maDados = processModeloAtualForPeriod(period.start, period.end);
      mrr += maDados.mrr;
      setup += maDados.setup;
      pontual += maDados.pontual;
      meta += calcularMetaDoPeriodo(period.start, period.end, 'modelo_atual');
    }
    
    // O2 TAX (valores vão para "total" - não tem breakdown MRR/Setup/Pontual)
    if (useO2Tax) {
      const o2Dados = processO2TaxForPeriod(period.start, period.end);
      pontual += o2Dados.total; // ou criar categoria separada
      meta += calcularMetaDoPeriodo(period.start, period.end, 'o2_tax');
    }
    
    // Oxy Hacker
    if (useOxyHacker) {
      const ohDados = processOxyHackerForPeriod(period.start, period.end);
      pontual += ohDados.total;
      meta += calcularMetaDoPeriodo(period.start, period.end, 'oxy_hacker');
    }
    
    // Franquia
    if (useFranquia) {
      const frDados = processFranquiaForPeriod(period.start, period.end);
      pontual += frDados.total;
      meta += calcularMetaDoPeriodo(period.start, period.end, 'franquia');
    }
    
    result.push({
      label: period.label,
      mrr,
      setup,
      pontual,
      total: mrr + setup + pontual,
      meta,
      startDate: period.start,
      endDate: period.end,
    });
  }
  
  return { data: result };
}, [/* dependencies */]);
```

#### 5. Atualizar drill-down para incluir cards de todas as BUs

```typescript
const handleBarClick = (data: ChartDataPoint) => {
  let allCards: DetailItem[] = [];
  
  if (useModeloAtual) {
    const maCards = getModeloAtualCardsForPeriod(data.startDate, data.endDate);
    allCards = [...allCards, ...maCards.map(c => ({ ...c, product: 'CaaS' }))];
  }
  
  if (useO2Tax) {
    const o2Cards = getO2TaxCardsForPeriod(data.startDate, data.endDate);
    allCards = [...allCards, ...o2Cards.map(c => ({ ...c, product: 'O2 TAX' }))];
  }
  
  if (useOxyHacker) {
    const ohCards = getOxyHackerCardsForPeriod(data.startDate, data.endDate);
    allCards = [...allCards, ...ohCards.map(c => ({ ...c, product: 'Oxy Hacker' }))];
  }
  
  if (useFranquia) {
    const frCards = getFranquiaCardsForPeriod(data.startDate, data.endDate);
    allCards = [...allCards, ...frCards.map(c => ({ ...c, product: 'Franquia' }))];
  }
  
  setDetailItems(allCards);
  setDetailOpen(true);
};
```

#### 6. Calcular metas agregadas de todas as BUs

Usar o `MediaMetasContext` para buscar metas de cada BU e calcular pro-rata:

```typescript
const calcularMetaDoPeriodo = (start: Date, end: Date, bu?: BUType): number => {
  if (!metasPorBU) return 0;
  
  let total = 0;
  const busToUse = bu ? [bu] : selectedBUs;
  
  for (const buKey of busToUse) {
    const metas = metasPorBU[buKey];
    if (!metas) continue;
    
    const monthsInPeriod = eachMonthOfInterval({ start, end });
    for (const monthDate of monthsInPeriod) {
      const monthName = format(monthDate, 'MMM', { locale: ptBR });
      const monthMeta = metas[monthName] || 0;
      // Calcular pro-rata...
      total += monthMeta * (overlapDays / daysInMonth);
    }
  }
  
  return total;
};
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planning/RevenueBreakdownChart.tsx` | Adicionar hooks das outras BUs, remover condição exclusiva, agregar dados |

---

### Considerações Técnicas

1. **Performance**: Os hooks já estão sendo usados no IndicatorsTab, então o cache do React Query será compartilhado
2. **Breakdown MRR/Setup/Pontual**: Apenas o Modelo Atual tem esses campos separados. Para outras BUs, o valor total irá para a barra "Pontual" (ou podemos criar uma nova categoria "Valor")
3. **Metas**: Usar o `MediaMetasContext` que já calcula metas por BU e mês
4. **Drill-down**: O campo `product` diferenciará a origem de cada card na tabela de detalhes

---

### Resultado Esperado

O gráfico "Faturamento por Período" será exibido sempre que **pelo menos uma BU** estiver selecionada, mostrando:
- Barras empilhadas com MRR (azul), Setup (laranja) e Pontual (roxo)
- Linha de meta tracejada (verde)
- Totais agregados no header
- Drill-down ao clicar em qualquer período, mostrando cards de todas as BUs selecionadas
