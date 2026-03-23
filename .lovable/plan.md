

## Corrigir "Data de assinatura" e garantir todas as colunas preenchidas

### Diagnóstico
Investiguei os dados reais de cada tabela:

| Coluna | Status atual | Fonte correta |
|--------|-------------|---------------|
| Mês do Churn | OK — vem da tratativa `Entrada` | `pipefy_moviment_tratativas` |
| Motivo Principal | OK — vem da tratativa `Motivo` | `pipefy_moviment_tratativas` |
| Motivos cancelamento | OK — vem da tratativa `Motivo Churn` | `pipefy_moviment_tratativas` |
| Data encerramento | OK — vem da tratativa `Saída` | `pipefy_moviment_tratativas` |
| **Data de assinatura** | **VAZIO** — o código tenta ler de `pipefy_central_projetos` onde o campo não existe | **`pipefy_db_clientes`** (campo `Data de assinatura do contrato`) |
| LT (meses) | VAZIO (depende da data de assinatura) | Calculado |
| Problemas com a Oxy | OK — vem do NPS | `pipefy_moviment_nps` |

**Cadeia de cruzamento para Data de assinatura:**
```text
pipefy_central_projetos (card_id)
  → pipefy_card_connections (card_id → connected_card_id WHERE connected_pipe_name='Clientes')
    → pipefy_db_clientes (ID = connected_card_id → "Data de assinatura do contrato")
```

### Alterações em `src/hooks/useOperationsData.ts`

1. **Adicionar 2 fetches ao `Promise.all`**: `pipefy_db_clientes` e `pipefy_card_connections` (com limit 5000)
2. **Construir mapa de data de assinatura**:
   - De `pipefy_card_connections`: filtrar por `connected_pipe_name === 'Clientes'` → mapear `card_id → connected_card_id`
   - De `pipefy_db_clientes`: mapear `ID → Data de assinatura do contrato`
   - Resultado: `projetoCardId → dataAssinatura`
3. **Passar esse mapa para `processProjects`** e usá-lo na construção do `churnDossier`
4. **Corrigir linha 289**: em vez de `card['Data de assinatura do contrato']`, usar o mapa `assinaturaMap.get(card.ID)`

### Resultado esperado
- "Data de assinatura" preenchida para todos os clientes que têm registro em `pipefy_db_clientes`
- "LT (meses)" calculado automaticamente a partir da diferença entre assinatura e encerramento
- Demais colunas continuam funcionando como já estão

### Arquivo modificado
- `src/hooks/useOperationsData.ts`

