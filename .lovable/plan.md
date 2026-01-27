

## Plano: Adicionar Dados Fictícios e Renomear para "Mkt Indicadores"

### Objetivo

1. Renomear a aba de "Mkt Indicators" para "Mkt Indicadores"
2. Adicionar dados fictícios realistas para visualização do dashboard

---

### Modificações

#### 1. Renomear a aba (Planning2026.tsx)

Alterar linha 28:
```typescript
// De:
{ key: 'marketing_indicators', label: 'Mkt Indicators', icon: TrendingUp },

// Para:
{ key: 'marketing_indicators', label: 'Mkt Indicadores', icon: TrendingUp },
```

---

#### 2. Dados Fictícios (useMarketingIndicators.ts)

Adicionar dados realistas para todos os indicadores:

**Canais de Marketing:**

| Canal | Investimento | Leads | MQLs | RM | RR | CPL | CPMQL | Conversão |
|-------|-------------|-------|------|-----|-----|------|-------|-----------|
| Meta Ads | R$ 85.000 | 520 | 364 | 218 | 175 | R$ 163 | R$ 233 | 70% |
| Google Ads | R$ 62.000 | 380 | 266 | 160 | 128 | R$ 163 | R$ 233 | 70% |
| Eventos | R$ 28.000 | 95 | 81 | 57 | 49 | R$ 295 | R$ 346 | 85% |

**Métricas de Performance:**

| Métrica | Valor | Meta |
|---------|-------|------|
| ROAS | 2.8x | 3.5x |
| ROI LTV | 4.5x | 5.0x |
| CAC | R$ 9.200 | R$ 8.000 |
| LTV | R$ 38.500 | R$ 40.000 |
| Investimento | R$ 175.000 | R$ 200.000 |

**Totais do Funil:**
- Leads: 995
- MQLs: 711
- RM: 435
- RR: 352

**Campanhas Exemplo:**

| Campanha | Canal | Status | Leads | MQLs | Gasto | ROAS |
|----------|-------|--------|-------|------|-------|------|
| Black Friday 2026 | Meta Ads | Ativo | 145 | 102 | R$ 18.500 | 3.2x |
| Webinar Contábil | Google Ads | Ativo | 92 | 74 | R$ 12.800 | 2.9x |
| Feira Empresarial SP | Eventos | Encerrado | 68 | 58 | R$ 15.000 | 4.1x |
| Remarketing Leads | Meta Ads | Ativo | 210 | 147 | R$ 22.000 | 2.5x |
| Brand Awareness | Google Ads | Pausado | 85 | 51 | R$ 8.500 | 1.8x |

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Planning2026.tsx` | Modificar | Renomear label para "Mkt Indicadores" |
| `src/hooks/useMarketingIndicators.ts` | Modificar | Adicionar dados fictícios realistas para todos os indicadores, canais e campanhas |

