

## Plano: Calcular Duração Dinamicamente a partir de Entrada/Saída

### Problema Identificado

O campo `Duração (s)` no banco de dados externo está vazio (`null`) ou zerado (`"0"`) para a maioria dos registros. Isso acontece porque:
1. Cards que ainda estão na fase atual não têm "Saída" preenchida → `Duração (s)` = null
2. Movimentações instantâneas (entrada = saída) → `Duração (s)` = 0
3. O campo não está sendo calculado corretamente no sistema de origem

### Solução Proposta

**Calcular a duração dinamicamente** usando os campos `Entrada` e `Saída` em vez de depender do campo `Duração (s)`:

```text
┌────────────────────────────────────────────────────────────────────┐
│                    Lógica de Cálculo de Duração                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   SE Saída existe:                                                 │
│      duração = Saída - Entrada (em segundos)                      │
│                                                                    │
│   SE Saída não existe (card ainda na fase):                       │
│      duração = Agora - Entrada (tempo decorrido até hoje)         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Mudanças por Arquivo

#### 1. `src/hooks/useModeloAtualAnalytics.ts`

**Adicionar campo `dataSaida` ao ModeloAtualCard:**

```typescript
export interface ModeloAtualCard {
  // ... existentes ...
  dataSaida: Date | null;  // NOVO: "Saída" do banco
  duracao: number;         // Calculado dinamicamente
}
```

**Calcular duração ao parsear os dados:**

```typescript
const dataSaida = parseDate(row['Saída']);

// Calcular duração dinamicamente
let duracao = 0;
if (dataSaida) {
  // Card já saiu da fase: diferença entre Saída e Entrada
  duracao = Math.floor((dataSaida.getTime() - dataEntrada.getTime()) / 1000);
} else {
  // Card ainda está na fase: tempo desde entrada até agora
  duracao = Math.floor((Date.now() - dataEntrada.getTime()) / 1000);
}

cards.push({
  // ... existentes ...
  dataSaida,
  duracao,
});
```

---

#### 2. `src/hooks/useO2TaxAnalytics.ts`

**Mesma lógica:**

```typescript
// Adicionar ao O2TaxCard
dataSaida: Date | null;
duracao: number;

// Ao parsear:
const dataSaida = parseDate(row['Saída']);
let duracao = 0;
if (dataSaida) {
  duracao = Math.floor((dataSaida.getTime() - dataEntrada.getTime()) / 1000);
} else {
  duracao = Math.floor((Date.now() - dataEntrada.getTime()) / 1000);
}
```

---

#### 3. `src/hooks/useExpansaoAnalytics.ts`

**Mesma lógica para Oxy Hacker e Franquia.**

---

### Visualização Esperada

**Antes (campo Duração (s) do banco):**

| Empresa/Contato | Data | Tempo na Fase |
|-----------------|------|---------------|
| Empresa X | 26/01/2026 | - |
| Empresa Y | 25/01/2026 | - |
| Empresa Z | 20/01/2026 | - |

**Depois (calculado dinamicamente):**

| Empresa/Contato | Data | Tempo na Fase |
|-----------------|------|---------------|
| Empresa X | 26/01/2026 | 5h |
| Empresa Y | 25/01/2026 | 1d 8h |
| Empresa Z | 20/01/2026 | 6d 12h |

---

### Resumo de Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useModeloAtualAnalytics.ts` | Modificar | Extrair Saída e calcular duração dinamicamente |
| `src/hooks/useO2TaxAnalytics.ts` | Modificar | Extrair Saída e calcular duração dinamicamente |
| `src/hooks/useExpansaoAnalytics.ts` | Modificar | Extrair Saída e calcular duração dinamicamente |

---

### Considerações

1. **Cards na fase atual:** Mostrarão o tempo decorrido desde a entrada até agora (valor dinâmico)
2. **Cards que já saíram:** Mostrarão o tempo exato que ficaram na fase
3. **Performance:** O cálculo é feito no momento do parse, não afeta performance
4. **Fallback:** Se não houver data de entrada válida, duração será 0 (exibe "-")

