
## Plano: Corrigir Seleção de BUs nos Gráficos do Funil

### Problema Identificado

Quando você seleciona/desseleciona BUs no filtro, os valores de **Proposta Enviada** e **Contratos Assinados** nem sempre atualizam corretamente. O problema ocorre especificamente quando:

- Você seleciona 2 ou 3 BUs (não 1 e não 4)
- O sistema trata isso como "Consolidado" (`selectedBU = 'all'`)
- Os gráficos somam TODAS as 4 BUs, mesmo que apenas 2 ou 3 estejam selecionadas

**Exemplo:**
- Você seleciona apenas "Modelo Atual" + "O2 TAX" 
- O sistema passa `selectedBU = 'all'` para o funil
- O funil soma valores de Modelo Atual + O2 TAX + **Oxy Hacker** + **Franquia** (incorreto!)

---

### Causa Raiz

**Arquivo:** `src/components/planning/IndicatorsTab.tsx` (linha 189)

```typescript
const selectedBU: BUType | 'all' = hasSingleBU ? selectedBUs[0] : 'all';
```

Quando mais de 1 BU está selecionada, o sistema converte o array `selectedBUs` para a string `'all'`, perdendo a informação de **quais** BUs específicas estão selecionadas.

---

### Solução

Passar o array `selectedBUs` diretamente para os componentes filhos (`ClickableFunnelChart`, `LeadsStackedChart`, `LeadsMqlsStackedChart`), permitindo que eles saibam exatamente quais BUs devem ser consideradas nos cálculos.

---

### Mudanças por Arquivo

#### 1. `src/components/planning/ClickableFunnelChart.tsx`

| Mudança | Descrição |
|---------|-----------|
| Props | Adicionar `selectedBUs?: BUType[]` à interface |
| Flags | Derivar `includesModeloAtual`, `includesO2Tax`, etc. do array `selectedBUs` |
| Totais | Somar valores apenas das BUs incluídas no array |
| Valores monetários | Calcular `propostaValue` e `vendaValue` apenas para BUs selecionadas |

**Antes:**
```typescript
const useConsolidado = selectedBU === 'all';
// Soma TODAS as BUs quando useConsolidado = true
```

**Depois:**
```typescript
const selectedBUsArray = selectedBUs || (selectedBU === 'all' 
  ? ['modelo_atual', 'o2_tax', 'oxy_hacker', 'franquia'] 
  : [selectedBU]);

const includesModeloAtual = selectedBUsArray.includes('modelo_atual');
const includesO2Tax = selectedBUsArray.includes('o2_tax');
const includesOxyHacker = selectedBUsArray.includes('oxy_hacker');
const includesFranquia = selectedBUsArray.includes('franquia');

// Soma apenas as BUs selecionadas
const propostaValue = 
  (includesModeloAtual ? getFilteredModeloAtualValue('proposta') : 0) +
  (includesO2Tax ? getO2TaxValue('proposta', startDate, endDate) : 0) +
  (includesOxyHacker ? getOxyHackerValue('proposta', startDate, endDate) : 0) +
  (includesFranquia ? getExpansaoValue('proposta', startDate, endDate) : 0);
```

#### 2. `src/components/planning/LeadsStackedChart.tsx`

| Mudança | Descrição |
|---------|-----------|
| Props | Adicionar `selectedBUs?: BUType[]` à interface |
| Lógica | Usar flags derivadas do array para calcular totais |

#### 3. `src/components/planning/LeadsMqlsStackedChart.tsx`

| Mudança | Descrição |
|---------|-----------|
| Props | Adicionar `selectedBUs?: BUType[]` à interface |
| Lógica | Usar flags derivadas do array para calcular totais |

#### 4. `src/components/planning/IndicatorsTab.tsx`

| Mudança | Descrição |
|---------|-----------|
| Props passadas | Adicionar `selectedBUs={selectedBUs}` aos componentes filhos |

**Exemplo:**
```typescript
<ClickableFunnelChart 
  startDate={startDate} 
  endDate={endDate} 
  selectedBU={selectedBU}      // Mantido para compatibilidade
  selectedBUs={selectedBUs}    // Novo: array com BUs selecionadas
  selectedClosers={selectedClosers} 
/>
```

---

### Comportamento Esperado Após Correção

| Cenário | Resultado |
|---------|-----------|
| 1 BU selecionada | Mostra valores apenas dessa BU |
| 2 BUs selecionadas | Soma valores apenas das 2 BUs selecionadas |
| 3 BUs selecionadas | Soma valores apenas das 3 BUs selecionadas |
| 4 BUs selecionadas (Consolidado) | Soma valores de todas as 4 BUs |
| Selecionar/Desselecionar BUs | Valores atualizam imediatamente |

---

### Resumo de Arquivos

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/components/planning/ClickableFunnelChart.tsx` | Adicionar prop `selectedBUs` e usar para calcular totais e valores monetários |
| `src/components/planning/LeadsStackedChart.tsx` | Adicionar prop `selectedBUs` e usar para calcular totais |
| `src/components/planning/LeadsMqlsStackedChart.tsx` | Adicionar prop `selectedBUs` e usar para calcular totais |
| `src/components/planning/IndicatorsTab.tsx` | Passar `selectedBUs` para os 3 componentes acima |

---

### Diagrama de Fluxo

```text
┌─────────────────────────────────────────────────────────────┐
│ IndicatorsTab                                               │
│                                                             │
│   selectedBUs = ['modelo_atual', 'o2_tax']                  │
│                       │                                     │
│                       ▼                                     │
│   ┌───────────────────────────────────────────────┐         │
│   │ ClickableFunnelChart                          │         │
│   │   selectedBUs = ['modelo_atual', 'o2_tax']    │         │
│   │   includesModeloAtual = true                  │         │
│   │   includesO2Tax = true                        │         │
│   │   includesOxyHacker = false                   │         │
│   │   includesFranquia = false                    │         │
│   │                                               │         │
│   │   propostaValue = ModeloAtual + O2Tax         │         │
│   │   vendaValue = ModeloAtual + O2Tax            │         │
│   └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```
