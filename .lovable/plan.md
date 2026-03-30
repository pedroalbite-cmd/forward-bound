

## Diagnóstico: 315 MQLs no sistema vs 307 no Pipefy

### Análise do arquivo enviado
O arquivo contém **307 cards** (todos com faturamento ≥ R$200k, criados em março/2026). O sistema mostra **315** — diferença de **8 cards a mais** no sistema.

### Observações no arquivo

**Cards de teste presentes no arquivo (devem ser excluídos pelo sistema):**
- "Empresa Teste" (linha 106)
- "TESTE" (linha 280, 282)
- "teste" (linha 281)

Se o sistema está excluindo estes 3-4 cards de teste, mas mostra 315, então o total bruto no sistema seria ~318-319, o que implica **11-12 cards a mais** no banco vs arquivo.

**Cards duplicados no arquivo (mesmo título, datas diferentes):**
- "Mais" aparece 2x (linhas 183-184, criados com 3 min de diferença)
- "Green packing" 2x (linhas 139-140)
- "Reboques e carretas bedeu Ltda" 2x (linhas 251-252)
- "real papelaria" 2x (linhas 248-249)

### Causa provável
A query `query_period_by_creation` retorna TODAS as linhas da tabela `pipefy_moviment_cfos` onde `"Data Criação"` está no período. Um card com múltiplas movimentações tem múltiplas linhas — cada uma com um `"Faixa de faturamento mensal"` potencialmente diferente. Se o faturamento de um card foi alterado (ex: de "Até R$ 200 mil" para "Entre R$ 200 mil e R$ 350 mil"), pode haver linhas antigas com o valor antigo e linhas novas com o valor atualizado. O sistema conta se QUALQUER linha tem faturamento qualificado.

### Plano de ação
Executar uma query diagnóstica no banco externo para listar os IDs dos MQLs que o sistema conta, comparar com os títulos do arquivo, e identificar exatamente os 8 cards excedentes.

**Passo 1:** Chamar a edge function `query-external-db` com `action: query_period_by_creation` para março/2026 e processar localmente para gerar a lista de card IDs únicos com faturamento ≥ R$200k.

**Passo 2:** Comparar os títulos da lista do sistema com os 307 títulos do arquivo Excel.

**Passo 3:** Gerar relatório com os cards que estão no sistema mas não no arquivo (e vice-versa).

Isso requer execução de scripts para fazer a comparação — preciso sair do modo read-only para executar.

