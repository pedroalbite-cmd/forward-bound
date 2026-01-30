

## Plano: Corrigir Input para Aceitar Valores Grandes (400.000+)

### Problema Identificado

O campo de input usa `formatCurrency` para exibir valores abreviados (ex: "4k", "1M"), mas o `onChange` tenta parsear esse texto formatado enquanto o usuário digita. Isso causa conflito:

| Ação | Resultado Atual | Resultado Esperado |
|------|-----------------|-------------------|
| Digita "4000" | Exibe "4k", valor = 4000 | OK |
| Continua digitando "0" | "4k0" vira "40" | Deveria virar 40000 |
| Tenta digitar "400000" | Impossível | Deveria funcionar |

---

### Solução

Separar o **valor de edição** do **valor formatado**:
- Durante edição (foco): mostrar valor numérico bruto
- Fora de edição (blur): mostrar valor formatado

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/MonetaryMetasTab.tsx` | Refatorar lógica do Input para usar estado de edição separado |

---

### Seção Técnica

**1. Adicionar estado para controlar qual célula está em edição:**
```typescript
const [editingCell, setEditingCell] = useState<string | null>(null);
const [editingValue, setEditingValue] = useState<string>('');
```

**2. Modificar o Input na tabela:**
```typescript
<Input
  type="text"
  value={
    editingCell === `${metric}-${month}` 
      ? editingValue 
      : formatCurrency(getLocalValue(selectedBu, month, metric))
  }
  onChange={(e) => {
    // Durante edição, apenas armazena o texto bruto
    setEditingValue(e.target.value);
  }}
  onFocus={(e) => {
    // Ao focar, mostra valor bruto e marca como editando
    const rawValue = getLocalValue(selectedBu, month, metric);
    setEditingCell(`${metric}-${month}`);
    setEditingValue(rawValue > 0 ? rawValue.toString() : '');
  }}
  onBlur={(e) => {
    // Ao sair, faz o parse e atualiza o estado
    const value = parseCurrencyInput(editingValue);
    updateLocalValue(selectedBu, month, metric, value);
    setEditingCell(null);
    setEditingValue('');
  }}
  className="w-20 h-8 text-center text-sm"
/>
```

**3. Melhorar o parseCurrencyInput para aceitar "k" e "M":**
```typescript
const parseCurrencyInput = (input: string): number => {
  const cleaned = input.trim().toLowerCase();
  
  // Suporta sufixos k (mil) e m (milhão)
  if (cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1).replace(',', '.')) || 0;
    return Math.round(num * 1000);
  }
  if (cleaned.endsWith('m')) {
    const num = parseFloat(cleaned.slice(0, -1).replace(',', '.')) || 0;
    return Math.round(num * 1000000);
  }
  
  // Remove caracteres não numéricos exceto ponto e vírgula
  const numericStr = cleaned.replace(/[^\d.,]/g, '').replace(',', '.');
  return Math.round(parseFloat(numericStr) || 0);
};
```

---

### Comportamento Final

1. Usuário clica no campo → vê o valor numérico bruto (ex: "4000")
2. Usuário digita livremente → campo aceita qualquer texto
3. Usuário sai do campo → valor é parseado e formatado
4. Suporte a atalhos: "400k" = 400.000, "1.5m" = 1.500.000

---

### Exemplos de Entrada

| Digitado | Resultado |
|----------|-----------|
| 400000 | 400.000 (exibe "400k") |
| 400k | 400.000 (exibe "400k") |
| 1.5m | 1.500.000 (exibe "1.50M") |
| 100 | 100 (exibe "100") |

