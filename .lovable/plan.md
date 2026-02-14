

# Correcao da Validacao: A Vender (nao vendas) + UX de edicao livre

## Problemas atuais

1. **Mensagens falam em "vendas" mas deveria ser "A Vender" (valor financeiro)**: O banner mostra "+3 vendas" quando deveria mostrar "+R$ 50k no A Vender". A validacao ja calcula o diff em R$, mas o display traduz para "vendas" o que confunde.

2. **Sensacao de bloqueio**: Embora a edicao de celulas individuais funcione, o banner vermelho com "Distribua as vendas" e botao desabilitado da a impressao de que algo esta bloqueado. O usuario quer editar livremente, ver um contador de saldo, e so no final salvar.

3. **Banner precisa acompanhar a tela**: O banner ja eh `sticky top-0`, mas pode melhorar a visibilidade.

## Mudancas

### 1. Banner de validacao - Reformular mensagens

**De:**
- "+3 vendas (R$ 50k)" / "Distribua as vendas restantes"
- Badge "Balanceado" / Badge destructive com contagem de vendas

**Para:**
- "Modelo Atual: +R$ 50k no A Vender" ou "Modelo Atual: -R$ 50k no A Vender"
- Quando balanceado: "Modelo Atual: A Vender balanceado"
- Mensagem inferior: "O total de A Vender por BU deve permanecer igual ao original. Redistribua o valor entre os meses."
- Remover toda referencia a "vendas" do banner

### 2. Validacao baseada no total de A Vender

- A validacao `isAllBalanced` ja usa `Math.abs(val.diff) < 100` em R$ - isso esta correto
- Remover o calculo de `diffVendas` do `pendingValidation` pois nao sera mais usado
- Manter a tolerancia de R$ 100

### 3. Botao Salvar - comportamento

- Manter o botao desabilitado quando nao balanceado (usuario confirmou "nao deve ser possivel salvar")
- Melhorar o tooltip: "O total de A Vender deve ser igual ao original para salvar"
- Quando balanceado, botao fica verde/habilitado

### 4. Indicador visual nas celulas editadas

- Manter o fundo amarelo nas linhas pendentes (ja existe via `pendingMonths`)
- Sem bloqueio ao editar - o usuario pode mudar qualquer mes editavel livremente

## Arquivo editado

- `src/components/planning/MediaInvestmentTab.tsx`:
  - `pendingValidation`: remover `diffVendas`, manter apenas `diff` em R$
  - Banner: trocar todas as mensagens de "vendas" para "A Vender" com valores em R$
  - Mensagem de erro: "Redistribua o A Vender entre os meses" em vez de "Distribua as vendas"
  - Toast de erro no `handleSaveAll`: "O A Vender nao esta balanceado" em vez de "Distribua as vendas"

