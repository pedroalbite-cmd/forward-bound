

# Novo Filtro de Data estilo Google Ads - Indicadores e Mkt Indicadores

## Resumo

Substituir os botoes de atalho de data ("Este Mes", "Mes Anterior", "Q Atual", etc.) e os dois date pickers separados por um unico componente de filtro de data no estilo Google Ads. O componente sera um botao que exibe o periodo selecionado e, ao clicar, abre um popover/dropdown com:

- **Coluna esquerda**: lista de presets (Personalizar, Hoje, Ontem, Esta semana, 7 dias atras, Semana passada, 14 dias atras, Este mes, 30 dias atras, Ultimo mes, Todo o periodo) + campos customizados ("X dias ate hoje" / "X dias ate ontem")
- **Coluna direita**: Dois inputs de data (inicio/fim) + calendario visual com 2-3 meses

## Componente novo

### `src/components/planning/DateRangePickerGA.tsx`

Componente reutilizavel que encapsula toda a logica do filtro de data:

**Props:**
- `startDate: Date`
- `endDate: Date`
- `onDateChange: (start: Date, end: Date) => void`

**Presets disponiveis (mesmo em ambas as abas):**

| Preset | Logica |
|--------|--------|
| Personalizar | Selecao livre no calendario |
| Hoje | Hoje ate hoje |
| Ontem | Ontem ate ontem |
| Esta semana (dom. ate Hoje) | Domingo da semana atual ate hoje |
| 7 dias atras | 7 dias atras ate hoje |
| Semana passada (dom. a sab.) | Domingo a sabado da semana anterior |
| 14 dias atras | 14 dias atras ate hoje |
| Este mes | Primeiro dia do mes ate hoje |
| 30 dias atras | 30 dias atras ate hoje |
| Ultimo mes | Primeiro ao ultimo dia do mes anterior |
| Todo o periodo | 01/01/2026 ate hoje |

**Campos customizados:**
- Input numerico "X dias ate hoje" (calcula: hoje - X ate hoje)
- Input numerico "X dias ate ontem" (calcula: ontem - X ate ontem)

**Layout visual:**
```text
+------------------------------------------+
| Data de inicio*   |  Data de termino      |
| 05/01/2026        |  03/02/2026           |
+-------------------+----------------------+
| Personalizar      |                      |
| Hoje              |  DEZ. DE 2025  < >   |
| Ontem             |  D S T Q Q S S       |
| Esta semana (...) |  ...                 |
| 7 dias atras      |                      |
| Semana passada    |  JAN. DE 2026  < >   |
| 14 dias atras     |  D S T Q Q S S       |
| Este mes          |  ...                 |
| 30 dias atras     |                      |
| Ultimo mes        |  FEV. DE 2026  < >   |
| Todo o periodo    |  D S T Q Q S S       |
|                   |  ...                 |
| [30] dias ate hoje|                      |
| [30] dias ate ont.|                      |
+-------------------+----------------------+
|              [Aplicar]  [Cancelar]       |
+------------------------------------------+
```

**Comportamento:**
- Clicar em um preset atualiza imediatamente a selecao no calendario e os inputs de data
- O preset ativo fica destacado (fundo azul/primary)
- Alterar manualmente no calendario muda o preset para "Personalizar"
- Botao "Aplicar" confirma a selecao e fecha o popover
- Botao "Cancelar" descarta alteracoes e fecha

## Alteracoes nos arquivos existentes

### `src/components/planning/IndicatorsTab.tsx`

1. **Remover** os botoes de preset ("Este Mes", "Mes Anterior", "Q Atual", "Q Anterior", "2026") -- linhas 2399-2418
2. **Remover** os dois date pickers separados ("De:" e "Ate:") -- linhas 2420-2448
3. **Remover** estado `selectedPresets`, funcoes `togglePreset`, `getDateRangeFromPresets`, `handleStartDateChange`, `handleEndDateChange` -- linhas 366-440
4. **Substituir** por `<DateRangePickerGA>` com `startDate`, `endDate`, e `onDateChange` que atualiza ambos os estados

### `src/components/planning/MarketingIndicatorsTab.tsx`

1. **Remover** os botoes de atalho ("Mes Atual", "3M", "6M") -- linhas 108-115
2. **Remover** o date range picker com calendario de 2 meses -- linhas 118-138
3. **Substituir** por `<DateRangePickerGA>` com as mesmas props

## Detalhes tecnicos

- O componente usa `Popover` do Radix para o dropdown
- O calendario interno usa `DayPicker` do `react-day-picker` no modo `range`
- Os inputs de data (inicio/fim) sao campos `input` formatados em dd/MM/yyyy
- O highlight do range no calendario usa as classes `day_selected` e `day_range_middle` ja existentes
- Locale `ptBR` do date-fns para nomes de meses e dias
- `pointer-events-auto` no calendario para funcionar dentro do popover
- O popover tem `z-50` e background solido para evitar transparencia

