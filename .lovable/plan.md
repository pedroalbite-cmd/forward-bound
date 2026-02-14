
# Correcao: Valor revertendo + Botao Salvar flutuante

## Problema 1: Valor editado reverte imediatamente

Quando o usuario edita o "A Vender" de 400k para 350k, o valor e gravado no estado local (`pendingChanges`), porem a tabela exibe os dados do `funnelData` que e recalculado a partir dos valores do banco de dados (nao dos pendentes). Resultado: o valor volta para 400k na tela.

### Solucao

Criar versoes "efetivas" dos dados de funnel que mesclam os valores pendentes com os dados do banco. Para cada BU:

1. Antes de passar o `funnelData` para `BUInvestmentTable`, aplicar um merge:
   - Se existe `pendingChanges[bu][month]`, substituir o `faturamentoVender` daquele mes pelo valor pendente
   - Recalcular o funil reverso (vendas, propostas, leads, investimento) com o novo valor
2. Os dados originais do banco continuam intactos para comparacao no banner de validacao
3. A tabela mostra os valores editados em tempo real

Tecnicamente, criar um `useMemo` para cada BU que:
- Pega o funnel original (ex: `modeloAtualFunnel`)
- Verifica se ha `pendingChanges['modelo_atual']`
- Se sim, faz `.map()` nos dados substituindo `faturamentoVender` nos meses alterados e recalculando as metricas derivadas (vendas, leads, investimento)
- Passa esse funnel "efetivo" para o `BUInvestmentTable`

## Problema 2: Botao Salvar longe do usuario

O banner com "Salvar Todas" fica no topo da pagina (sticky top-0), mas o usuario esta editando tabelas la embaixo. Precisa rolar toda a tela para salvar.

### Solucao

Mover o banner de validacao para um **footer flutuante fixo na parte inferior da tela** (`fixed bottom-0`), estilo barra de acoes. Assim:

- O banner aparece fixo na parte de baixo da viewport quando ha alteracoes pendentes
- O usuario ve os badges de saldo e os botoes "Descartar" e "Salvar Todas" sem precisar rolar
- O banner fica visivel independente de onde o usuario esteja na pagina
- Padding inferior no conteudo para que o banner nao sobreponha a ultima tabela

## Detalhes tecnicos

### Arquivo: `src/components/planning/MediaInvestmentTab.tsx`

**1. Funnel data com merge de pendentes (4 useMemos novos)**:
```
const effectiveModeloAtualFunnel = useMemo(() => {
  if (!pendingChanges['modelo_atual']) return modeloAtualFunnel;
  return modeloAtualFunnel.map(d => {
    const pending = pendingChanges['modelo_atual'][d.month];
    if (pending === undefined) return d;
    // Substituir faturamentoVender e recalcular metricas derivadas
    const newVender = pending;
    const vendas = newVender / metrics.ticketMedio;
    const propostas = vendas / metrics.propToVenda;
    // ... etc
    return { ...d, faturamentoVender: newVender, vendas, propostas, ... };
  });
}, [modeloAtualFunnel, pendingChanges]);
```

Repetir para `o2Tax`, `oxyHacker`, `franquia`.

Passar os `effective*Funnel` para os `BUInvestmentTable` em vez dos originais.

**2. Banner reposicionado para bottom fixo**:
- Trocar `sticky top-0` por `fixed bottom-4 left-1/2 -translate-x-1/2 max-w-4xl w-full`
- Adicionar `z-50` e sombra forte para destacar
- Adicionar padding-bottom no container principal quando ha pendencias para evitar sobreposicao
- Layout compacto em uma linha: badges + botoes lado a lado

**3. Garantir que `originalValuesRef` capture o valor correto**:
- Verificar que na primeira edicao de um mes, o `originalValuesRef` capture o `faturamentoVender` do funnel original (nao do efetivo), para que a validacao compare corretamente

## Resultado esperado

1. Usuario edita "A Vender" de Fev de 400k para 350k
2. A celula mostra 350k imediatamente (nao reverte)
3. O funil recalcula localmente (vendas, leads, investimento mudam)
4. Na parte de baixo da tela, barra flutuante mostra: "Modelo Atual: -R$ 50.000 no A Vender | [Descartar] [Salvar Todas]"
5. Usuario edita Mar adicionando 50k
6. Barra atualiza: "Modelo Atual: A Vender balanceado | [Descartar] [Salvar Todas (verde)]"
7. Clica em Salvar - tudo salva no banco com logs
