

# UX de Edicao Livre: Botao Salvar sempre clicavel

## Problema

Quando o usuario diminui o A Vender de um mes, o banner vermelho aparece imediatamente com "Redistribua o valor" e o botao "Salvar Todas" fica desabilitado (`disabled`). Isso da a sensacao de bloqueio — o usuario nao consegue nem clicar no botao para entender o que falta. Ele quer editar livremente e so receber o aviso quando tentar salvar.

## Solucao

Trocar o comportamento do botao de `disabled` para **sempre habilitado**, mas ao clicar quando nao esta balanceado, exibir um toast explicativo em vez de salvar.

## Mudancas no arquivo `MediaInvestmentTab.tsx`

### 1. Botao "Salvar Todas" - remover `disabled`

- Remover `disabled={!isAllBalanced}` do botao
- O botao fica sempre clicavel
- Quando balanceado: fundo verde (emerald) como esta hoje
- Quando nao balanceado: fundo normal (sem verde), mas clicavel

### 2. `handleSaveAll` - ja tem o toast de erro

A funcao `handleSaveAll` ja tem a verificacao:
```
if (!isAllBalanced) {
  toast.error('O total de A Vender nao esta balanceado...');
  return;
}
```
Isso ja funciona — ao clicar com saldo pendente, o toast aparece e nada eh salvo.

### 3. Banner - tom informativo em vez de alarmista

- Trocar o icone `AlertCircle` (amarelo/vermelho) por `Info` quando nao balanceado
- Manter o texto informativo mas sem o tom de "voce esta bloqueado"
- Remover a mensagem vermelha de rodape `⚠ O total de A Vender por BU deve permanecer igual ao original...`
- O badge destructive continua mostrando o saldo pendente (ex: "+R$ 50k no A Vender") para o usuario acompanhar
- Adicionar uma linha sutil: "Equilibre o A Vender para poder salvar" — tom de orientacao, nao de erro

### 4. Estilo do botao conforme estado

- Balanceado: `bg-emerald-600` (verde) — sinal claro de "pode salvar"
- Nao balanceado: estilo default — sem verde, mas clicavel. Ao clicar, toast explica o que falta

## Resumo visual

```text
Antes:
[Banner vermelho] [Botao DESABILITADO cinza]
⚠ Redistribua o valor...

Depois:
[Banner informativo] [Botao CLICAVEL normal]
Equilibre o A Vender para salvar
(ao clicar sem equilibrar -> toast de aviso)
(ao equilibrar -> botao fica verde -> salva)
```

## Arquivo editado

- `src/components/planning/MediaInvestmentTab.tsx`: remover `disabled`, ajustar banner e estilos
