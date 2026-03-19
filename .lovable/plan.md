

## Problema: filtro por título está removendo cards reais

O filtro `isTestCard` usa títulos normalizados (`'teste'`, `'123'`, `'empresa teste'`, `'teste duda'`, `'joao'`), mas isso pode pegar cards reais que têm esses nomes. O resultado: removeu 6 cards em vez de 4, mostrando 263 em vez de 265.

Por exemplo:
- `'joao'` pode coincidir com um lead real chamado "João"
- `'123'` pode coincidir com outro card real

## Solução: filtrar por IDs específicos ao invés de títulos

Trocar a lógica para usar os **IDs exatos** dos 4 cards de teste identificados, que são seguros e não mudam:

| ID | Título |
|---|---|
| `1320546949` | TESTE |
| `1320177174` | 123 |
| `1308003007` | Empresa Teste |
| `1320175421` | teste duda |

### Arquivos alterados

**1. `src/hooks/useModeloAtualMetas.ts`**
- Substituir `TEST_CARD_TITLES` e `isTestCard(titulo)` por um `Set` de IDs: `TEST_CARD_IDS`
- Exportar nova função `isTestCard(id: string): boolean` que verifica pelo ID
- Atualizar filtro em `getQtyForPeriod` para usar `!isTestCard(movement.id)`

**2. `src/hooks/useModeloAtualAnalytics.ts`**
- Atualizar todas as chamadas de `isTestCard(card.titulo)` para `isTestCard(card.id)`

### Código

```typescript
const TEST_CARD_IDS = new Set([
  '1320546949', // TESTE
  '1320177174', // 123
  '1308003007', // Empresa Teste
  '1320175421', // teste duda
]);

export function isTestCard(id?: string): boolean {
  if (!id) return false;
  return TEST_CARD_IDS.has(id);
}
```

Resultado esperado: MQL março volta a 265, sem risco de filtrar cards reais.

