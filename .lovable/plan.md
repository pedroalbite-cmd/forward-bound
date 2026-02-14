
# Correcoes no Plan Growth: Logs, Validacao de Vendas e Salvar em Lote

## Problemas identificados

1. **Logs nao aparecem ao editar no Plan Growth**: O `handleAVenderChange` no `MediaInvestmentTab.tsx` salva diretamente no banco sem chamar `logAction()`. Os logs so foram integrados no `MonetaryMetasTab` (aba Admin), nao no Plan Growth.

2. **Vendas precisam bater o total**: Se o admin tira 2 vendas de um mes, precisa distribuir essas 2 em outros meses antes de poder salvar. O total de vendas anual (ou por BU) deve permanecer constante.

3. **Salvar individualmente vs em lote**: Atualmente cada edicao de "A Vender" salva imediatamente no banco. O admin quer editar varios meses, ver o saldo, e so salvar quando tudo estiver correto.

## Solucao

### 1. Mudar de "salvar imediato" para "salvar em lote"

Hoje: editar um mes -> salva no banco imediatamente (`handleAVenderChange` chama `bulkUpdateMetas.mutateAsync`)

Novo fluxo:
- Editar um mes -> salva apenas no **estado local** (pendingChanges)
- Um banner fixo aparece mostrando: "X alteracoes pendentes | Total vendas: Y (meta: Z) | Diferenca: +/-N"
- Se a diferenca for 0 (vendas batem), o botao "Salvar Todas" fica habilitado
- Se a diferenca for diferente de 0, o botao fica desabilitado com aviso: "Distribua as N vendas restantes antes de salvar"
- Ao clicar "Salvar Todas", salva tudo de uma vez no banco e registra os logs

### 2. Integrar audit logs no Plan Growth

Ao salvar em lote, para cada BU/mes alterado:
- Registrar log: "Plan Growth - Modelo Atual Fev: A Vender de R$ 400k para R$ 450k"
- Metadata inclui: bu, month, old_value, new_value, source: 'plan_growth'

### 3. Validacao de vendas por BU

Para cada BU, calcular o total de vendas original (antes das edicoes) e o total apos as edicoes. So permitir salvar quando forem iguais.

## Mudancas tecnicas

### `MediaInvestmentTab.tsx`

1. **Estado local para alteracoes pendentes**:
   - `pendingAVenderChanges: Record<string, Record<string, number>>` (bu -> month -> newAVender)
   - `handleAVenderChange` deixa de salvar no banco e apenas atualiza o estado local
   - Os dados de funnel sao recalculados usando os valores pendentes (merge com DB)

2. **Banner de validacao**:
   - Componente fixo no topo da area de BU tables
   - Mostra por BU: total vendas original vs total vendas com alteracoes
   - Badge verde se bate, vermelho se nao bate
   - Botao "Salvar Todas as Alteracoes" (desabilitado se nao bater)
   - Botao "Descartar Alteracoes"

3. **Funcao `handleSaveAll`**:
   - Valida que vendas batem para todas as BUs alteradas
   - Salva todas as alteracoes de uma vez via `bulkUpdateMetas.mutateAsync`
   - Registra audit logs para cada alteracao
   - Limpa `pendingAVenderChanges`

4. **Recalculo local dos funnels**:
   - Quando ha alteracoes pendentes, os `metasMensais` sao recalculados com os valores pendentes
   - A tabela mostra os valores "pendentes" com indicacao visual (ex: fundo amarelo)

### `BUInvestmentTable` (dentro do mesmo arquivo)

- Meses com alteracoes pendentes mostram um indicador visual (dot amarelo ou borda)
- O valor editado mostra o novo valor, nao o do banco

### `useAuditLogs.ts`

- Adicionar `action_type: 'plan_growth_meta'` como novo tipo (ou reutilizar 'monetary_meta' com metadata.source = 'plan_growth')

### `AdminLogsTab.tsx`

- Nenhuma alteracao necessaria - os novos logs aparecerao automaticamente

## Fluxo do usuario

1. Admin abre Plan Growth
2. Edita "A Vender" de Fev de R$ 400k para R$ 350k (tira R$ 50k / ~3 vendas)
3. Banner aparece: "Modelo Atual: 3 vendas a distribuir | Salvar desabilitado"
4. Admin edita Mar de R$ 500k para R$ 550k (adiciona R$ 50k / ~3 vendas)
5. Banner atualiza: "Modelo Atual: vendas balanceadas | Salvar habilitado"
6. Admin clica "Salvar Todas"
7. Sistema salva ambas alteracoes, registra 2 logs no audit
8. Toast de sucesso: "2 metas atualizadas com sucesso"
