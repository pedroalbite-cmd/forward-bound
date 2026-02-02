import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Marketing sheet configuration
const MARKETING_SHEET_ID = '1O27qvdplGeRGmnueUJOwk1FPN83hiUUf3-SZbR9x4ig';
const MARKETING_TAB_NAME = 'Indicadores 26';

// Month mapping for column indices (B=1, C=2, etc.)
const MONTH_COLUMNS: Record<string, number> = {
  'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
  'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
};

// Metric name mappings (normalized → original variations)
const METRIC_MAPPINGS: Record<string, string[]> = {
  'midiaGoogle': ['Mídia Google Ads', 'Mídia - Google Ads', 'Google Ads - Mídia', 'Mídia Google', 'Google Ads Mídia'],
  'leadsGoogle': ['Leads - Google Ads', 'Google Ads - Leads', 'Leads Google Ads', 'Leads Google'],
  'cplGoogle': ['CPL - Google Ads', 'Google Ads - CPL', 'CPL Google Ads', 'CPL Google'],
  'midiaMeta': ['Mídia Meta Ads', 'Mídia - Meta Ads', 'Meta Ads - Mídia', 'Mídia Meta', 'Meta Ads Mídia'],
  'leadsMeta': ['Leads - Meta Ads', 'Meta Ads - Leads', 'Leads Meta Ads', 'Leads Meta', 'Leads - Meta', 'Lead Meta Ads', 'Leads -  Meta Ads'],
  'cplMeta': ['CPL - Meta Ads', 'Meta Ads - CPL', 'CPL Meta Ads', 'CPL Meta'],
  'midiaTotal': ['Mídia total', 'Mídia Total', 'Total Mídia', 'Mídia Totais', 'Total Mídia Ads'],
  'leadsTotais': ['Leads totais', 'Leads Totais', 'Total Leads', 'Total de Leads'],
  'cplTotal': ['CPL total', 'CPL Total', 'Total CPL', 'CPL Totais'],
  'mqlPorFaturamento': ['MQL por Faturamento', 'MQL - Faturamento', 'MQLs', 'MQL Faturamento', 'MQLs por Faturamento'],
  'cpmqlPorFaturamento': ['CPMQL por Faturamento', 'CPMQL', 'CPMql', 'CPMQL Faturamento', 'CP MQL'],
  'reuniaoMarcada': ['Reunião marcada', 'Reunião Marcada', 'RM', 'Reuniões Marcadas', 'Reuniao Marcada'],
  'cprm': ['CPRM', 'CPRm', 'Custo por RM', 'CP RM', 'Custo RM'],
  'reuniaoRealizada': ['Reunião realizada', 'Reunião Realizada', 'RR', 'Reuniões Realizadas', 'Reuniao Realizada'],
  'cprr': ['CPRR', 'CPRr', 'Custo por RR', 'CP RR', 'Custo RR'],
  'propostaEnviada': ['Proposta enviada', 'Proposta Enviada', 'Propostas', 'Propostas Enviadas', 'Proposta'],
  'cpp': ['CPP', 'Custo por Proposta', 'CP Proposta', 'Custo Proposta', 'CP P'],
  'vendas': ['Vendas', 'Venda', 'Total Vendas', 'Vendas Totais'],
  'cpv': ['CPV', 'Custo por Venda', 'CP Venda', 'Custo Venda'],
  'mrr': ['MRR', 'Mrr', 'Monthly Recurring Revenue', 'Receita Recorrente'],
  'setup': ['Setup', 'SETUP', 'Valor Setup', 'Taxa Setup'],
  'pontual': ['Pontual', 'PONTUAL', 'Receita Pontual', 'Valor Pontual'],
  'educacao': ['Educação', 'EDUCAÇÃO', 'Educacao', 'Educ', 'Receita Educação', 'Education'],
  'gmv': ['GMV', 'Gmv', 'Receita Total', 'Receita Bruta', 'Gross Merchandise Value', 'Total GMV', 'Total Receita', 'GMV (Gross Merchandise Value)'],
  'cac': ['CAC', 'Cac', 'Custo Aquisição Cliente', 'Customer Acquisition Cost'],
  'ltv': ['LTV', 'Ltv', 'Lifetime Value', 'Valor Vitalício'],
  'tcv': ['TCV', 'Tcv', 'Total Contract Value', 'Valor Total Contrato', 'Ticket Total', 'TCV (Total Contract Value)'],
  'roas': ['ROAS', 'Roas', 'Return on Ad Spend'],
  'roasLtv': ['ROAS LTV', 'ROAS Ltv', 'Roas LTV', 'ROAS x LTV'],
  'roiLtv': ['ROI LTV', 'ROI Ltv', 'Roi LTV', 'ROI x LTV'],
  'ltvCac': ['LTV/CAC', 'LTV / CAC', 'Ltv/Cac', 'LTV:CAC', 'LTV CAC'],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findMetricKey(rowLabel: string): string | null {
  const normalizedLabel = normalizeText(rowLabel);
  
  for (const [key, variations] of Object.entries(METRIC_MAPPINGS)) {
    for (const variation of variations) {
      if (normalizeText(variation) === normalizedLabel) {
        return key;
      }
    }
  }
  return null;
}

function parseNumericValue(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    // Remove currency symbols, dots as thousands separators, and convert comma to dot
    const cleaned = value
      .replace(/R\$\s*/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getMonthIndicesForPeriod(startDate: string, endDate: string): number[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const indices: number[] = [];
  
  // IMPORTANTE: A planilha "Indicadores 26" tem rótulos errados (25 = 2025)
  // mas os dados são de 2026. Colunas B-M = Jan-Dec 2026
  const startMonth = start.getMonth(); // 0-11
  const endMonth = end.getMonth(); // 0-11
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  
  for (let year = startYear; year <= endYear; year++) {
    const fromMonth = year === startYear ? startMonth : 0;
    const toMonth = year === endYear ? endMonth : 11;
    
    for (let month = fromMonth; month <= toMonth; month++) {
      // Colunas B-M (índices 1-12) = dados de 2026
      // Ignorar anos diferentes de 2026 por enquanto
      if (year === 2026) {
        indices.push(month + 1); // +1 porque coluna A é o label
      }
    }
  }
  
  return indices;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    console.log('Fetching marketing sheet data:', { startDate, endDate });
    
    // Build Google Visualization API URL
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${MARKETING_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MARKETING_TAB_NAME)}`;
    
    console.log('Fetching from URL:', sheetUrl);
    
    const response = await fetch(sheetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Google Visualization API returns JSONP, extract JSON
    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Google Sheets');
    }
    
    const jsonData = JSON.parse(jsonMatch[1]);
    
    if (!jsonData.table || !jsonData.table.rows) {
      throw new Error('No data found in sheet');
    }
    
    const rows = jsonData.table.rows;
    const monthIndices = startDate && endDate 
      ? getMonthIndicesForPeriod(startDate, endDate)
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Default to full year
    
    console.log('Month indices for period:', monthIndices);
    
    // Parse rows and aggregate values
    const metrics: Record<string, number> = {};
    const unmappedLabels: string[] = [];
    
    for (const row of rows) {
      if (!row.c || !row.c[0]) continue;
      
      const label = row.c[0].v;
      if (typeof label !== 'string') continue;
      
      const metricKey = findMetricKey(label);
      
      // Track unmapped labels for debugging
      if (!metricKey && label.trim() !== '') {
        unmappedLabels.push(label);
        continue;
      }
      
      if (!metricKey) continue;
      
      // Sum values for selected months
      let sum = 0;
      for (const colIndex of monthIndices) {
        if (row.c[colIndex] && row.c[colIndex].v !== null) {
          sum += parseNumericValue(row.c[colIndex].v);
        }
      }
      
      // For rate/ratio metrics, calculate average instead of sum
      const isRatio = ['cplGoogle', 'cplMeta', 'cplTotal', 'cpmqlPorFaturamento', 'cprm', 'cprr', 'cpp', 'cpv', 'cac', 'ltv', 'tcv', 'roas', 'roasLtv', 'roiLtv', 'ltvCac'].includes(metricKey);
      
      if (isRatio && monthIndices.length > 1) {
        metrics[metricKey] = sum;
      } else {
        metrics[metricKey] = sum;
      }
    }
    
    // Log unmapped labels for debugging
    if (unmappedLabels.length > 0) {
      console.log('Unmapped labels found:', unmappedLabels.slice(0, 20));
    }
    
    console.log('Parsed metrics:', Object.keys(metrics).length, 'metrics found');
    
    // Return structured data
    const result = {
      // Channel data
      midiaGoogle: metrics.midiaGoogle || 0,
      leadsGoogle: metrics.leadsGoogle || 0,
      cplGoogle: metrics.cplGoogle || 0,
      midiaMeta: metrics.midiaMeta || 0,
      leadsMeta: metrics.leadsMeta || 0,
      cplMeta: metrics.cplMeta || 0,
      
      // Totals
      midiaTotal: metrics.midiaTotal || 0,
      leadsTotais: metrics.leadsTotais || 0,
      cplTotal: metrics.cplTotal || 0,
      
      // Funnel
      mqlPorFaturamento: metrics.mqlPorFaturamento || 0,
      cpmqlPorFaturamento: metrics.cpmqlPorFaturamento || 0,
      reuniaoMarcada: metrics.reuniaoMarcada || 0,
      cprm: metrics.cprm || 0,
      reuniaoRealizada: metrics.reuniaoRealizada || 0,
      cprr: metrics.cprr || 0,
      propostaEnviada: metrics.propostaEnviada || 0,
      cpp: metrics.cpp || 0,
      vendas: metrics.vendas || 0,
      cpv: metrics.cpv || 0,
      
      // Revenue
      mrr: metrics.mrr || 0,
      setup: metrics.setup || 0,
      pontual: metrics.pontual || 0,
      educacao: metrics.educacao || 0,
      gmv: metrics.gmv || 0,
      
      // Performance
      cac: metrics.cac || 0,
      ltv: metrics.ltv || 0,
      tcv: metrics.tcv || 0,
      roas: metrics.roas || 0,
      roasLtv: metrics.roasLtv || 0,
      roiLtv: metrics.roiLtv || 0,
      ltvCac: metrics.ltvCac || 0,
      
      // Meta
      period: { startDate, endDate },
      monthsIncluded: monthIndices.length,
    };
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching marketing sheet:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
