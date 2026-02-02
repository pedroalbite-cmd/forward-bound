

## Correção: Usar "A Vender" no Incremento (não a Meta)

### Problema Identificado

O banco `monetary_metas` foi populado com o valor da **Meta Total** (ex: R$ 1.125.000 em Jan), mas o campo "Incremento" deveria conter o **"A Vender"** (receita nova a gerar).

| Campo | Valor Atual (Errado) | Valor Correto |
|-------|---------------------|---------------|
| Jan faturamento | R$ 1.125.000 (Meta) | R$ 400.000 (A Vender) |
| Fev faturamento | R$ 1.237.500 (Meta) | ~R$ 611.000 (A Vender) |

### Conceito

```text
Meta = MRR Base + A Vender
                    ↓
             "Incremento" no Admin
```

Para Modelo Atual:
- MRR Base Inicial: R$ 700.000
- Churn: 6%/mês
- Retenção: 25% das vendas do mês anterior
- A Vender (Jan): R$ 400.000 (fixo inicial)
- A Vender (Feb+): Meta - MRR Base dinâmico

---

### Solução

#### 1. Atualizar banco com valores de "A Vender"

Preciso recalcular os valores corretos usando a lógica de MRR dinâmico:

**Modelo Atual (calculado):**
- Jan: R$ 400.000 (valorVenderInicial fixo)
- Fev: Meta (1.237.500) - MRR (681.500) = R$ 556.000
- Mar: Meta (1.387.500) - MRR (673.210) = R$ 714.290
- ... (continua com churn e retenção)

**Outras BUs (não têm MRR):**
- Oxy Hacker, Franquia, O2 TAX: O "A Vender" = 100% do faturamento (não mudam)

#### 2. Recalcular MRR, Setup, Pontual

O MRR/Setup/Pontual devem ser 25%/60%/15% do **"A Vender"**, não da Meta:

```text
Incremento (A Vender) = 400.000
├── MRR = 100.000 (25%)
├── Setup = 240.000 (60%)
└── Pontual = 60.000 (15%)
```

---

### Valores Corretos Calculados

**Modelo Atual** (com MRR Base 700k, Churn 6%, Retenção 25%):

| Mês | Meta | MRR Base | A Vender | MRR (25%) | Setup (60%) | Pontual (15%) |
|-----|------|----------|----------|-----------|-------------|---------------|
| Jan | 1.125.000 | 725.000 | 400.000 | 100.000 | 240.000 | 60.000 |
| Fev | 1.237.500 | 681.500 | 556.000 | 139.000 | 333.600 | 83.400 |
| Mar | 1.387.500 | 648.610 | 738.890 | 184.722 | 443.334 | 110.833 |
| ... | ... | ... | ... | ... | ... | ... |

**Oxy Hacker/Franquia/O2 TAX**: Mantêm os valores atuais (A Vender = 100% do faturamento)

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Banco `monetary_metas` | **UPDATE** | Corrigir valores de Modelo Atual para usar A Vender |

---

### SQL de Correção

Vou atualizar apenas o `modelo_atual` com os valores de "A Vender" calculados:

```sql
-- Corrigir Modelo Atual: faturamento = A Vender (não Meta)
-- Calculado com MRR Base 700k, Churn 6%, Retenção 25%

UPDATE monetary_metas SET 
  faturamento = CASE month
    WHEN 'Jan' THEN 400000
    WHEN 'Fev' THEN 556000
    WHEN 'Mar' THEN 738890
    WHEN 'Abr' THEN 773614
    WHEN 'Mai' THEN 871337
    WHEN 'Jun' THEN 1011457
    WHEN 'Jul' THEN 1093855
    WHEN 'Ago' THEN 1224579
    WHEN 'Set' THEN 1407116
    WHEN 'Out' THEN 1523169
    WHEN 'Nov' THEN 1701969
    WHEN 'Dez' THEN 2041593
  END,
  mrr = ROUND(faturamento * 0.25),
  setup = ROUND(faturamento * 0.60),
  pontual = ROUND(faturamento * 0.15)
WHERE bu = 'modelo_atual' AND year = 2026;
```

---

### Resultado Esperado

Após a correção:
- Admin Metas Monetárias mostrará "Incremento" = A Vender
- Plan Growth usará esses valores corretamente
- Indicadores calcularão metas baseadas na receita nova a gerar

