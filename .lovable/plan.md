
# Remover valor mockup da Franquia - usar Taxa de franquia real

## Problema
Quando um card de Franquia nao tem o campo "Taxa de franquia" preenchido, o sistema usa um valor padrao ficticio de R$ 140.000. O correto eh usar zero quando o campo nao estiver preenchido.

## Mudancas

### Arquivo 1: `src/hooks/useExpansaoMetas.ts`

Na funcao `getValueForPeriod` (linha ~179-191), remover o fallback para `defaultTicket`:

```
// Antes (linhas 179-191):
const taxaFranquia = movement.taxaFranquia || 0;
const defaultTicket = 140000;
if (taxaFranquia > 0) {
  cardValues.set(movement.id, taxaFranquia);
} else {
  const sumValues = pontual + setup + mrr;
  cardValues.set(movement.id, sumValues > 0 ? sumValues : defaultTicket);
}

// Depois:
const taxaFranquia = movement.taxaFranquia || 0;
if (taxaFranquia > 0) {
  cardValues.set(movement.id, taxaFranquia);
} else {
  const sumValues = pontual + setup + mrr;
  cardValues.set(movement.id, sumValues); // zero se nao tiver valores
}
```

### Arquivo 2: `src/hooks/useExpansaoAnalytics.ts`

Na funcao `parseRawCard` (linhas 110-115), remover o fallback para `defaultTicket`:

```
// Antes:
let valor = taxaFranquia;
if (valor <= 0) {
  const sumValues = valorPontual + valorSetup + valorMRR;
  valor = sumValues > 0 ? sumValues : defaultTicket;
}

// Depois:
let valor = taxaFranquia;
if (valor <= 0) {
  valor = valorPontual + valorSetup + valorMRR; // zero se nao tiver valores
}
```

Tambem remover a variavel `defaultTicket` da linha 160 (nao sera mais usada para Franquia). Nota: Oxy Hacker mantem o ticket padrao de R$ 54k? Ou tambem deve zerar? O plano assume que a mudanca se aplica apenas a Franquia, mantendo Oxy Hacker com seu ticket padrao. Se quiser zerar Oxy Hacker tambem, a mesma logica se aplica.

**Atencao**: Como o `parseRawCard` eh compartilhado entre Franquia e Oxy Hacker (via parametro `produto`), a mudanca pode ser condicional ao produto, ou aplicada igualmente para ambos.

## Resultado esperado
- Cards de Franquia sem "Taxa de franquia" preenchida mostrarao valor R$ 0
- Cards com "Taxa de franquia" preenchida continuarao mostrando o valor real
- Os totais monetarios refletirao apenas valores reais do Pipefy
