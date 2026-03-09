

## Plano: Banner de TCV no topo da aba Marketing Indicadores

### O que sera feito
Adicionar um banner hero visualmente impactante logo abaixo do header de filtros, mostrando o **TCV total dos contratos ganhos** no periodo selecionado. Design premium com gradiente, animacoes sutis e breakdown por componente (MRR x12, Setup, Pontual).

### Dados
O TCV ja esta disponivel nos cards de atribuicao. Calculo:
```
vendasCards = allAttributionCards.filter(c => c.fase === 'Contrato assinado')
TCV = sum( (valorMRR * 12) + valorSetup + valorPontual )
```

### Alteracao

**Arquivo**: `src/components/planning/MarketingIndicatorsTab.tsx`

1. Calcular TCV total e breakdown (MRR anualizado, Setup, Pontual) a partir de `allAttributionCards` filtrados por "Contrato assinado"
2. Inserir um componente banner entre o header de filtros (linha ~483) e os Channel Metrics Cards (linha ~498)
3. Design: card com gradiente (primary → accent), icone Trophy/Sparkles, valor TCV grande com animacao de entrada, mini-badges com breakdown (MRR x12 | Setup | Pontual), quantidade de contratos, e ticket medio por contrato
4. Responsivo: stacked em mobile, inline em desktop

### UI/UX
- Gradiente `from-emerald-600 via-teal-600 to-cyan-700` com overlay pattern sutil
- Valor principal em `text-4xl font-bold` com fonte display
- 3 mini-cards translucidos mostrando MRR Anualizado, Setup e Pontual
- Badge com quantidade de contratos ganhos
- Efeito glass-morphism nos sub-cards

