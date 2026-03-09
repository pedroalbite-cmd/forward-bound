

## Desbloquear Fevereiro e Adicionar Distribuicao de Diferenca nas Metas Monetarias

### Objetivo
Permitir editar meses anteriormente bloqueados (como Fevereiro) e, ao alterar uma meta, mostrar a diferenca em relacao ao total anterior da BU com opcoes inteligentes de redistribuicao.

### Alteracoes

#### 1. Remover trava de meses (`MonetaryMetasTab.tsx`)
- Remover a funcao `isMonthLocked` e a logica de `disabled` nos inputs. Todos os meses passam a ser editaveis.
- Remover os indicadores visuais de cadeado.

#### 2. Barra de diferenca com opcoes de distribuicao
Quando o usuario altera o faturamento de um mes, o sistema calcula a diferenca entre o total antigo e o novo da BU selecionada. Se houver diferenca, exibe uma barra flutuante (similar a da imagem do Plan Growth) com:

- **Informacao**: "Diferenca: +R$ 55.960 no O2 TAX" (ou valor negativo)
- **Botao 1 - "Distribuir nos meses restantes"**: Divide a diferenca (com sinal invertido) igualmente entre todos os meses que NAO foram editados nesta sessao.
- **Botao 2 - "Distribuir em periodo"**: Abre um popover/dropdown onde o usuario seleciona:
  - Um quarter (Q1, Q2, Q3, Q4)
  - Ou um range customizado (mes inicio -> mes fim)
  - Ao confirmar, distribui a diferenca igualmente entre os meses do periodo selecionado (excluindo o mes que foi editado).
- **Botao "Descartar"**: Reverte todas as alteracoes locais ao estado do banco.

#### 3. Logica de distribuicao
- A diferenca eh calculada como: `totalAnterior - totalAtual` da BU (antes vs depois da edicao).
- Se a diferenca for positiva (usuario reduziu um mes), ela eh somada aos meses alvo.
- Se for negativa (usuario aumentou um mes), ela eh subtraida dos meses alvo.
- A distribuicao eh feita igualmente (diferenca / qtd meses alvo), com arredondamento e ajuste do residuo no ultimo mes.
- O total da BU se mantem constante apos redistribuicao.

#### 4. Rastreamento de edicoes manuais
- Manter um `Set<string>` de meses editados manualmente na sessao atual.
- "Meses restantes" = meses que NAO estao nesse set.
- Apos distribuir, os meses que receberam ajuste NAO sao marcados como editados (permitindo redistribuicoes subsequentes).

### Detalhes tecnicos

**Arquivo**: `src/components/planning/MonetaryMetasTab.tsx`

**Estado adicional**:
```text
editedMonths: Set<string>     -- meses tocados pelo usuario
previousBuTotal: number       -- total da BU antes das edicoes
showDistribution: boolean     -- controla visibilidade da barra
distributionPeriod: 'remaining' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'custom'
customRange: [MonthType, MonthType]
```

**Barra de distribuicao**: Renderizada como um `div` fixo no bottom (estilo identico ao floating bar do Plan Growth), contendo:
- Badge com a diferenca formatada
- Botoes de acao
- Popover para selecao de periodo (usando Select ou RadioGroup)

**Fluxo**:
1. Usuario edita faturamento de Fev de R$ 135.960 para R$ 80.000
2. Diferenca: R$ 55.960 (sobra para distribuir)
3. Barra aparece: "1 alteracao | O2 TAX: +R$ 55.960"
4. Usuario clica "Distribuir nos restantes" -> R$ 55.960 / 10 meses = R$ 5.596 adicionado a cada mes de Mar-Dez
5. Ou clica "Distribuir em periodo" -> seleciona Q3 -> R$ 55.960 / 3 = R$ 18.653 em Jul, Ago, Set
6. Total da BU permanece o mesmo de antes da edicao

