
## Corrigir Filtro de Vendas no Gráfico de Faturamento

### Problema

O gráfico "Faturamento por Período" está filtrando movimentos por `fase === 'Ganho'`, mas a maioria dos hooks de BUs usam `'Contrato assinado'` como a fase que representa uma venda. Isso faz com que apenas dados da O2 TAX (que aparentemente tem cards com a fase "Ganho" nos dados) apareçam no gráfico.

### Causa Raiz

No `RevenueChartComparison.tsx`, linha 118-121:
```typescript
const maSalesCards = maMovements.filter(m => m.fase === 'Ganho');
const o2SalesMovements = o2TaxMetas.movements.filter(m => m.fase === 'Ganho');
const franquiaSalesMovements = franquiaMetas.movements.filter(m => m.fase === 'Ganho');
const oxyHackerSalesMovements = oxyHackerMetas.movements.filter(m => m.fase === 'Ganho');
```

Mas nos hooks:
- `useModeloAtualMetas`: Mapeia `'Contrato assinado'` → `'venda'`
- `useO2TaxMetas`: Mapeia `'Contrato assinado'` → `'venda'`
- `useExpansaoMetas`: Mapeia `'Contrato assinado'` → `'venda'`
- `useOxyHackerMetas`: Mapeia `'Contrato assinado'` → `'venda'`

### Solução

Alterar o filtro para usar `'Contrato assinado'` (a fase real nos dados) ou aceitar ambas as fases:

```typescript
// Aceitar tanto 'Ganho' quanto 'Contrato assinado' para compatibilidade
const isWonPhase = (fase: string) => fase === 'Ganho' || fase === 'Contrato assinado';

const maSalesCards = maMovements.filter(m => isWonPhase(m.fase));
const o2SalesMovements = o2TaxMetas.movements.filter(m => isWonPhase(m.fase));
const franquiaSalesMovements = franquiaMetas.movements.filter(m => isWonPhase(m.fase));
const oxyHackerSalesMovements = oxyHackerMetas.movements.filter(m => isWonPhase(m.fase));
```

---

### Alteração Técnica

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/RevenueChartComparison.tsx` | Atualizar filtro de fases para incluir 'Contrato assinado' além de 'Ganho' |

---

### Código a Modificar

**Antes (linhas 117-121):**
```typescript
const chartData = useMemo(() => {
  const maSalesCards = maMovements.filter(m => m.fase === 'Ganho');
  const o2SalesMovements = o2TaxMetas.movements.filter(m => m.fase === 'Ganho');
  const franquiaSalesMovements = franquiaMetas.movements.filter(m => m.fase === 'Ganho');
  const oxyHackerSalesMovements = oxyHackerMetas.movements.filter(m => m.fase === 'Ganho');
```

**Depois:**
```typescript
const chartData = useMemo(() => {
  // Aceitar tanto 'Ganho' quanto 'Contrato assinado' como fases de venda ganhas
  const isWonPhase = (fase: string) => fase === 'Ganho' || fase === 'Contrato assinado';
  
  const maSalesCards = maMovements.filter(m => isWonPhase(m.fase));
  const o2SalesMovements = o2TaxMetas.movements.filter(m => isWonPhase(m.fase));
  const franquiaSalesMovements = franquiaMetas.movements.filter(m => isWonPhase(m.fase));
  const oxyHackerSalesMovements = oxyHackerMetas.movements.filter(m => isWonPhase(m.fase));
```

---

### Resultado Esperado

Após a correção, o gráfico "Faturamento por Período" exibirá dados de todas as 4 BUs:
- **Modelo Atual**: Barras azuis com valores reais de MRR + Setup + Pontual
- **O2 TAX**: Barras âmbar com valores do banco de dados
- **Oxy Hacker**: Barras roxas com ticket de R$ 54k
- **Franquia**: Barras verdes com ticket de R$ 140k
