

## Melhorar legenda do eixo X e dar mais "vida" ao gráfico de Faturamento

### Problemas identificados

1. **Legenda confusa no eixo X**: Com 3 meses selecionados e agrupamento diário, os labels mostram apenas o número do dia (1, 8, 15, 22, 29, 5, 12, 19, 26...) sem indicar o mês. Impossível saber de qual mês é cada dia.

2. **Gráfico pequeno e "estático"**: Altura fixa de `h-72` (288px) comprime tudo, fazendo as curvas parecerem uniformes e sem destaque visual.

### Alterações

**Arquivo 1: `src/components/planning/IndicatorsTab.tsx`** — labels do eixo X

- No `getChartLabels`, para agrupamento `daily`: mudar de `format(day, "d")` para incluir o mês quando o dia é 1 ou quando troca de mês (ex: "1 Jan", "15", "22", "1 Fev", "8"...)
- Alternativa mais limpa: usar `format(day, "d/MM")` para mostrar dia/mês em todos os pontos, e no XAxis do gráfico, usar `interval` para não sobrecarregar (mostrar a cada N labels)

**Arquivo 2: `src/components/planning/indicators/RevenuePaceChart.tsx`** — altura e visual

- Aumentar altura de `h-72` para `h-96` (384px) — mais espaço vertical para as curvas "respirarem"
- Mudar `type="monotone"` para `type="natural"` no Area e Line — curvas mais orgânicas com movimento natural
- Aumentar `strokeWidth` da área para 2.5 e do Line da meta para 2.5
- Adicionar dots nos pontos da linha realizada (`dot={{ r: 2 }}`) para dar textura visual
- No XAxis, adicionar `interval="preserveStartEnd"` e `angle={-45}` com `textAnchor="end"` quando houver muitos labels, ou usar `tick` customizado que mostra "d/MMM" apenas em pontos-chave

### Resultado
- Labels claros indicando dia + mês (ex: "1/Jan", "15/Jan", "1/Fev")
- Gráfico mais alto e com curvas mais orgânicas, dando sensação de movimento real

