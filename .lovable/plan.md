

## Plano: Tornar o Card de SLA Clicável

### Problema Identificado

O card de SLA está explicitamente desabilitado para cliques:

1. **Linha 1134**: `if (indicator.key === 'sla') return;` - retorna sem ação
2. **Linha 1255**: `isClickable={indicator.key !== 'sla'}` - não mostra indicador visual de clicável

---

### Solução

Habilitar o drill-down do SLA mostrando todos os leads com seus tempos individuais de resposta (Data Entrada em "Tentativas de contato" - Data Criação).

---

### Seção Técnica

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planning/IndicatorsTab.tsx` | Remover bloqueio de clique do SLA, adicionar lógica de drill-down |

---

#### 1. Modificar `handleMonetaryCardClick` (linha ~1132-1153)

**Antes:**
```typescript
const handleMonetaryCardClick = (indicator: MonetaryIndicatorConfig) => {
  if (indicator.key === 'sla') return; // SLA não tem drill-down
  // ...
};
```

**Depois:**
```typescript
const handleMonetaryCardClick = (indicator: MonetaryIndicatorConfig) => {
  if (indicator.key === 'sla') {
    // SLA drill-down: show leads with individual response times
    const tentativasCards = modeloAtualAnalytics.cards.filter(card => 
      card.fase === 'Tentativas de contato' && card.dataCriacao
    ).map(card => {
      // Calculate SLA in minutes for each card
      const slaMinutes = (card.dataEntrada.getTime() - card.dataCriacao!.getTime()) / 1000 / 60;
      return {
        id: card.id,
        name: card.titulo || card.empresa || 'Sem título',
        company: card.empresa || card.contato || undefined,
        phase: 'Tentativas de contato',
        date: card.dataEntrada.toISOString(),
        value: 0,
        sla: slaMinutes, // Tempo individual de SLA
        responsible: card.responsavel || undefined,
        product: 'CaaS',
      } as DetailItem;
    });
    
    const slaColumns = [
      { key: 'product', label: 'Produto', format: columnFormatters.product },
      { key: 'company', label: 'Empresa/Contato' },
      { key: 'date', label: 'Data', format: columnFormatters.date },
      { key: 'sla', label: 'Tempo SLA', format: columnFormatters.duration },
      { key: 'responsible', label: 'Responsável' },
    ];
    
    const averageSla = modeloAtualAnalytics.getAverageSlaMinutes;
    
    setDetailSheetTitle('SLA - Tempo de Resposta');
    setDetailSheetDescription(`${tentativasCards.length} leads | Média: ${formatDuration(averageSla)}`);
    setDetailSheetItems(tentativasCards);
    setDetailSheetColumns(slaColumns);
    setDetailSheetOpen(true);
    return;
  }
  
  // All monetary indicators show sales cards
  // ... resto do código existente
};
```

---

#### 2. Habilitar visual de clicável para SLA (linha ~1255)

**Antes:**
```typescript
<MonetaryRadialCard 
  // ...
  isClickable={indicator.key !== 'sla'}
  onClick={() => handleMonetaryCardClick(indicator)}
/>
```

**Depois:**
```typescript
<MonetaryRadialCard 
  // ...
  isClickable={true}
  onClick={() => handleMonetaryCardClick(indicator)}
/>
```

---

#### 3. Adicionar `sla` ao tipo `DetailItem` (se necessário)

Verificar se o tipo `DetailItem` em `DetailSheet.tsx` suporta o campo `sla`. Se não:

```typescript
export interface DetailItem {
  // ... campos existentes
  sla?: number; // Tempo SLA em minutos
}
```

---

### Resultado Visual

Ao clicar no card de SLA, o modal mostrará:

| Produto | Empresa/Contato | Data | Tempo SLA | Responsável |
|---------|-----------------|------|-----------|-------------|
| CaaS | Empresa ABC | 29/01/2026 | 4m | João Silva |
| CaaS | Empresa XYZ | 28/01/2026 | 22m | Maria Santos |
| CaaS | Empresa 123 | 27/01/2026 | 1h 15m | Pedro Costa |

A descrição mostrará: "15 leads | Média: 27m"

