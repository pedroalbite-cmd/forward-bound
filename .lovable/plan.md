
Objetivo aprovado: corrigir o MQL da tela **Indicadores (cards)** no filtro **Ano 2026** com BU **Todas (consolidado)**.

Diagnóstico já confirmado com consulta edge:
- O filtro por motivo está funcionando por linha, mas a contagem de MQL é por card.
- Exemplo real (ID `1317098866`):  
  - linha de `Start form` e `MQLs` com `Motivo da perda = null`  
  - linha posterior `Perdido` com `Motivo da perda = "Email/Telefone Inválido"`  
- Hoje o card entra na contagem quando encontra uma linha “válida” (motivo null), mesmo tendo motivo de exclusão em outra linha do mesmo card.

Plano de implementação
1) Ajustar contagem MQL para lógica por **card** (não por linha) em `src/hooks/useModeloAtualAnalytics.ts`
- No bloco `getCardsForIndicator('mql')`, agrupar `mqlByCreation` por `id`.
- Para cada card:
  - `qualified = existe alguma linha com faixa qualificável`
  - `excluded = existe alguma linha com motivo em MQL_EXCLUDED_LOSS_REASONS`
- Incluir no resultado apenas cards com `qualified && !excluded`.
- Escolher um item representativo estável por card (ex.: linha mais recente por `dataEntrada`) para o detail sheet.

2) Aplicar a mesma regra por card nos outros pontos para manter consistência
- `src/hooks/useModeloAtualMetas.ts` (`getQtyForPeriod` e `countForWindow` de `mql`)
- `src/hooks/useIndicatorsRealized.ts` (`countIndicator('mql')`)
Assim evitamos divergência entre cards, gráficos e agregados mensais.

3) Hardening de comparação de motivo
- Em `isMqlExcludedByLoss`, manter `trim + lower` e adicionar normalização de acento/espaço (para variações como “fisica/física”, espaços duplos etc.).

Validação após implementação
- Reexecutar edge queries de histórico para IDs de controle (ex.: `1317098866`, `1320376959`) e confirmar que ficam marcados como excluídos no nível do card.
- No app: **Indicadores → BU Todas → Ano 2026**, abrir detalhe de MQL e validar que cards com motivo:
  - “Não é MQL, mas entrou como MQL”
  - “Email/Telefone Inválido”
  - “Pessoa física, fora do ICP”
  não aparecem mais.
- Confirmar redução do total de MQL no card consolidado e sincronia com drill-down.
