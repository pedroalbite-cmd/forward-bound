

## Diagnóstico

Revisei o código atual linha por linha. A função `normalizeOrigemLead` (linhas 48-58) **está correta** — o regex `/,\s*utm.*/i` deveria limpar todas essas strings. Porém, claramente não está funcionando na prática.

O problema pode ser que as edições anteriores não foram aplicadas corretamente no build. Vou **reescrever a função por completo** com uma abordagem diferente e mais agressiva para garantir que funcione:

### Solução

**Arquivo**: `ConversionsByChannelChart.tsx` — reescrever `normalizeOrigemLead` completamente

Nova abordagem:
1. Usar regex que remove TUDO após a primeira vírgula OU `?` — sem tentar ser inteligente sobre "utm"
2. Depois limpar `.com/`, trailing slashes
3. Lookup no `ORIGEM_MAP` expandido (adicionar `fb` → `Facebook` que já existe mas confirmar)

```typescript
function normalizeOrigemLead(raw: string): string {
  if (!raw || raw.includes('{{')) return '(Sem origem)';
  // Take only the FIRST segment before any comma, ?, or &
  const base = raw.split(/[,?&]/)[0].trim();
  if (!base) return '(Sem origem)';
  if (/^\d{10,}$/.test(base)) return 'Meta Ads';
  const key = base.toLowerCase().replace(/\.com\/?$/, '').replace(/\/$/, '');
  return ORIGEM_MAP[key] || (base.charAt(0).toUpperCase() + base.slice(1));
}
```

A diferença chave: em vez de `replace` + `split`, usar **apenas um `split`** no primeiro delimitador encontrado (`,`, `?`, ou `&`). Isso é mais simples e impossível de falhar.

### Alteração
Único arquivo, ~8 linhas na função.

