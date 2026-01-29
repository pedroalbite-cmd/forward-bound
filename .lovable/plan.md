
## Plano: Adicionar Colunas SDR e Data Assinatura no Drill-Down de Vendas

### Contexto

O drill-down de **Vendas** (modal que abre ao clicar no acelerador "Vendas") atualmente exibe as seguintes colunas:

| Produto | Empresa | MRR | Setup | Pontual | Total | Closer | Ciclo |
|---------|---------|-----|-------|---------|-------|--------|-------|

O usuário solicitou adicionar:
1. **Coluna "SDR"** - antes da coluna "Closer" - mostrando qual SDR passou o lead para o closer
2. **Coluna "Data Assinatura"** - após "Empresa" - mostrando a data de assinatura do contrato

---

### Nova Estrutura de Colunas

| Produto | Empresa | Data Assinatura | MRR | Setup | Pontual | Total | SDR | Closer | Ciclo |
|---------|---------|-----------------|-----|-------|---------|-------|-----|--------|-------|

---

### Seção Técnica

#### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/planning/indicators/DetailSheet.tsx` | Adicionar campos `sdr` e `dataAssinatura` na interface `DetailItem` |
| `src/hooks/useModeloAtualAnalytics.ts` | Extrair campo "Data de assinatura do contrato" da tabela externa e separar `sdr` do `responsavel` |
| `src/components/planning/IndicatorsTab.tsx` | Atualizar as colunas do case `'venda'` no `handleFunnelIndicatorClick` |
| `src/components/planning/ClickableFunnelChart.tsx` | Atualizar as colunas para incluir SDR e Data Assinatura quando indicador = venda |

#### Alterações na Interface DetailItem

```typescript
export interface DetailItem {
  // ... campos existentes ...
  sdr?: string;              // NOVO: SDR responsável original
  dataAssinatura?: string;   // NOVO: Data de assinatura do contrato (ISO string)
}
```

#### Alterações no Hook useModeloAtualAnalytics

```typescript
// Interface ModeloAtualCard - adicionar campos
export interface ModeloAtualCard {
  // ... existentes ...
  sdr?: string;              // Extraído de "SDR responsável"
  dataAssinatura: Date | null; // Extraído de "Data de assinatura do contrato"
}

// Na queryFn, extrair os novos campos:
const dataAssinatura = parseDate(row['Data de assinatura do contrato']);
const sdr = String(row['SDR responsável'] || '').trim();

// Em toDetailItem, mapear os campos:
const toDetailItem = (card: ModeloAtualCard): DetailItem => ({
  // ... existentes ...
  sdr: card.sdr || undefined,
  dataAssinatura: card.dataAssinatura?.toISOString() || undefined,
});
```

#### Alterações nas Colunas de Vendas (IndicatorsTab.tsx)

```typescript
case 'venda': {
  // ...
  setDetailSheetColumns([
    { key: 'product', label: 'Produto', format: columnFormatters.product },
    { key: 'company', label: 'Empresa' },
    { key: 'dataAssinatura', label: 'Data Assinatura', format: columnFormatters.date }, // NOVO
    { key: 'mrr', label: 'MRR', format: columnFormatters.currency },
    { key: 'setup', label: 'Setup', format: columnFormatters.currency },
    { key: 'pontual', label: 'Pontual', format: columnFormatters.currency },
    { key: 'value', label: 'Total', format: columnFormatters.currency },
    { key: 'sdr', label: 'SDR' },           // NOVO - antes do Closer
    { key: 'responsible', label: 'Closer' },
    { key: 'cicloVenda', label: 'Ciclo', format: columnFormatters.cicloVenda },
  ]);
  // ...
}
```

---

### Campo "Data de Assinatura do Contrato" no Banco

De acordo com a memória do sistema, o campo `Data de assinatura do contrato` existe na tabela `pipefy_moviment_cfos` e era usado anteriormente para determinar a data da venda. Agora ele será recuperado apenas para exibição, já que a lógica de contabilização usa a data de entrada na fase "Ganho".

---

### Considerações Sobre Outras BUs

As BUs **O2 TAX**, **Oxy Hacker** e **Franquia** utilizam hooks diferentes (`useO2TaxAnalytics`, `useExpansaoAnalytics`). Para que a coluna SDR funcione corretamente nessas BUs também, será necessário:

1. Verificar se essas tabelas possuem os campos equivalentes
2. Atualizar os hooks correspondentes para extrair `sdr` e `dataAssinatura`

Se os campos não existirem nessas BUs, as colunas exibirão "-" como fallback.

---

### Resumo das Alterações

1. **DetailSheet.tsx** - Adicionar `sdr?: string` e `dataAssinatura?: string` à interface `DetailItem`
2. **useModeloAtualAnalytics.ts** - Adicionar campos `sdr` e `dataAssinatura` na extração e mapeamento
3. **IndicatorsTab.tsx** - Atualizar colunas do drill-down de vendas (adicionar SDR antes de Closer, Data Assinatura após Empresa)
4. **ClickableFunnelChart.tsx** - Atualizar colunas para manter consistência no drill-down via funil
