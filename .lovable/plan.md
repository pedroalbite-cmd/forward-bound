

## Plano: Adicionar Lucas Ilha como Closer para O2 TAX

### Contexto

Atualmente, o filtro de closers nos Indicadores está limitado a **Pedro Albite** e **Daniel Trindade**, e a lógica de filtro só é aplicada ao **Modelo Atual**. O Lucas Ilha é o Tax Manager da O2 TAX e precisa ser incluído como opção de closer para essa BU.

---

### Descobertas na Base de Dados

| Tabela | Campo | Status |
|--------|-------|--------|
| `pipefy_cards_movements` (O2 TAX) | `Closer responsável` | Existe, mas está `null` na maioria dos leads novos |
| `closer_metas` | registros | Já tem Pedro e Daniel para todas as BUs (modelo_atual, o2_tax, oxy_hacker, franquia) |
| `useCloserMetas.ts` | CLOSERS const | Hardcoded: `['Pedro Albite', 'Daniel Trindade']` |
| `IndicatorsTab.tsx` | availableClosers | Hardcoded: Pedro e Daniel |

---

### Modificacoes Necessarias

#### 1. Atualizar Hook useCloserMetas.ts

Adicionar Lucas Ilha à lista de closers:

```typescript
// Linha 15: adicionar Lucas
const CLOSERS = ['Pedro Albite', 'Daniel Trindade', 'Lucas Ilha'] as const;
```

#### 2. Atualizar Filtro no IndicatorsTab.tsx

Atualizar a lista de closers disponíveis para incluir Lucas:

```typescript
// Linhas 296-299: adicionar Lucas
const availableClosers: MultiSelectOption[] = [
  { value: 'Pedro Albite', label: 'Pedro' },
  { value: 'Daniel Trindade', label: 'Daniel' },
  { value: 'Lucas Ilha', label: 'Lucas' },
];
```

#### 3. Estender Logica de Filtro para O2 TAX

Atualmente o filtro de closer so afeta o Modelo Atual. Precisa estender para O2 TAX:

**Arquivo:** `src/components/planning/IndicatorsTab.tsx`

Na funcao `getRealizedForIndicator` (linhas 471-498):
- Adicionar logica de filtro por closer para O2 TAX similar ao Modelo Atual

Na funcao `getMetaForIndicator` (linhas 439-467):
- Aplicar filtro de closer para O2 TAX (ja funciona pois usa `getFilteredMeta`)

#### 4. Atualizar useO2TaxAnalytics.ts

Garantir que o hook da O2 TAX extraia e exponha o campo `closer`:

```typescript
// Na linha 122: ja esta mapeando
responsavel: row['Closer responsável'] || row['SDR responsável'] || null,
```

Adicionar campo `closer` especifico para filtragem (similar ao useModeloAtualAnalytics):

```typescript
// Adicionar campo closer separado
closer: String(row['Closer responsável'] ?? '').trim(),
```

#### 5. Criar Registros para Lucas na closer_metas

Adicionar registros iniciais (50% de alocacao) para Lucas Ilha na O2 TAX:

**SQL para execucao via Cloud View:**

```sql
-- Inserir registros para Lucas Ilha na O2 TAX (todos os meses de 2026)
INSERT INTO closer_metas (bu, month, closer, percentage, year)
VALUES 
  ('o2_tax', 'Jan', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Fev', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Mar', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Abr', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Mai', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Jun', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Jul', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Ago', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Set', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Out', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Nov', 'Lucas Ilha', 50, 2026),
  ('o2_tax', 'Dez', 'Lucas Ilha', 50, 2026)
ON CONFLICT DO NOTHING;
```

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useCloserMetas.ts` | Modificar | Adicionar 'Lucas Ilha' à const CLOSERS |
| `src/hooks/useO2TaxAnalytics.ts` | Modificar | Adicionar campo `closer` separado para filtragem |
| `src/components/planning/IndicatorsTab.tsx` | Modificar | Adicionar Lucas aos availableClosers e estender lógica de filtro para O2 TAX |

---

### Comportamento Esperado Apos Implementacao

1. **Filtro de Closers** mostrara 3 opcoes: Pedro, Daniel, Lucas
2. **Ao selecionar Lucas**:
   - Para **O2 TAX**: filtra registros onde `Closer responsável = 'Lucas Ilha'`
   - Para **Modelo Atual**: Lucas nao tera efeito (ele nao trabalha nessa BU)
3. **Metas ajustadas** conforme percentuais configurados no Admin > Metas por Closer
4. **Radial gauges, graficos e funil** refletirao os dados filtrados por closer

---

### Observacao Importante

Os dados atuais da tabela `pipefy_cards_movements` mostram "Closer responsável" como `null` para leads recentes. O campo provavelmente so e preenchido quando o card avanca para fases mais avançadas do funil (RM, RR, Proposta). Isso significa que o filtro por Lucas tera efeito principalmente em:
- Reunioes Agendadas (RM)
- Reunioes Realizadas (RR)
- Propostas
- Vendas

Leads iniciais podem nao ter closer atribuido ainda.

