

# Fix: Fallback de valor pontual para Franquia e Oxy Hacker

## Problema

Mesmo com a logica `card.taxaFranquia > 0 ? card.taxaFranquia : card.valorPontual`, quando ambos os campos vem zerados do banco de dados, o valor pontual fica R$ 0.

## Solucao

### Arquivo: `src/hooks/useExpansaoAnalytics.ts`

Na funcao `toDetailItem` (linha 322), adicionar fallback por produto quando `taxaFranquia` e `valorPontual` estiverem zerados:

```typescript
pontual: card.taxaFranquia > 0 
  ? card.taxaFranquia 
  : card.valorPontual > 0 
    ? card.valorPontual 
    : (card.produto === 'Franquia' ? 140000 : 54000),
```

Isso garante:
- Se `taxaFranquia` > 0: usa esse valor (caso ideal)
- Se `valorPontual` > 0: usa como segundo fallback
- Se ambos zerados: Franquia = R$ 140.000, Oxy Hacker = R$ 54.000 (tickets padrao)

Nenhum outro arquivo precisa ser alterado.

