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

export interface SetupCard {
  ID: string;
  'Título': string;
  'Fase': string;
  'Fase Atual': string;
  'Entrada': string;
  'Saída': string | null;
  'Duração (s)': number | null;
  'CFO Responsavel': string | null;
  'Implantador Oxy': string | null;
  'Nome Empresa': string | null;
  'Nome - Interlocução O2': string | null;
  'Data Kickoff': string | null;
}

export interface SetupActive {
  id: string;
  empresa: string;
  responsavel: string;
  faseAtual: string;
  diasEmSetup: number;
  atrasado: boolean;
}

export interface RotinaCard {
  ID: string;
  'Título': string;
  'Fase': string;
  'Fase Atual': string;
  'Entrada': string;
  'Saída': string | null;
  'CFO Responsavel': string | null;
  'Overdue': boolean | string | null;
  'Data Prevista Entrega': string | null;
  'Tipo de Entrega': string | null;
  'Mes Referencia': string | null;
}

export interface RotinaAtrasada {
  id: string;
  empresa: string;
  tipoEntrega: string;
  dataPrevista: string;
  diasAtraso: number;
  faseAtual: string;
}

export interface CfoTaskSummary {
  cfo: string;
  totalAtivas: number;
  atrasadas: number;
  tarefas: RotinaAtrasada[];
}

export interface OperationsKpis {
  totalAtivos: number;
  emOnboarding: number;
  emOperacao: number;
  emTratativa: number;
  churn: number;
  mrrTotal: number;
  tratativasAtivas: number;
  emSetup: number;
  setupAtrasados: number;
  tarefasAtrasadas: number;
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

const SETUP_TERMINAL_PHASES = ['Concluído', 'Churnou', 'Desistência', 'Arquivado', 'Arquivo'];

function processSetup(rows: SetupCard[]) {
  const currentPhase = rows.filter(r => r['Fase'] === r['Fase Atual']);
  const now = Date.now();

  const activeCards = currentPhase.filter(c => !SETUP_TERMINAL_PHASES.includes(c['Fase Atual'] || ''));

  const setupAtivos: SetupActive[] = activeCards.map(card => {
    const entrada = new Date(card['Entrada']).getTime();
    const dias = Math.max(0, Math.round((now - entrada) / 86400000));
    return {
      id: card.ID,
      empresa: card['Título'] || card['Nome Empresa'] || '',
      responsavel: card['Nome - Interlocução O2'] || card['CFO Responsavel'] || 'N/A',
      faseAtual: card['Fase Atual'] || '',
      diasEmSetup: dias,
      atrasado: dias > 90,
    };
  }).sort((a, b) => b.diasEmSetup - a.diasEmSetup);

  return {
    setupAtivos,
    total: currentPhase.length,
    emSetup: activeCards.length,
    setupAtrasados: setupAtivos.filter(s => s.atrasado).length,
  };
}

const ROTINA_TERMINAL_PHASES = ['Entregue / Concluído', 'Arquivado', 'Arquivo'];

function processRotinas(rows: RotinaCard[]): { cfoTaskSummary: CfoTaskSummary[]; tarefasAtrasadasTotal: number } {
  const currentPhase = rows.filter(r => r['Fase'] === r['Fase Atual']);
  const activeCards = currentPhase.filter(c => !ROTINA_TERMINAL_PHASES.includes(c['Fase Atual'] || ''));
  const now = Date.now();

  const cfoMap: Record<string, { totalAtivas: number; atrasadas: number; tarefas: RotinaAtrasada[] }> = {};

  activeCards.forEach(card => {
    const cfo = card['CFO Responsavel'] || 'Sem CFO';
    if (!cfoMap[cfo]) cfoMap[cfo] = { totalAtivas: 0, atrasadas: 0, tarefas: [] };
    cfoMap[cfo].totalAtivas += 1;

    const isOverdue = card['Overdue'] === true || card['Overdue'] === 'true';
    const dataPrevista = card['Data Prevista Entrega'];
    const isPastDue = dataPrevista ? new Date(dataPrevista).getTime() < now : false;

    if (isOverdue || isPastDue) {
      const entrada = dataPrevista ? new Date(dataPrevista).getTime() : new Date(card['Entrada']).getTime();
      const diasAtraso = Math.max(0, Math.round((now - entrada) / 86400000));
      cfoMap[cfo].atrasadas += 1;
      cfoMap[cfo].tarefas.push({
        id: card.ID,
        empresa: card['Título'] || '',
        tipoEntrega: card['Tipo de Entrega'] || 'N/A',
        dataPrevista: dataPrevista || 'N/A',
        diasAtraso,
        faseAtual: card['Fase Atual'] || '',
      });
    }
  });

  const cfoTaskSummary: CfoTaskSummary[] = Object.entries(cfoMap)
    .map(([cfo, data]) => ({ cfo, ...data, tarefas: data.tarefas.sort((a, b) => b.diasAtraso - a.diasAtraso) }))
    .sort((a, b) => b.atrasadas - a.atrasadas);

  const tarefasAtrasadasTotal = cfoTaskSummary.reduce((sum, c) => sum + c.atrasadas, 0);

  return { cfoTaskSummary, tarefasAtrasadasTotal };
}

export function useOperationsData() {
  return useQuery({
    queryKey: ['operations-data'],
    queryFn: async () => {
      const [projetos, tratativas, setup, rotinas] = await Promise.all([
        fetchTableData('pipefy_central_projetos'),
        fetchTableData('pipefy_moviment_tratativas'),
        fetchTableData('pipefy_moviment_setup'),
        fetchTableData('pipefy_moviment_rotinas'),
      ]);

      const projectData = processProjects(projetos);
      const tratativaData = processTratativas(tratativas);
      const setupData = processSetup(setup);
      const rotinaData = processRotinas(rotinas);

      const kpis: OperationsKpis = {
        totalAtivos: projectData.emOnboarding + projectData.emOperacao,
        emOnboarding: projectData.emOnboarding,
        emOperacao: projectData.emOperacao,
        emTratativa: projectData.emTratativa,
        churn: projectData.churn,
        mrrTotal: projectData.mrrTotal,
        tratativasAtivas: tratativaData.ativas,
        emSetup: setupData.emSetup,
        setupAtrasados: setupData.setupAtrasados,
        tarefasAtrasadas: rotinaData.tarefasAtrasadasTotal,
      };

      return {
        kpis,
        cfoDistribution: projectData.cfoDistribution,
        phaseCount: projectData.phaseCount,
        tratativasAtivas: tratativaData.tratativasAtivas,
        motivoChurnCount: tratativaData.motivoChurnCount,
        decisaoCount: tratativaData.decisaoCount,
        motivoCount: tratativaData.motivoCount,
        setupAtivos: setupData.setupAtivos,
        cfoTaskSummary: rotinaData.cfoTaskSummary,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
