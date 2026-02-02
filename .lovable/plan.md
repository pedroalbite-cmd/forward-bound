

## Problema Identificado: Dados do Banco Vazios/Incorretos

### Situacao Atual

Ao analisar o banco de dados `monetary_metas`, encontrei:

| BU | Dados |
|----|-------|
| modelo_atual | Jan: R$ 400, Fev: R$ 400 (valores muito baixos!), Mar-Dez: R$ 0 |
| o2_tax | **Sem registros** |
| oxy_hacker | **Sem registros** |
| franquia | **Sem registros** |

A tela de "Metas Monetarias" mostra zeros porque os valores no banco estao realmente zerados ou muito baixos.

---

### Causa Raiz

1. **Dados de teste antigos**: Os valores 400/100 parecem ser testes (deveriam ser 400k)
2. **Apenas Modelo Atual tem registros**: O2 TAX, Oxy Hacker e Franquia nunca foram cadastrados
3. **A integracao esta funcionando corretamente**: O codigo le do banco e mostra o que esta la

---

### Solucao Proposta

#### Opcao 1: Popular o banco com valores corretos baseados no Plan Growth

Criar um script SQL que insere os valores padrao calculados pelo Plan Growth para todas as BUs:

**Modelo Atual** (baseado nas metas trimestrais Q1=3.75M, Q2=4.5M, Q3=6M, Q4=8M):
- Jan: R$ 1.125.000 | Fev: R$ 1.237.500 | Mar: R$ 1.387.500
- Abr: R$ 1.350.000 | Mai: R$ 1.485.000 | Jun: R$ 1.665.000
- Jul: R$ 1.800.000 | Ago: R$ 1.980.000 | Set: R$ 2.220.000
- Out: R$ 2.640.000 | Nov: R$ 2.960.000 | Dez: R$ 2.400.000

**Oxy Hacker** (baseado em unidades * R$ 54.000):
- Jan: R$ 54.000 | Fev: R$ 108.000 | Mar: R$ 108.000
- Abr: R$ 270.000 | Mai: R$ 270.000 | Jun: R$ 270.000
- Jul: R$ 540.000 | Ago: R$ 540.000 | Set: R$ 540.000
- Out: R$ 810.000 | Nov: R$ 972.000 | Dez: R$ 918.000

**Franquia** (baseado em unidades * R$ 140.000):
- Jan: R$ 0 | Fev: R$ 140.000 | Mar: R$ 140.000
- Abr: R$ 140.000 | Mai: R$ 140.000 | Jun: R$ 140.000
- Jul: R$ 280.000 | Ago: R$ 280.000 | Set: R$ 280.000
- Out: R$ 420.000 | Nov: R$ 420.000 | Dez: R$ 420.000

**O2 TAX** (distribuicao trimestral Q1=412k, Q2=587k, Q3=782k, Q4=1.04M):
- Jan: R$ 123.667 | Fev: R$ 136.034 | Mar: R$ 152.523
- Abr: R$ 176.166 | Mai: R$ 193.783 | Jun: R$ 217.271
- Jul: R$ 234.477 | Ago: R$ 257.925 | Set: R$ 289.188
- Out: R$ 343.298 | Nov: R$ 384.910 | Dez: R$ 312.089

---

### Implementacao

Vou criar uma migration SQL que:

1. **Deleta os registros existentes** de 2026 (limpeza)
2. **Insere todos os valores corretos** para as 4 BUs x 12 meses = 48 registros

```sql
-- Limpar dados antigos de 2026
DELETE FROM monetary_metas WHERE year = 2026;

-- Inserir Modelo Atual
INSERT INTO monetary_metas (bu, month, year, faturamento, mrr, setup, pontual) VALUES
('modelo_atual', 'Jan', 2026, 1125000, 281250, 675000, 168750),
('modelo_atual', 'Fev', 2026, 1237500, 309375, 742500, 185625),
-- ... (todos os 12 meses)

-- Inserir Oxy Hacker (100% pontual)
INSERT INTO monetary_metas (bu, month, year, faturamento, mrr, setup, pontual) VALUES
('oxy_hacker', 'Jan', 2026, 54000, 0, 0, 54000),
('oxy_hacker', 'Fev', 2026, 108000, 0, 0, 108000),
-- ... (todos os 12 meses)

-- Similar para Franquia e O2 TAX
```

---

### Resultado Esperado

Apos a migration:
- Todas as 4 BUs terao dados preenchidos
- A tela "Metas Monetarias" mostrara valores corretos
- O Plan Growth usara esses valores do banco
- Os Indicadores receberao as metas corretas via `useConsolidatedMetas`

---

### Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | **CRIAR** - Popular banco com valores do Plan Growth |

---

### Resumo Tecnico

O problema nao e de codigo - a integracao esta funcionando. O problema e que o banco nao tem os dados corretos. A solucao e popular o banco com os valores calculados do Plan Growth como baseline inicial.

