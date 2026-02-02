

## Correção: Métricas Faltando nos Indicadores de Marketing

### Problema Identificado

A Edge Function está retornando 27 métricas, mas algumas estão zeradas porque os nomes na planilha **"Indicadores 26"** não correspondem exatamente aos mapeamentos configurados.

### Dados Atuais vs Esperados

| Métrica | Valor Atual | Valor Esperado | Problema |
|---------|-------------|----------------|----------|
| Meta Ads Leads | **0** | **668** | Nome na planilha diferente |
| GMV | **R$ 0** | **R$ 289.262** | Nome na planilha diferente |
| Educação | **R$ 0** | **?** | Nome na planilha diferente ou vazio |
| TCV | **R$ 0** | **R$ 1.216.654** | Nome na planilha diferente |
| CPP | **R$ 0** | **?** | Nome na planilha diferente |

### Diagnóstico

O mapeamento atual da Edge Function usa:
```typescript
'leadsMeta': ['Leads - Meta Ads', 'Meta Ads - Leads', 'Leads Meta Ads'],
'gmv': ['GMV', 'Gmv'],
'educacao': ['Educação', 'EDUCAÇÃO', 'Educacao'],
'tcv': ['TCV', 'Tcv'],
'cpp': ['CPP', 'Custo por Proposta'],
```

Mas a planilha provavelmente usa nomes diferentes, como por exemplo:
- "Leads Meta" em vez de "Leads - Meta Ads"
- "Receita Total" em vez de "GMV"
- "Custo Proposta" em vez de "CPP"

---

### Solução

Adicionar mais variações de nomes no mapeamento `METRIC_MAPPINGS` da Edge Function para cobrir os possíveis nomes usados na planilha.

---

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/read-marketing-sheet/index.ts` | Expandir METRIC_MAPPINGS com mais variações de nomes |

---

### Mapeamentos a Expandir

```typescript
const METRIC_MAPPINGS: Record<string, string[]> = {
  // Leads Meta - adicionar variações
  'leadsMeta': [
    'Leads - Meta Ads', 
    'Meta Ads - Leads', 
    'Leads Meta Ads',
    'Leads Meta',           // ADICIONAR
    'Leads - Meta',         // ADICIONAR
    'Lead Meta Ads',        // ADICIONAR
    'Lead - Meta Ads',      // ADICIONAR
  ],
  
  // GMV - adicionar variações
  'gmv': [
    'GMV', 
    'Gmv',
    'Receita Total',        // ADICIONAR
    'Receita Bruta',        // ADICIONAR
    'Gross Merchandise Value',  // ADICIONAR
    'Total GMV',            // ADICIONAR
  ],
  
  // TCV - adicionar variações
  'tcv': [
    'TCV', 
    'Tcv',
    'Total Contract Value', // ADICIONAR
    'Valor Total Contrato', // ADICIONAR
    'Ticket Total',         // ADICIONAR
  ],
  
  // CPP - adicionar variações
  'cpp': [
    'CPP', 
    'Custo por Proposta',
    'CP Proposta',          // ADICIONAR
    'Custo Proposta',       // ADICIONAR
    'Cost per Proposal',    // ADICIONAR
  ],
  
  // Educação - adicionar variações
  'educacao': [
    'Educação', 
    'EDUCAÇÃO', 
    'Educacao',
    'Educ',                 // ADICIONAR
    'Education',            // ADICIONAR
    'Receita Educação',     // ADICIONAR
  ],
};
```

---

### Implementação Adicional: Logging de Debug

Para identificar exatamente os nomes das métricas na planilha que não estão sendo reconhecidos, vou adicionar um log temporário na Edge Function:

```typescript
// Após parsear os dados, logar linhas não mapeadas
const unmappedLabels: string[] = [];
for (const row of rows) {
  if (!row.c || !row.c[0]) continue;
  const label = row.c[0].v;
  if (typeof label !== 'string') continue;
  
  const metricKey = findMetricKey(label);
  if (!metricKey && label.trim() !== '') {
    unmappedLabels.push(label);
  }
}

if (unmappedLabels.length > 0) {
  console.log('Unmapped labels found:', unmappedLabels.slice(0, 20));
}
```

---

### Seção Técnica

**Código Completo a Alterar:**

```typescript
// Metric name mappings (normalized → original variations)
const METRIC_MAPPINGS: Record<string, string[]> = {
  'midiaGoogle': ['Mídia Google Ads', 'Mídia - Google Ads', 'Google Ads - Mídia', 'Mídia Google', 'Google Ads Mídia'],
  'leadsGoogle': ['Leads - Google Ads', 'Google Ads - Leads', 'Leads Google Ads', 'Leads Google'],
  'cplGoogle': ['CPL - Google Ads', 'Google Ads - CPL', 'CPL Google Ads', 'CPL Google'],
  'midiaMeta': ['Mídia Meta Ads', 'Mídia - Meta Ads', 'Meta Ads - Mídia', 'Mídia Meta', 'Meta Ads Mídia'],
  'leadsMeta': ['Leads - Meta Ads', 'Meta Ads - Leads', 'Leads Meta Ads', 'Leads Meta', 'Leads - Meta', 'Lead Meta Ads'],
  'cplMeta': ['CPL - Meta Ads', 'Meta Ads - CPL', 'CPL Meta Ads', 'CPL Meta'],
  'midiaTotal': ['Mídia total', 'Mídia Total', 'Total Mídia', 'Mídia Totais', 'Total Mídia Ads'],
  'leadsTotais': ['Leads totais', 'Leads Totais', 'Total Leads', 'Total de Leads'],
  'cplTotal': ['CPL total', 'CPL Total', 'Total CPL', 'CPL Totais'],
  'mqlPorFaturamento': ['MQL por Faturamento', 'MQL - Faturamento', 'MQLs', 'MQL Faturamento', 'MQLs por Faturamento'],
  'cpmqlPorFaturamento': ['CPMQL por Faturamento', 'CPMQL', 'CPMql', 'CPMQL Faturamento', 'CP MQL'],
  'reuniaoMarcada': ['Reunião marcada', 'Reunião Marcada', 'RM', 'Reuniões Marcadas', 'Reuniao Marcada'],
  'cprm': ['CPRM', 'CPRm', 'Custo por RM', 'CP RM', 'Custo RM'],
  'reuniaoRealizada': ['Reunião realizada', 'Reunião Realizada', 'RR', 'Reuniões Realizadas', 'Reuniao Realizada'],
  'cprr': ['CPRR', 'CPRr', 'Custo por RR', 'CP RR', 'Custo RR'],
  'propostaEnviada': ['Proposta enviada', 'Proposta Enviada', 'Propostas', 'Propostas Enviadas', 'Proposta'],
  'cpp': ['CPP', 'Custo por Proposta', 'CP Proposta', 'Custo Proposta', 'CP P'],
  'vendas': ['Vendas', 'Venda', 'Total Vendas', 'Vendas Totais'],
  'cpv': ['CPV', 'Custo por Venda', 'CP Venda', 'Custo Venda'],
  'mrr': ['MRR', 'Mrr', 'Monthly Recurring Revenue', 'Receita Recorrente'],
  'setup': ['Setup', 'SETUP', 'Valor Setup', 'Taxa Setup'],
  'pontual': ['Pontual', 'PONTUAL', 'Receita Pontual', 'Valor Pontual'],
  'educacao': ['Educação', 'EDUCAÇÃO', 'Educacao', 'Educ', 'Receita Educação', 'Education'],
  'gmv': ['GMV', 'Gmv', 'Receita Total', 'Receita Bruta', 'Gross Merchandise Value', 'Total GMV', 'Total Receita'],
  'cac': ['CAC', 'Cac', 'Custo Aquisição Cliente', 'Customer Acquisition Cost'],
  'ltv': ['LTV', 'Ltv', 'Lifetime Value', 'Valor Vitalício'],
  'tcv': ['TCV', 'Tcv', 'Total Contract Value', 'Valor Total Contrato', 'Ticket Total'],
  'roas': ['ROAS', 'Roas', 'Return on Ad Spend'],
  'roasLtv': ['ROAS LTV', 'ROAS Ltv', 'Roas LTV', 'ROAS x LTV'],
  'roiLtv': ['ROI LTV', 'ROI Ltv', 'Roi LTV', 'ROI x LTV'],
  'ltvCac': ['LTV/CAC', 'LTV / CAC', 'Ltv/Cac', 'LTV:CAC', 'LTV CAC'],
};
```

---

### Resultado Esperado

Após a correção:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Meta Ads Leads | 0 | 668 |
| GMV | R$ 0 | R$ 289.262 |
| Educação | R$ 0 | Valor real |
| TCV | R$ 0 | R$ 1.216.654 |
| CPP | R$ 0 | Valor real |

---

### Impacto

1. **Todas as métricas de marketing serão exibidas corretamente** no dashboard
2. **O log de debug** ajudará a identificar futuras métricas não mapeadas
3. **Maior resiliência** a pequenas variações de nomenclatura na planilha

