

## Diagnóstico: Replicar filtro exato do acelerômetro no banco

### Problema
O sistema mostra 315 MQLs, o Pipefy exporta 307. Preciso executar no banco externo a **mesma lógica** do `useModeloAtualAnalytics.ts` para identificar exatamente quais cards compõem os 315.

### Lógica do sistema (código atual)
1. **Fonte**: `pipefy_moviment_cfos` com `"Data Criação"` entre 2026-03-01 e 2026-03-31
2. **Filtro faturamento**: `"Faixa de faturamento mensal"` IN ('Entre R$ 200 mil e R$ 350 mil', 'Entre R$ 350 mil e R$ 500 mil', 'Entre R$ 500 mil e R$ 1 milhão', 'Entre R$ 1 milhão e R$ 5 milhões', 'Acima de R$ 5 milhões')
3. **Exclusão teste**: IDs NOT IN ('1320546949', '1320177174', '1308003007', '1320175421')
4. **Exclusão motivo perda**: Qualquer row do card com motivo IN ('Duplicado', 'Pessoa física, fora do ICP', 'Não é uma demanda real', 'Buscando parceria', 'Quer soluções para cliente', 'Não é MQL, mas entrou como MQL', 'Email/Telefone Inválido') exclui o card inteiro
5. **Dedup**: Por ID do card (unique cards)

### Plano de ação
Usar a action `mql_diagnosis` já existente na edge function `query-external-db` (criada na mensagem anterior) para executar exatamente essa lógica no banco e obter a lista de cards. Depois comparar com os 307 títulos do Excel para identificar:
- Cards no sistema mas **não** no Pipefy (os 8+ extras)
- Cards no Pipefy mas **não** no sistema (se houver)

### Execução
1. Chamar `query-external-db` com `action: mql_diagnosis`, passando os títulos do Excel para comparação server-side
2. Gerar relatório com a diferença exata

Sem alteração de código — apenas execução de query diagnóstica e processamento do Excel.

