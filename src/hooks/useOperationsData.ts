import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectCard {
  ID: string;
  'Título': string;
  'Fase': string;
  'Fase Atual': string;
  'Entrada': string;
  'Saída': string | null;
  'Duração (s)': number | null;
  'CFO Responsavel': string | null;
  'Valor CFOaaS': string | null;
  'Valor Educacao': string | null;
  'Valor Diagnostico': string | null;
  'Valor Setup': string | null;
  'Valor OXY': string | null;
  'Valor Turnaround': string | null;
  'Valor Valuation': string | null;
  'Status Relacionamento': string | null;
  'Produtos': string | null;
  'Setor': string | null;
  'ERP': string | null;
  'UF': string | null;
  'Responsavel': string | null;
}

export interface TratativaCard {
  ID: string;
  'Título': string;
  'Fase': string;
  'Fase Atual': string;
  'Entrada': string;
  'Saída': string | null;
  'Duração (s)': number | null;
  'CFO Responsavel': string | null;
  'Motivo': string | null;
  'Decisao Final': string | null;
  'Motivo Churn': string | null;
  'Satisfacao do Cliente': string | null;
  'Responsavel pela Tratativa': string | null;
}

export interface CfoClient {
  titulo: string;
  mrr: number;
  cardId: string;
  fase: string;
}

export interface CfoDistribution {
  cfo: string;
  clientes: number;
  mrr: number;
  clients: CfoClient[];
}

export interface TratativaActive {
  id: string;
  empresa: string;
  motivo: string;
  cfo: string;
  diasEmTratativa: number;
  faseAtual: string;
}

export interface OperationsKpis {
  totalAtivos: number;
  emOnboarding: number;
  emOperacao: number;
  emTratativa: number;
  churn: number;
  mrrTotal: number;
  tratativasAtivas: number;
}

async function fetchTableData(table: string, limit = 1000) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('query-external-db', {
    body: { table, action: 'preview', limit },
  });

  if (error) throw error;
  return data?.data || [];
}

function parseNumber(val: string | null | undefined): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.,\-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function processProjects(rows: ProjectCard[]) {
  // Filter to current phase only (unique cards)
  const currentPhase = rows.filter(r => r['Fase'] === r['Fase Atual']);

  const phaseCount: Record<string, number> = {};
  const cfoMapAtivos: Record<string, { clientes: number; mrr: number; clients: CfoClient[] }> = {};
  let mrrTotal = 0;

  const fasesAtivas = ['Onboarding', 'Em Operação Recorrente'];

  currentPhase.forEach(card => {
    const fase = card['Fase Atual'] || 'Desconhecida';
    phaseCount[fase] = (phaseCount[fase] || 0) + 1;

    const cfo = card['CFO Responsavel'] || card['Responsavel'] || 'Sem CFO';
    const mrr = parseNumber(card['Valor CFOaaS']);

    if (fasesAtivas.includes(fase)) {
      if (!cfoMapAtivos[cfo]) cfoMapAtivos[cfo] = { clientes: 0, mrr: 0, clients: [] };
      cfoMapAtivos[cfo].clientes += 1;
      cfoMapAtivos[cfo].mrr += mrr;
      cfoMapAtivos[cfo].clients.push({
        titulo: card['Título'] || '',
        mrr,
        cardId: card.ID,
        fase,
      });
      mrrTotal += mrr;
    }
  });

  const cfoDistribution: CfoDistribution[] = Object.entries(cfoMapAtivos)
    .map(([cfo, data]) => ({ cfo, ...data }))
    .sort((a, b) => b.clientes - a.clientes);

  return {
    phaseCount,
    cfoDistribution,
    mrrTotal,
    totalCards: currentPhase.length,
    emOnboarding: phaseCount['Onboarding'] || 0,
    emOperacao: phaseCount['Em Operação Recorrente'] || 0,
    emTratativa: phaseCount['Em Tratativa'] || 0,
    churn: (phaseCount['Churn'] || 0) + (phaseCount['Atividades finalizadas'] || 0) + (phaseCount['Desistência'] || 0),
  };
}

function processTratativas(rows: TratativaCard[]) {
  const currentPhase = rows.filter(r => r['Fase'] === r['Fase Atual']);
  const now = Date.now();

  const activeFases = ['Triagem', 'Em Tratativa com CS', 'Plano de Ação (se necessário)', 'Conclusão', 'Financeiro'];
  const activeCards = currentPhase.filter(c => activeFases.includes(c['Fase Atual'] || ''));

  const tratativasAtivas: TratativaActive[] = activeCards.map(card => {
    const entrada = new Date(card['Entrada']).getTime();
    const dias = Math.max(0, Math.round((now - entrada) / 86400000));
    return {
      id: card.ID,
      empresa: card['Título'] || '',
      motivo: card['Motivo'] || 'N/A',
      cfo: card['CFO Responsavel'] || 'N/A',
      diasEmTratativa: dias,
      faseAtual: card['Fase Atual'] || '',
    };
  }).sort((a, b) => b.diasEmTratativa - a.diasEmTratativa);

  // Motivos de churn
  const finalizadas = currentPhase.filter(c =>
    c['Fase Atual'] === 'Tratativa finalizada' || c['Fase Atual'] === 'Arquivado'
  );
  const motivoChurnCount: Record<string, number> = {};
  const decisaoCount: Record<string, number> = {};

  finalizadas.forEach(card => {
    const motivo = card['Motivo Churn'] || 'Não informado';
    motivoChurnCount[motivo] = (motivoChurnCount[motivo] || 0) + 1;
    const decisao = card['Decisao Final'] || 'Não informada';
    decisaoCount[decisao] = (decisaoCount[decisao] || 0) + 1;
  });

  // Motivo distribuição (de todos com motivo)
  const motivoCount: Record<string, number> = {};
  currentPhase.forEach(card => {
    const motivo = card['Motivo'] || 'Não informado';
    motivoCount[motivo] = (motivoCount[motivo] || 0) + 1;
  });

  return {
    tratativasAtivas,
    totalTratativas: currentPhase.length,
    ativas: activeCards.length,
    motivoChurnCount,
    decisaoCount,
    motivoCount,
  };
}

export function useOperationsData() {
  return useQuery({
    queryKey: ['operations-data'],
    queryFn: async () => {
      const [projetos, tratativas] = await Promise.all([
        fetchTableData('pipefy_central_projetos'),
        fetchTableData('pipefy_moviment_tratativas'),
      ]);

      const projectData = processProjects(projetos);
      const tratativaData = processTratativas(tratativas);

      const kpis: OperationsKpis = {
        totalAtivos: projectData.emOnboarding + projectData.emOperacao,
        emOnboarding: projectData.emOnboarding,
        emOperacao: projectData.emOperacao,
        emTratativa: projectData.emTratativa,
        churn: projectData.churn,
        mrrTotal: projectData.mrrTotal,
        tratativasAtivas: tratativaData.ativas,
      };

      return {
        kpis,
        cfoDistribution: projectData.cfoDistribution,
        phaseCount: projectData.phaseCount,
        tratativasAtivas: tratativaData.tratativasAtivas,
        motivoChurnCount: tratativaData.motivoChurnCount,
        decisaoCount: tratativaData.decisaoCount,
        motivoCount: tratativaData.motivoCount,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
