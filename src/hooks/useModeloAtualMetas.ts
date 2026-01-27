import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { eachDayOfInterval, eachMonthOfInterval, addDays, differenceInDays } from "date-fns";

export type ModeloAtualIndicator = 'leads' | 'mql' | 'rm' | 'rr' | 'proposta' | 'venda';
export type ChartGrouping = 'daily' | 'weekly' | 'monthly';

interface ModeloAtualMovement {
  id: string;
  titulo: string;
  fase: string;
  faseAtual: string;
  dataEntrada: Date;
  valorMRR: number;
  valorPontual: number;
  valorEducacao: number;
  valorSetup: number;
  valor: number;
}

interface ModeloAtualMetasResult {
  movements: ModeloAtualMovement[];
}

// Map phase names to indicator keys (based on pipefy_moviment_cfos table)
const PHASE_TO_INDICATOR: Record<string, ModeloAtualIndicator> = {
  // Leads - Total de leads (primeira etapa)
  'Novos Leads': 'leads',
  
  // MQL - Leads qualificados
  'MQLs': 'mql',
  
  // RM - Reunião Marcada
  'Reunião agendada / Qualificado': 'rm',
  'Remarcar Reunião': 'rm',
  
  // RR - Reunião Realizada
  'Reunião Realizada': 'rr',
  '1° Reunião Realizada - Apresentação': 'rr',
  
  // Proposta (somente esta fase conta)
  'Proposta enviada / Follow Up': 'proposta',
  
  // Venda (somente esta fase conta)
  'Ganho': 'venda',
};

// Parse date from PostgreSQL format
function parseDate(dateValue: string | null): Date | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  return date;
}

// Parse numeric value - handles both BR (8.570,65) and US/DB (8570.65) formats
function parseNumericValue(value: any): number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  
  if (typeof value === 'string') {
    // Remove R$ e espaços
    let cleaned = value.replace(/[R$\s]/g, '').trim();
    
    if (cleaned === '') return 0;
    
    // Detectar formato baseado na presença de vírgula e ponto:
    // - Formato BR: "8.570,65" (ponto = milhar, vírgula = decimal)
    // - Formato US/DB: "8570.65" (ponto = decimal)
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    
    if (hasComma && hasDot) {
      // Formato brasileiro completo: "8.570,65"
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot) {
      // Só vírgula: "8570,65" → trocar por ponto
      cleaned = cleaned.replace(',', '.');
    }
    // Se só tem ponto ou nenhum: já está em formato americano (banco)
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function useModeloAtualMetas(startDate?: Date, endDate?: Date) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['modelo-atual-metas', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<ModeloAtualMetasResult> => {
      // Use server-side filtering when dates are provided
      const hasDateFilter = startDate && endDate;
      const action = hasDateFilter ? 'query_period' : 'preview';
      
      console.log(`[useModeloAtualMetas] Fetching data from pipefy_moviment_cfos (action: ${action})`);
      
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('query-external-db', {
        body: { 
          table: 'pipefy_moviment_cfos', 
          action,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          limit: 10000 
        }
      });

      if (fetchError) {
        console.error('[useModeloAtualMetas] Error fetching data:', fetchError);
        throw fetchError;
      }

      if (!responseData?.data) {
        console.warn('[useModeloAtualMetas] No data returned');
        return { movements: [] };
      }

      console.log(`[useModeloAtualMetas] Raw data rows: ${responseData.data.length}`);

      const movements: ModeloAtualMovement[] = [];
      for (const row of responseData.data) {
        const id = String(row['ID'] || row['id'] || '');
        const fase = row['Fase'] || row['fase'] || '';
        let dataEntrada = parseDate(row['Entrada'] || row['entrada']) || new Date();
        
        // Skip if no valid phase mapping
        if (!fase || !PHASE_TO_INDICATOR[fase]) continue;

        // Note: Logic for "Data de assinatura do contrato" removed since
        // we now use "Ganho" phase for sales instead of "Contrato assinado"

        // Log raw values for debugging
        const rawMRR = row['Valor MRR'] || row['valor_mrr'] || 0;
        const rawPontual = row['Valor Pontual'] || row['valor_pontual'] || 0;
        const rawEducacao = row['Valor Educação'] || row['Valor Educacao'] || row['valor_educacao'] || 0;
        const rawSetup = row['Valor Setup'] || row['valor_setup'] || 0;

        const valorMRR = parseNumericValue(rawMRR);
        const valorPontual = parseNumericValue(rawPontual);
        const valorEducacao = parseNumericValue(rawEducacao);
        const valorSetup = parseNumericValue(rawSetup);

        const titulo = row['Título'] || row['titulo'] || row['Nome'] || '';

        movements.push({
          id,
          titulo,
          fase,
          faseAtual: row['Fase Atual'] || row['fase_atual'] || fase,
          dataEntrada,
          valorMRR,
          valorPontual,
          valorEducacao,
          valorSetup,
          valor: valorMRR + valorPontual + valorEducacao + valorSetup,
        });
      }

      console.log(`[useModeloAtualMetas] Parsed ${movements.length} valid movements`);
      const uniquePhases = [...new Set(movements.map(m => m.fase))];
      console.log(`[useModeloAtualMetas] Unique phases:`, uniquePhases);

      return { movements };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const movements = data?.movements ?? [];

  // Get total qty for a specific indicator and date range
  const getQtyForPeriod = (indicator: ModeloAtualIndicator, start?: Date, end?: Date): number => {
    if (movements.length === 0) return 0;

    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();

    // Count unique cards that entered the indicator phase in the period
    const seenIds = new Set<string>();
    for (const movement of movements) {
      const moveTime = movement.dataEntrada.getTime();
      if (moveTime >= startTime && moveTime <= endTime) {
        const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
        
        // LEADS = Union of 'Novos Leads' (leads) + 'MQLs' (mql)
        // This ensures every card entering the funnel is counted as a Lead
        if (indicator === 'leads') {
          if ((moveIndicator === 'leads' || moveIndicator === 'mql') && !seenIds.has(movement.id)) {
            seenIds.add(movement.id);
          }
        } else if (moveIndicator === indicator && !seenIds.has(movement.id)) {
          seenIds.add(movement.id);
        }
      }
    }

    const total = seenIds.size;
    console.log(`[useModeloAtualMetas] getQtyForPeriod ${indicator}: ${total}`);
    return total;
  };

  // Get total value for a specific indicator and date range
  const getValueForPeriod = (indicator: ModeloAtualIndicator, start?: Date, end?: Date): number => {
    if (movements.length === 0) return 0;

    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();

    // Sum values for unique cards in the indicator phase within the period
    const cardValues = new Map<string, { valor: number; titulo: string; mrr: number; pontual: number; educacao: number; setup: number }>();
    for (const movement of movements) {
      const moveTime = movement.dataEntrada.getTime();
      if (moveTime >= startTime && moveTime <= endTime) {
        const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
        if (moveIndicator === indicator) {
          // Keep the latest value for each card
          const existing = cardValues.get(movement.id);
          if (!existing || movement.valor > existing.valor) {
            cardValues.set(movement.id, {
              valor: movement.valor,
              titulo: movement.titulo,
              mrr: movement.valorMRR,
              pontual: movement.valorPontual,
              educacao: movement.valorEducacao,
              setup: movement.valorSetup,
            });
          }
        }
      }
    }

    let total = 0;
    const details: string[] = [];
    cardValues.forEach((data, cardId) => {
      const valorFinal = data.valor > 0 ? data.valor : 17000;
      total += valorFinal;
      details.push(`  - Card ${cardId} (${data.titulo}): MRR=${data.mrr}, Pontual=${data.pontual}, Educação=${data.educacao}, Setup=${data.setup} → Total: R$ ${valorFinal.toLocaleString('pt-BR')}`);
    });

    console.log(`[useModeloAtualMetas] getValueForPeriod ${indicator}:`);
    console.log(`  Cards encontrados: ${cardValues.size}`);
    details.forEach(d => console.log(d));
    console.log(`  TOTAL: R$ ${total.toLocaleString('pt-BR')}`);
    
    return total;
  };

  // Get grouped data for charts
  const getGroupedData = (indicator: ModeloAtualIndicator, start: Date, end: Date, grouping: ChartGrouping): { qty: number[]; meta: number[] } => {
    if (movements.length === 0) return { qty: [], meta: [] };

    const qtyArray: number[] = [];
    const metaArray: number[] = []; // Metas are handled by funnelData in IndicatorsTab

    if (grouping === 'daily') {
      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).getTime();

        const seenIds = new Set<string>();
        for (const movement of movements) {
          const moveTime = movement.dataEntrada.getTime();
          if (moveTime >= dayStart && moveTime <= dayEnd) {
            const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
            // LEADS = Union of 'Novos Leads' + 'MQLs'
            if (indicator === 'leads') {
              if ((moveIndicator === 'leads' || moveIndicator === 'mql') && !seenIds.has(movement.id)) {
                seenIds.add(movement.id);
              }
            } else if (moveIndicator === indicator && !seenIds.has(movement.id)) {
              seenIds.add(movement.id);
            }
          }
        }
        qtyArray.push(seenIds.size);
        metaArray.push(0); // Will be overridden by funnelData
      }
    } else if (grouping === 'weekly') {
      const totalDays = differenceInDays(end, start) + 1;
      const numWeeks = Math.ceil(totalDays / 7);

      for (let i = 0; i < numWeeks; i++) {
        const weekStart = addDays(start, i * 7);
        const weekEnd = i === numWeeks - 1 ? end : addDays(weekStart, 6);

        const weekStartTime = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
        const weekEndTime = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999).getTime();

        const seenIds = new Set<string>();
        for (const movement of movements) {
          const moveTime = movement.dataEntrada.getTime();
          if (moveTime >= weekStartTime && moveTime <= weekEndTime) {
            const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
            // LEADS = Union of 'Novos Leads' + 'MQLs'
            if (indicator === 'leads') {
              if ((moveIndicator === 'leads' || moveIndicator === 'mql') && !seenIds.has(movement.id)) {
                seenIds.add(movement.id);
              }
            } else if (moveIndicator === indicator && !seenIds.has(movement.id)) {
              seenIds.add(movement.id);
            }
          }
        }
        qtyArray.push(seenIds.size);
        metaArray.push(0);
      }
    } else {
      // Monthly
      const months = eachMonthOfInterval({ start, end });
      for (const monthDate of months) {
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime();
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const monthEnd = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999).getTime();

        const seenIds = new Set<string>();
        for (const movement of movements) {
          const moveTime = movement.dataEntrada.getTime();
          if (moveTime >= monthStart && moveTime <= monthEnd) {
            const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
            // LEADS = Union of 'Novos Leads' + 'MQLs'
            if (indicator === 'leads') {
              if ((moveIndicator === 'leads' || moveIndicator === 'mql') && !seenIds.has(movement.id)) {
                seenIds.add(movement.id);
              }
            } else if (moveIndicator === indicator && !seenIds.has(movement.id)) {
              seenIds.add(movement.id);
            }
          }
        }
        qtyArray.push(seenIds.size);
        metaArray.push(0);
      }
    }

    return { qty: qtyArray, meta: metaArray };
  };

  // Get MRR value for a specific period (sum of valorMRR from 'Ganho' phase cards)
  const getMrrForPeriod = (start?: Date, end?: Date): number => {
    if (movements.length === 0) return 0;

    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();

    const cardValues = new Map<string, number>();
    for (const movement of movements) {
      const moveTime = movement.dataEntrada.getTime();
      if (moveTime >= startTime && moveTime <= endTime) {
        const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
        if (moveIndicator === 'venda') {
          const existing = cardValues.get(movement.id);
          if (!existing || movement.valorMRR > existing) {
            cardValues.set(movement.id, movement.valorMRR);
          }
        }
      }
    }

    let total = 0;
    cardValues.forEach((value) => {
      total += value;
    });
    return total;
  };

  // Get Setup value for a specific period (sum of valorSetup from 'Ganho' phase cards)
  const getSetupForPeriod = (start?: Date, end?: Date): number => {
    if (movements.length === 0) return 0;

    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();

    const cardValues = new Map<string, number>();
    for (const movement of movements) {
      const moveTime = movement.dataEntrada.getTime();
      if (moveTime >= startTime && moveTime <= endTime) {
        const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
        if (moveIndicator === 'venda') {
          const existing = cardValues.get(movement.id);
          if (!existing || movement.valorSetup > existing) {
            cardValues.set(movement.id, movement.valorSetup);
          }
        }
      }
    }

    let total = 0;
    cardValues.forEach((value) => {
      total += value;
    });
    return total;
  };

  // Get Pontual value for a specific period (sum of valorPontual from 'Ganho' phase cards)
  const getPontualForPeriod = (start?: Date, end?: Date): number => {
    if (movements.length === 0) return 0;

    const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : 0;
    const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : Date.now();

    const cardValues = new Map<string, number>();
    for (const movement of movements) {
      const moveTime = movement.dataEntrada.getTime();
      if (moveTime >= startTime && moveTime <= endTime) {
        const moveIndicator = PHASE_TO_INDICATOR[movement.fase];
        if (moveIndicator === 'venda') {
          const existing = cardValues.get(movement.id);
          if (!existing || movement.valorPontual > existing) {
            cardValues.set(movement.id, movement.valorPontual);
          }
        }
      }
    }

    let total = 0;
    cardValues.forEach((value) => {
      total += value;
    });
    return total;
  };

  return {
    movements,
    isLoading,
    error,
    refetch,
    getQtyForPeriod,
    getValueForPeriod,
    getGroupedData,
    getMrrForPeriod,
    getSetupForPeriod,
    getPontualForPeriod,
  };
}

