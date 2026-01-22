import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DetailItem } from "@/components/planning/indicators/DetailSheet";
import { IndicatorType } from "@/hooks/useFunnelRealized";

export interface ModeloAtualCard {
  id: string;
  titulo: string;
  empresa?: string;
  contato?: string;
  fase: string;
  faseDestino: string;
  dataEntrada: Date;
  valor: number;
  valorMRR: number;
  valorPontual: number;
  valorEducacao: number;
  valorSetup: number;
  responsavel?: string;
  faixa?: string;
}

// Map destination phases to indicators
const PHASE_TO_INDICATOR: Record<string, IndicatorType> = {
  'MQL': 'mql',
  'Reunião agendada / Qualificado': 'rm',
  'Reunião Realizada': 'rr',
  '1° Reunião Realizada - Apresentação': 'rr',
  'Enviar proposta': 'proposta',
  'Proposta enviada / Follow Up': 'proposta',
  'Ganho': 'venda',
  'Contrato assinado': 'venda',
};

// Parse Google Sheets date format "Date(year,month,day)" to JS Date
function parseGoogleDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  if (typeof dateValue === 'string') {
    const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
    // Try ISO format
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

// Parse numeric value, handling various formats
function parseNumericValue(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function useModeloAtualAnalytics(startDate: Date, endDate: Date) {
  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

  const { data, isLoading, error } = useQuery({
    queryKey: ['modelo-atual-analytics', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`[useModeloAtualAnalytics] Fetching HISTÓRICO DE FASES for period: ${startDateStr} to ${endDateStr}`);
      
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('read-sheet-tab', {
        body: { 
          sheetName: 'HISTÓRICO DE FASES', 
          maxRows: 50000,
          startDate: startDateStr,
          endDate: endDateStr,
          dateColumn: 'D', // Column D = "Entrada"
        }
      });

      if (fetchError) {
        console.error('Error fetching histórico de fases:', fetchError);
        throw fetchError;
      }

      if (!responseData?.success || !responseData?.data) {
        console.warn('No data returned from HISTÓRICO DE FASES sheet');
        return { cards: [] };
      }

      const cards: ModeloAtualCard[] = [];
      for (const row of responseData.data) {
        const cardId = row['ID do Card'] || row['ID Card'] || row['Card ID'] || row['id_card'] || '';
        const entrada = parseGoogleDate(row['Entrada'] || row['Data Entrada'] || row['Data']);
        const destino = row['Destino'] || row['Fase Destino'] || row['Para'] || '';
        
        if (!cardId || !entrada || !destino) continue;
        
        cards.push({
          id: String(cardId),
          titulo: row['Título'] || row['Titulo'] || row['Nome'] || '',
          empresa: row['Empresa'] || row['Organização'] || '',
          contato: row['Contato'] || row['Nome - Interlocução O2'] || '',
          fase: row['Fase'] || row['Origem'] || '',
          faseDestino: destino,
          dataEntrada: entrada,
          valorMRR: parseNumericValue(row['Valor MRR']),
          valorPontual: parseNumericValue(row['Valor Pontual']),
          valorEducacao: parseNumericValue(row['Valor Educação'] || row['Valor Educacao']),
          valorSetup: parseNumericValue(row['Valor Setup']),
          valor: 0,
          responsavel: row['Closer responsável'] || row['SDR responsável'] || row['Responsável'] || '',
          faixa: row['Faixa de faturamento mensal'] || row['Faixa'] || '',
        });
      }

      // Calculate total value for each card
      for (const card of cards) {
        card.valor = card.valorMRR + card.valorPontual + card.valorEducacao + card.valorSetup;
      }

      console.log(`[useModeloAtualAnalytics] Parsed ${cards.length} card movements from HISTÓRICO DE FASES`);
      
      return { cards };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const cards = data?.cards ?? [];

  // Filter cards by period
  const cardsInPeriod = useMemo(() => {
    return cards.filter(card => {
      const entryTime = card.dataEntrada.getTime();
      return entryTime >= startTime && entryTime <= endTime;
    });
  }, [cards, startTime, endTime]);

  // Get cards for a specific indicator
  const getCardsForIndicator = useMemo(() => {
    return (indicator: IndicatorType): ModeloAtualCard[] => {
      const uniqueCards = new Map<string, ModeloAtualCard>();
      
      for (const card of cardsInPeriod) {
        const cardIndicator = PHASE_TO_INDICATOR[card.faseDestino];
        
        if (cardIndicator === indicator) {
          // Keep most recent entry per card
          const existing = uniqueCards.get(card.id);
          if (!existing || card.dataEntrada > existing.dataEntrada) {
            uniqueCards.set(card.id, card);
          }
        }
      }
      
      return Array.from(uniqueCards.values());
    };
  }, [cardsInPeriod]);

  // Get cards for leads (special handling - uses different sheet)
  const getLeadsCards = useMemo(() => {
    // For leads, we don't have individual card data from "Leads Meta" sheet
    // Return empty array - leads drill-down needs different implementation
    return [];
  }, []);

  // Helper function to convert ModeloAtualCard to DetailItem
  const toDetailItem = (card: ModeloAtualCard): DetailItem => ({
    id: card.id,
    name: card.titulo || card.empresa || 'Sem título',
    company: card.empresa || card.contato || undefined,
    phase: card.faseDestino,
    date: card.dataEntrada.toISOString(),
    value: card.valor,
    revenueRange: card.faixa || undefined,
    responsible: card.responsavel || undefined,
  });

  // Get detail items for a specific indicator
  const getDetailItemsForIndicator = (indicator: IndicatorType): DetailItem[] => {
    if (indicator === 'leads') {
      // Leads don't have individual card data
      return [];
    }
    
    const indicatorCards = getCardsForIndicator(indicator);
    return indicatorCards.map(toDetailItem);
  };

  return {
    isLoading,
    error,
    cards: cardsInPeriod,
    getCardsForIndicator,
    getLeadsCards,
    toDetailItem,
    getDetailItemsForIndicator,
  };
}
