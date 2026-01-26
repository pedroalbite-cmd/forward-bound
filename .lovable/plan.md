

## Plano: Ajustar Filtro de Data Padrão na Aba Indicadores

### Problema Atual

Ao entrar na aba "Indicadores", o filtro de data é configurado para o ano inteiro:
- **Início:** 1 de janeiro do ano atual
- **Fim:** 31 de dezembro do ano atual

### Solução

Alterar o estado inicial para usar o mês atual:
- **Início:** 1º dia do mês atual
- **Fim:** Data de hoje

### Mudança Única

**Arquivo:** `src/components/planning/IndicatorsTab.tsx`

| Linha | Antes | Depois |
|-------|-------|--------|
| 155 | `useState<Date>(startOfYear(new Date(currentYear, 0, 1)))` | `useState<Date>(startOfMonth(new Date()))` |
| 156 | `useState<Date>(endOfYear(new Date(currentYear, 0, 1)))` | `useState<Date>(new Date())` |

### Código Atualizado

```typescript
// Antes
const [startDate, setStartDate] = useState<Date>(startOfYear(new Date(currentYear, 0, 1)));
const [endDate, setEndDate] = useState<Date>(endOfYear(new Date(currentYear, 0, 1)));

// Depois  
const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
const [endDate, setEndDate] = useState<Date>(new Date());
```

### Comportamento Esperado

| Cenário | Resultado |
|---------|-----------|
| Hoje é 26/01/2026 | Filtro padrão: 01/01/2026 a 26/01/2026 |
| Hoje é 15/03/2026 | Filtro padrão: 01/03/2026 a 15/03/2026 |
| Usuário muda datas manualmente | Funciona normalmente como antes |

### Observação

A função `startOfMonth` já está importada na linha 18 do arquivo, então não é necessário adicionar nenhuma importação nova.

