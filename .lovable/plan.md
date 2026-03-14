

## Expandir linha "Expansão" no DRE para mostrar Franquia e Oxy Hacker

### O que muda

Atualmente a tabela DRE mostra 4 linhas separadas: CaaS, Tax, SaaS, Expansão. A proposta é reorganizar para **3 linhas principais** + **2 sub-linhas expansíveis**:

```text
┌──────────────┬────────┬────────┬─────┐
│ BU           │ Jan    │ Fev    │ ... │
├──────────────┼────────┼────────┼─────┤
│ CaaS + SaaS  │  xxx   │  xxx   │     │  ← modelo_atual (CaaS+SaaS somados)
│ Tax          │  xxx   │  xxx   │     │  ← o2_tax
│ ▶ Expansão   │  xxx   │  xxx   │     │  ← oxy_hacker + franquia (soma)
│   Oxy Hacker │  xxx   │  xxx   │     │  ← sub-linha (visível ao expandir)
│   Franquia   │  xxx   │  xxx   │     │  ← sub-linha (visível ao expandir)
├──────────────┼────────┼────────┼─────┤
│ Total        │  xxx   │  xxx   │     │
└──────────────┴────────┴────────┴─────┘
```

### Implementação

**Arquivo: `src/components/planning/financial/DreTable.tsx`**

1. Adicionar state `expanded` (boolean) para controlar visibilidade das sub-linhas
2. Reorganizar as linhas:
   - **CaaS + SaaS** (modelo_atual) — mantém como está, label "CaaS + SaaS"
   - **Tax** (o2_tax) — mantém
   - **Expansão** — nova linha que soma `oxy_hacker + franquia`, com ícone de chevron clicável
   - Ao expandir: mostra 2 sub-linhas indentadas (Oxy Hacker e Franquia) com texto menor e fundo levemente diferente
3. O total no footer continua somando tudo normalmente

Nenhuma alteração em hooks ou backend — os dados já chegam separados por BU.

