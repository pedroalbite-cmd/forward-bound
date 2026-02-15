
# Correcao: Barra flutuante nao fica fixa na tela

## Problema

A barra flutuante com "Salvar Todas" tem `fixed bottom-4` no CSS, mas nao funciona como fixa. Ela fica posicionada no final do conteudo, nao acompanha o scroll.

### Causa raiz

O container pai tem a classe `animate-fade-in`, que aplica `transform: translateY(10px)` durante a animacao. Em CSS, qualquer elemento pai com `transform` cria um novo "containing block", o que faz `position: fixed` se comportar como `position: absolute` — relativo ao pai, nao a viewport.

## Solucao

Mover a barra flutuante para **fora** do `div` com `animate-fade-in`, usando um React Fragment para retornar ambos os elementos no mesmo nivel.

### Arquivo: `src/components/planning/MediaInvestmentTab.tsx`

Estrutura atual:
```text
return (
  <div class="animate-fade-in ...">       <-- tem transform, quebra fixed
    {hasPendingChanges && (
      <div class="fixed bottom-4 ...">     <-- fixed nao funciona aqui dentro
        ...barra...
      </div>
    )}
    ...conteudo das tabelas...
  </div>
)
```

Estrutura corrigida:
```text
return (
  <>
    <div class="animate-fade-in ...">
      ...conteudo das tabelas...
    </div>
    {hasPendingChanges && (
      <div class="fixed bottom-4 ...">     <-- agora fora do transform, fixed funciona
        ...barra...
      </div>
    )}
  </>
)
```

Mudancas especificas:
1. Envolver o return em um Fragment (`<>...</>`)
2. Mover o bloco `{hasPendingChanges && (...)}` para depois do `</div>` principal, fora do container animado
3. Nenhuma outra mudanca necessaria — o CSS da barra ja esta correto (`fixed bottom-4 left-1/2 -translate-x-1/2 z-50`)

## Resultado esperado

1. Usuario edita um valor de "A Vender"
2. A barra flutuante aparece fixada na parte inferior da tela
3. Ao rolar para cima ou para baixo, a barra acompanha e permanece visivel
4. Botoes "Descartar" e "Salvar Todas" acessiveis a qualquer momento
