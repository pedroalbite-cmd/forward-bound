

# Reformular Metas Monetarias no Admin: Edicao por Vendas

## Contexto
A meta total consolidada (todas as BUs) e R$ 33.306.500. Hoje o admin edita valores monetarios diretamente (faturamento, MRR, etc). A mudanca e: o admin edita apenas **quantidade de vendas** e **ticket medio** por BU, e o sistema calcula tudo automaticamente. Meses passados ficam bloqueados (antes do mes atual).

## Regra de Negocio
- **Faturamento** = Vendas x Ticket Medio
- **Modelo Atual / O2 TAX**: MRR = 25%, Setup = 60%, Pontual = 15% do faturamento
- **Oxy Hacker / Franquia**: Pontual = 100% do faturamento (sem MRR/Setup)
- Total de todas as BUs deve ser sempre **R$ 33.306.500**
- Se reduzir vendas em um mes, precisa compensar em outro
- Mes atual (Fev 2026) e futuros: editaveis. Meses passados (Jan): somente leitura

## Mudancas

### 1. Banco de Dados - Nova migracao
Adicionar 2 colunas na tabela `monetary_metas`:
- `vendas` (integer, default 0) - quantidade de vendas no mes
- `ticket_medio` (numeric, default 0) - ticket medio da BU

### 2. Hook `useMonetaryMetas.ts`
- Adicionar os novos campos `vendas` e `ticket_medio` na tipagem `MonetaryMeta`
- Incluir esses campos nas queries de leitura e escrita (upsert)
- Adicionar funcao para calcular faturamento a partir de vendas x ticket

### 3. Componente `MonetaryMetasTab.tsx` - Reformulacao completa da UI
**Nova interface:**
- Seletor de BU (mantido)
- Campo de **Ticket Medio** editavel por BU (um unico input no topo)
- Tabela com meses como colunas:
  - Linha "Vendas": inputs editaveis (desabilitados para meses passados, com fundo cinza)
  - Linha "Faturamento": valor calculado automaticamente (somente leitura)
  - Para Modelo Atual/O2 TAX: linhas MRR, Setup, Pontual (calculados, somente leitura)
  - Para Oxy Hacker/Franquia: linha Pontual (calculada, somente leitura)
- **Totalizador**: mostra total da BU atual e total consolidado de todas as BUs
- **Validacao visual**: barra mostrando se o total consolidado esta igual a R$ 33.306.500
  - Verde se igual, vermelho se diferente, com indicacao de quanto falta ou sobra
- Botao Salvar (grava vendas, ticket_medio, e os valores calculados de faturamento/MRR/Setup/Pontual)

**Bloqueio temporal:**
- Mes atual (baseado na data do sistema): editavel
- Meses futuros: editaveis
- Meses passados: inputs desabilitados com fundo cinza

**Tickets medios iniciais** (pre-preenchidos com base nos dados atuais):
- Modelo Atual: calculado a partir dos dados existentes (~R$ 400.000 estimado)
- O2 TAX: calculado dos dados existentes
- Oxy Hacker: R$ 54.000
- Franquia: R$ 140.000

### 4. Manter compatibilidade
Os campos `faturamento`, `mrr`, `setup`, `pontual` continuam sendo gravados no banco ao salvar, garantindo que todos os dashboards (Indicadores, Controle Metas, Plan Growth) continuem funcionando sem alteracao.

## Resultado
O admin controla apenas vendas e ticket, o sistema calcula tudo. O total consolidado e protegido visualmente para garantir R$ 33.306.500. Meses passados nao podem ser alterados.
