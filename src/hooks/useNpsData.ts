import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NpsCard {
  ID: string;
  'Título': string;
  'Fase': string;
  'Fase Atual': string;
  'Entrada': string;
  'Nota NPS': string | null;
  'Motivo da Nota': string | null;
  'Satisfacao Geral': string | null;
  'Sentimento Oxy': string | null;
  'Comentarios': string | null;
  'E-mail': string | null;
  'Responsavel Tratativa': string | null;
  'CFO Responsavel': string | null;
}

export interface NpsKpis {
  clientesPesquisados: number;
  respostas: number;
  taxaResposta: number;
  cfosAtivos: number;
}

export interface NpsMetrics {
  nps: { score: number; label: string; meta: number; metaAtingida: boolean };
  csat: { score: number; meta: number; metaAtingida: boolean };
  seanEllis: { score: number; meta: number; metaAtingida: boolean };
  taxaResposta: { score: number; meta: number };
}

export interface NpsDistributionData {
  promotores: { count: number; pct: number; label: string };
  neutros: { count: number; pct: number; label: string };
  detratores: { count: number; pct: number; label: string };
}

export interface CsatDistributionData {
  satisfeitos: { pct: number; count: number };
  neutros: { pct: number; count: number };
  insatisfeitos: { pct: number; count: number };
  breakdown: { label: string; nota: number; count: number }[];
}

export interface SeanEllisItem {
  label: string;
  count: number;
  color: string;
}

export interface CfoPerformance {
  name: string;
  enviados: number;
  respostas: number;
  taxaResposta: number;
  nps: number;
  csat: number;
  seanEllis: number | null;
}

export interface FeedbackItem {
  quote: string;
  npsScore: number;
  sentiment: 'Positivo' | 'Neutro' | 'Negativo';
}

interface CardConnection {
  card_id: string;
  connected_card_id: string;
  connected_pipe_name: string;
}

interface CentralProjeto {
  ID: string;
  'Fase': string;
  'Fase Atual': string;
  'CFO Responsavel': string | null;
}

async function fetchNpsData(): Promise<{ npsRows: NpsCard[]; cfoMap: Record<string, string> }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Fetch all 3 tables in parallel
  const [npsRes, connRes, projRes] = await Promise.all([
    supabase.functions.invoke('query-external-db', {
      body: { table: 'pipefy_moviment_nps', action: 'preview', limit: 1000 },
    }),
    supabase.functions.invoke('query-external-db', {
      body: { table: 'pipefy_card_connections', action: 'preview', limit: 5000 },
    }),
    supabase.functions.invoke('query-external-db', {
      body: { table: 'pipefy_central_projetos', action: 'preview', limit: 2000 },
    }),
  ]);

  if (npsRes.error) throw npsRes.error;

  const npsRows: NpsCard[] = npsRes.data?.data || [];
  const connections: CardConnection[] = connRes.data?.data || [];
  const projetos: CentralProjeto[] = projRes.data?.data || [];

  // Build CFO map: NPS card ID → CFO name
  // Connection: card_id (central_projetos) → connected_card_id (NPS card)
  // Filter connections for NPS pipe
  const npsConnections = connections.filter(c =>
    c.connected_pipe_name === '5.2 Pesquisa de Satisfação NPS'
  );

  // Build projeto CFO lookup (only current phase)
  const projetoCfoMap: Record<string, string> = {};
  projetos.forEach(p => {
    if (p['Fase'] === p['Fase Atual'] && p['CFO Responsavel']) {
      projetoCfoMap[p.ID] = p['CFO Responsavel'];
    }
  });

  // Map NPS card ID → CFO from connected project
  const cfoMap: Record<string, string> = {};
  npsConnections.forEach(conn => {
    const cfo = projetoCfoMap[conn.card_id];
    if (cfo) {
      cfoMap[conn.connected_card_id] = cfo;
    }
  });

  return { npsRows, cfoMap };
}

function parseNpsScore(val: string | null): number | null {
  if (!val) return null;
  const num = parseInt(String(val).replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? null : num;
}

function parseCsatScore(val: string | null): number | null {
  if (!val) return null;
  const match = String(val).match(/^(\d)/);
  return match ? parseInt(match[1], 10) : null;
}

function classifySeanEllis(val: string | null): 'muito_desapontado' | 'certa_forma' | 'nao_desapontado' | null {
  if (!val) return null;
  const lower = val.toLowerCase();
  if (lower.includes('muito desapontado')) return 'muito_desapontado';
  if (lower.includes('certa forma')) return 'certa_forma';
  if (lower.includes('não ficaria') || lower.includes('nao ficaria') || lower.includes('não uso') || lower.includes('nao uso')) return 'nao_desapontado';
  return null;
}

function classifyNps(score: number): 'promotor' | 'neutro' | 'detrator' {
  if (score >= 9) return 'promotor';
  if (score >= 7) return 'neutro';
  return 'detrator';
}

function determineSentiment(npsScore: number | null): 'Positivo' | 'Neutro' | 'Negativo' {
  if (npsScore === null) return 'Neutro';
  if (npsScore >= 9) return 'Positivo';
  if (npsScore <= 6) return 'Negativo';
  return 'Neutro';
}

function getNpsLabel(score: number): string {
  if (score >= 75) return 'Excelente';
  if (score >= 50) return 'Muito Bom';
  if (score >= 0) return 'Bom';
  if (score >= -50) return 'Ruim';
  return 'Crítico';
}

function processNpsData(rows: NpsCard[], externalCfoMap: Record<string, string>) {
  // Only current phase cards (unique)
  const currentCards = rows.filter(r => r['Fase'] === r['Fase Atual']);
  
  // All cards (for total pesquisados)
  const allUniqueIds = new Set(rows.map(r => r.ID));
  const totalPesquisados = allUniqueIds.size;

  // Cards with NPS response
  const withNps = currentCards.filter(c => parseNpsScore(c['Nota NPS']) !== null);
  const respostas = withNps.length;
  const taxaResposta = totalPesquisados > 0 ? Math.round((respostas / totalPesquisados) * 100) : 0;

  // Unique CFOs (prefer external map, fallback to card fields)
  const cfos = new Set(currentCards.map(c => externalCfoMap[c.ID] || c['CFO Responsavel'] || c['Responsavel Tratativa']).filter(Boolean));
  const cfosAtivos = cfos.size;

  // NPS Distribution
  let promotores = 0, neutros = 0, detratores = 0;
  withNps.forEach(c => {
    const score = parseNpsScore(c['Nota NPS'])!;
    const cls = classifyNps(score);
    if (cls === 'promotor') promotores++;
    else if (cls === 'neutro') neutros++;
    else detratores++;
  });

  const npsScore = respostas > 0
    ? Math.round(((promotores - detratores) / respostas) * 100)
    : 0;

  const promPct = respostas > 0 ? Math.round((promotores / respostas) * 100) : 0;
  const neuPct = respostas > 0 ? Math.round((neutros / respostas) * 100) : 0;
  const detPct = respostas > 0 ? Math.round((detratores / respostas) * 100) : 0;

  // CSAT
  const withCsat = currentCards.map(c => parseCsatScore(c['Satisfacao Geral'])).filter((v): v is number => v !== null);
  const csatBreakdownMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  withCsat.forEach(v => { if (csatBreakdownMap[v] !== undefined) csatBreakdownMap[v]++; });
  
  const csatTotal = withCsat.length;
  const csatSatisfeitos = csatBreakdownMap[4] + csatBreakdownMap[5];
  const csatNeutros = csatBreakdownMap[3];
  const csatInsatisfeitos = csatBreakdownMap[1] + csatBreakdownMap[2];
  const csatScore = csatTotal > 0 ? Math.round((csatSatisfeitos / csatTotal) * 100) : 0;

  const csatDistribution: CsatDistributionData = {
    satisfeitos: { pct: csatTotal > 0 ? Math.round((csatSatisfeitos / csatTotal) * 100) : 0, count: csatSatisfeitos },
    neutros: { pct: csatTotal > 0 ? Math.round((csatNeutros / csatTotal) * 100) : 0, count: csatNeutros },
    insatisfeitos: { pct: csatTotal > 0 ? Math.round((csatInsatisfeitos / csatTotal) * 100) : 0, count: csatInsatisfeitos },
    breakdown: [
      { label: 'Muito Satisfeito', nota: 5, count: csatBreakdownMap[5] },
      { label: 'Satisfeito', nota: 4, count: csatBreakdownMap[4] },
      { label: 'Neutro', nota: 3, count: csatBreakdownMap[3] },
      { label: 'Insatisfeito', nota: 2, count: csatBreakdownMap[2] },
      { label: 'Muito Insatisfeito', nota: 1, count: csatBreakdownMap[1] },
    ],
  };

  // Sean Ellis
  const seClassifications = currentCards.map(c => classifySeanEllis(c['Sentimento Oxy'])).filter((v): v is NonNullable<typeof v> => v !== null);
  const seMuito = seClassifications.filter(v => v === 'muito_desapontado').length;
  const seCerta = seClassifications.filter(v => v === 'certa_forma').length;
  const seNao = seClassifications.filter(v => v === 'nao_desapontado').length;
  const seTotal = seClassifications.length;
  const seanEllisScore = seTotal > 0 ? Math.round((seMuito / seTotal) * 100) : 0;

  const seanEllisDistribution: SeanEllisItem[] = [
    { label: 'Muito desapontado', count: seMuito, color: 'bg-green-500' },
    { label: 'De certa forma desapontado', count: seCerta, color: 'bg-amber-500' },
    { label: 'Não ficaria desapontado', count: seNao, color: 'bg-red-500' },
  ];

  // Metrics
  const kpis: NpsKpis = { clientesPesquisados: totalPesquisados, respostas, taxaResposta, cfosAtivos };

  const metrics: NpsMetrics = {
    nps: { score: npsScore, label: getNpsLabel(npsScore), meta: 40, metaAtingida: npsScore >= 40 },
    csat: { score: csatScore, meta: 80, metaAtingida: csatScore >= 80 },
    seanEllis: { score: seanEllisScore, meta: 40, metaAtingida: seanEllisScore >= 40 },
    taxaResposta: { score: taxaResposta, meta: 40 },
  };

  const npsDistribution: NpsDistributionData = {
    promotores: { count: promotores, pct: promPct, label: 'notas 9-10' },
    neutros: { count: neutros, pct: neuPct, label: 'notas 7-8' },
    detratores: { count: detratores, pct: detPct, label: 'notas 0-6' },
  };

  // CFO Performance
  const cfoMap: Record<string, { enviados: number; withNps: { score: number }[]; csatScores: number[]; seClassifications: ReturnType<typeof classifySeanEllis>[] }> = {};
  
  currentCards.forEach(c => {
    const cfo = externalCfoMap[c.ID] || c['CFO Responsavel'] || c['Responsavel Tratativa'] || 'Sem CFO';
    if (!cfoMap[cfo]) cfoMap[cfo] = { enviados: 0, withNps: [], csatScores: [], seClassifications: [] };
    cfoMap[cfo].enviados++;
    
    const nps = parseNpsScore(c['Nota NPS']);
    if (nps !== null) cfoMap[cfo].withNps.push({ score: nps });
    
    const csat = parseCsatScore(c['Satisfacao Geral']);
    if (csat !== null) cfoMap[cfo].csatScores.push(csat);
    
    const se = classifySeanEllis(c['Sentimento Oxy']);
    if (se !== null) cfoMap[cfo].seClassifications.push(se);
  });

  const cfoPerformance: CfoPerformance[] = Object.entries(cfoMap).map(([name, data]) => {
    const resp = data.withNps.length;
    const taxa = data.enviados > 0 ? Math.round((resp / data.enviados) * 100) : 0;
    
    const prom = data.withNps.filter(n => n.score >= 9).length;
    const det = data.withNps.filter(n => n.score <= 6).length;
    const cfoNps = resp > 0 ? Math.round(((prom - det) / resp) * 100) : 0;
    
    const cfoCsatSat = data.csatScores.filter(s => s >= 4).length;
    const cfoCsat = data.csatScores.length > 0 ? Math.round((cfoCsatSat / data.csatScores.length) * 100) : 0;
    
    const cfeSeMuito = data.seClassifications.filter(s => s === 'muito_desapontado').length;
    const cfeSe = data.seClassifications.length > 0 ? Math.round((cfeSeMuito / data.seClassifications.length) * 100) : null;

    return { name, enviados: data.enviados, respostas: resp, taxaResposta: taxa, nps: cfoNps, csat: cfoCsat, seanEllis: cfeSe };
  }).sort((a, b) => b.nps - a.nps);

  // Feedback qualitativo
  const feedback: Record<string, FeedbackItem[]> = {
    elogios: [],
    sugestoes: [],
    criticas: [],
    expectativas: [],
  };

  withNps.forEach(c => {
    const nps = parseNpsScore(c['Nota NPS'])!;
    const sentiment = determineSentiment(nps);
    
    const motivo = c['Motivo da Nota']?.trim();
    const comentarios = c['Comentarios']?.trim();
    
    const texts: string[] = [];
    if (motivo) texts.push(motivo);
    if (comentarios && comentarios !== motivo) texts.push(comentarios);
    
    texts.forEach(text => {
      const item: FeedbackItem = { quote: text, npsScore: nps, sentiment };
      
      if (nps >= 9) {
        feedback.elogios.push(item);
      } else if (nps >= 7) {
        // Check if text has suggestion keywords
        const lower = text.toLowerCase();
        if (lower.includes('sugir') || lower.includes('sugest') || lower.includes('poderia') || lower.includes('melhor') || lower.includes('falta')) {
          feedback.sugestoes.push(item);
        } else {
          feedback.expectativas.push(item);
        }
      } else {
        feedback.criticas.push(item);
      }
    });
  });

  return {
    kpis,
    metrics,
    npsDistribution,
    csatDistribution,
    seanEllisDistribution,
    cfoPerformance,
    feedback,
    seExcluded: currentCards.length - seTotal,
  };
}

export function useNpsData() {
  return useQuery({
    queryKey: ['nps-data'],
    queryFn: async () => {
      const { npsRows, cfoMap } = await fetchNpsData();
      return processNpsData(npsRows, cfoMap);
    },
    staleTime: 5 * 60 * 1000,
  });
}
