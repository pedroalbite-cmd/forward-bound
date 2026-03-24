

## Corrigir duplicação de valores no sync DRE diário

### Problema identificado
A Edge Function `sync-daily-revenue` soma **todos os entries** do array `group.data` (linha 129). Quando a API DRE é chamada para um único dia, ela retorna 2 entries por grupo: um com o valor do período (ex: "Mar/26") e outro com "Total" — ambos com o mesmo valor. Isso **duplica** cada valor gravado no banco.

**Evidência**: valores no banco são ~2x os valores reais da plataforma:
| BU | Banco (errado) | Plataforma (correto) | Razão |
|---|---|---|---|
| CaaS | 915k | 483k | 1.89x |
| SaaS | 269k | 137k | 1.96x |
| Tax | 55k | 27k | 2.0x |

### Correção

**Arquivo:** `supabase/functions/sync-daily-revenue/index.ts`

Na lógica de extração dos valores (linhas 127-131), pegar **apenas o primeiro entry** do array `group.data` em vez de somar todos:

```typescript
const entries = Array.isArray(group.data) ? group.data : [];
// Pegar apenas o primeiro entry (o segundo é "Total" duplicado)
const value = entries.length > 0 ? Number(entries[0].value || 0) : 0;
```

**Após o fix:** Limpar os dados errados no banco e re-sincronizar:
1. Deletar todos os registros `source = 'dre'` da tabela `daily_revenue`
2. Re-executar o sync para 2026-03-01 a 2026-03-24

### Arquivos modificados
- `supabase/functions/sync-daily-revenue/index.ts` — usar apenas primeiro entry
- Migração SQL — limpar dados duplicados existentes

