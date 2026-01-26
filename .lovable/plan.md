
## Plano: Ajustar Filtro de CFOs para Modelo Atual

### Problema Identificado

O filtro de closers não está funcionando corretamente porque os valores configurados ("Pedro" e "Daniel") não correspondem aos dados do banco de dados externo `pipefy_moviment_cfos`:

| Valor no Filtro | Valor no Banco |
|-----------------|----------------|
| `Pedro` | `Pedro Albite` |
| `Daniel` | `Daniel Trindade` |

A função `matchesCloserFilter` faz comparação exata (`includes`), então "Pedro" ≠ "Pedro Albite".

---

### Solução

Atualizar os valores do filtro para usar os nomes completos exatamente como aparecem na coluna `"Closer responsável"` do banco de dados.

---

### Arquivo a Modificar

| Arquivo | Linha(s) | Mudança |
|---------|----------|---------|
| `src/components/planning/IndicatorsTab.tsx` | 191-195 | Substituir valores do filtro |

---

### Mudança Técnica

**Antes (linha 191-195):**
```typescript
const availableClosers: MultiSelectOption[] = [
  { value: 'Pedro', label: 'Pedro' },
  { value: 'Daniel', label: 'Daniel' },
];
```

**Depois:**
```typescript
const availableClosers: MultiSelectOption[] = [
  { value: 'Pedro Albite', label: 'Pedro' },
  { value: 'Daniel Trindade', label: 'Daniel' },
];
```

---

### Resultado

- O dropdown continua exibindo apenas "Pedro" e "Daniel" (labels amigáveis)
- O filtro agora usa os valores corretos que correspondem exatamente aos dados do banco
- Cards com `"Closer responsável": "Pedro Albite"` serão filtrados corretamente ao selecionar "Pedro"
- Cards com `"Closer responsável": "Daniel Trindade"` serão filtrados corretamente ao selecionar "Daniel"

---

### Observação sobre Escopo

O filtro está configurado para funcionar apenas com dados do **Modelo Atual**, que usa a tabela `pipefy_moviment_cfos`. As outras BUs (O2 TAX, Franquia, Oxy Hacker) podem ter estruturas de responsáveis diferentes, mas como o pedido é focar nos CFOs, essa configuração atende ao requisito.
