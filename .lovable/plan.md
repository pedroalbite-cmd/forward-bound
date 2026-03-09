

## Plano: Simplificar o Banner de Faturamento

**Arquivo**: `src/components/planning/indicators/TcvHeroBanner.tsx`

### Alteracoes

1. **Renomear titulo**: "TCV Gerado no Período" → "Faturamento no Período"
2. **Remover badge de contratos** (linha ~58, o Badge com "X contratos")
3. **Remover badge colapsado** (o texto de contratos que aparece quando colapsado)
4. **Remover card "Ticket Médio"** do grid de breakdown
5. **Grid de 4 → 3 colunas** (`grid-cols-3` em desktop): MRR Anualizado, Setup, Pontual
6. Manter a barra de distribuicao e os percentuais intactos

