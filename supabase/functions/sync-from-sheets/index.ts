import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de fases do Pipefy para indicadores do funil
const PHASE_TO_INDICATOR: Record<string, string> = {
  // Fases de Lead
  'lead': 'leads',
  'leads': 'leads',
  'novo lead': 'leads',
  'new lead': 'leads',
  'entrada': 'leads',
  'inbox': 'leads',
  'caixa de entrada': 'leads',
  'start form': 'leads',
  'início': 'leads',
  'novo': 'leads',
  
  // Fases de MQL (Marketing Qualified Lead)
  'mql': 'mql',
  'qualificado': 'mql',
  'qualified': 'mql',
  'qualificação': 'mql',
  'pré-qualificação': 'mql',
  'pré qualificação': 'mql',
  'em qualificação': 'mql',
  'lead qualificado': 'mql',
  'fit identificado': 'mql',
  'análise': 'mql',
  'triagem': 'mql',
  
  // Fases de RM (Reunião Marcada)
  'rm': 'rm',
  'reunião marcada': 'rm',
  'meeting scheduled': 'rm',
  'agendamento': 'rm',
  'agendado': 'rm',
  'reunião agendada': 'rm',
  'agendar reunião': 'rm',
  'contato': 'rm',
  'contato realizado': 'rm',
  'em contato': 'rm',
  
  // Fases de RR (Reunião Realizada)
  'rr': 'rr',
  'reunião realizada': 'rr',
  'meeting done': 'rr',
  'diagnóstico': 'rr',
  'diagnóstico realizado': 'rr',
  'discovery': 'rr',
  'entendimento': 'rr',
  'levantamento': 'rr',
  'análise de negócio': 'rr',
  'reunião feita': 'rr',
  
  // Fases de Proposta
  'proposta': 'proposta',
  'proposal': 'proposta',
  'proposta enviada': 'proposta',
  'negociação': 'proposta',
  'em negociação': 'proposta',
  'proposta apresentada': 'proposta',
  'aguardando retorno': 'proposta',
  'follow up': 'proposta',
  'follow-up': 'proposta',
  'apresentação': 'proposta',
  'orçamento': 'proposta',
  'orçamento enviado': 'proposta',
  
  // Fases de Venda
  'venda': 'venda',
  'sale': 'venda',
  'ganho': 'venda',
  'won': 'venda',
  'fechado': 'venda',
  'closed won': 'venda',
  'assinatura': 'venda',
  'contrato assinado': 'venda',
  'cliente': 'venda',
  'onboarding': 'venda',
  'implantação': 'venda',
  'sucesso': 'venda',
  'concluído': 'venda',
  'finalizado': 'venda',
};

// Mapeamento de BU (Business Unit) - expandido com nomes de pipes comuns
const BU_MAPPING: Record<string, string> = {
  // Modelo Atual
  'modelo_atual': 'modelo_atual',
  'modelo atual': 'modelo_atual',
  'atual': 'modelo_atual',
  'comercial modelo atual': 'modelo_atual',
  'pipe modelo atual': 'modelo_atual',
  'vendas modelo atual': 'modelo_atual',
  'ma': 'modelo_atual',
  
  // O2 Tax
  'o2_tax': 'o2_tax',
  'o2 tax': 'o2_tax',
  'o2tax': 'o2_tax',
  'tax': 'o2_tax',
  'pipe o2 tax': 'o2_tax',
  'comercial o2 tax': 'o2_tax',
  'vendas o2 tax': 'o2_tax',
  'o2': 'o2_tax',
  
  // Expansão
  'expansao': 'expansao',
  'expansão': 'expansao',
  'exp': 'expansao',
  'pipe expansão': 'expansao',
  'pipe expansao': 'expansao',
  'comercial expansão': 'expansao',
  'comercial expansao': 'expansao',
  'vendas expansão': 'expansao',
  'vendas expansao': 'expansao',
  'upsell': 'expansao',
  'cross sell': 'expansao',
  'cross-sell': 'expansao',
};

interface SheetRow {
  pipe: string;
  cardId: string;
  dataCriacao: string;
  faseAtual: string;
  faturamento?: number;
  produto?: string;
  dataAssinatura?: string;
}

interface DebugStats {
  totalRows: number;
  rowsWithInsufficientCols: number;
  rowsWithInvalidDate: number;
  rowsWithWrongYear: number;
  rowsWithUnknownBU: number;
  rowsWithUnknownPhase: number;
  validRows: number;
  unknownBUs: Record<string, number>;
  unknownPhases: Record<string, number>;
  yearsFound: Record<number, number>;
  sampleRows: any[];
}

// Parse Google Sheets JSON response
function parseGoogleSheetsResponse(text: string): any[][] {
  // Google Sheets returns JSONP-like response, need to extract JSON
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/);
  if (!jsonMatch) {
    // Try direct JSON parse if it's already clean JSON
    try {
      const data = JSON.parse(text);
      return data.table?.rows?.map((row: any) => row.c?.map((cell: any) => cell?.v)) || [];
    } catch {
      throw new Error('Formato de resposta inválido do Google Sheets');
    }
  }
  
  const jsonData = JSON.parse(jsonMatch[1]);
  const rows = jsonData.table?.rows || [];
  
  return rows.map((row: any) => {
    return row.c?.map((cell: any) => {
      if (cell === null) return null;
      return cell.v;
    }) || [];
  });
}

// Normalize indicator from phase name
function normalizeIndicator(phase: string): string | null {
  if (!phase) return null;
  const normalized = phase.toLowerCase().trim();
  return PHASE_TO_INDICATOR[normalized] || null;
}

// Normalize BU from pipe/bu name
function normalizeBU(bu: string): string | null {
  if (!bu) return null;
  const normalized = bu.toLowerCase().trim();
  return BU_MAPPING[normalized] || null;
}

// Parse date from various formats
function parseDate(dateStr: string | number | Date): Date | null {
  if (!dateStr) return null;
  
  // If it's already a Date object (from Google Sheets)
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr;
  }
  
  // If it's a number (Google Sheets serial date)
  if (typeof dateStr === 'number') {
    // Google Sheets epoch is December 30, 1899
    const date = new Date(1899, 11, 30);
    date.setDate(date.getDate() + dateStr);
    return isNaN(date.getTime()) ? null : date;
  }
  
  const str = String(dateStr).trim();
  
  // Try ISO format
  let date = new Date(str);
  if (!isNaN(date.getTime())) return date;
  
  // Try DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    date = new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try Google Sheets date string format "Date(year,month,day)"
  const dateMatch = str.match(/Date\((\d+),(\d+),(\d+)\)/);
  if (dateMatch) {
    date = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]), parseInt(dateMatch[3]));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try numeric string
  if (!isNaN(Number(str))) {
    const days = Number(str);
    date = new Date(1899, 11, 30);
    date.setDate(date.getDate() + days);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Starting sync from Google Sheets ===');

  try {
    const { year } = await req.json().catch(() => ({ year: new Date().getFullYear() }));
    console.log(`Target year: ${year}`);

    // Get Sheet ID from environment
    const sheetId = Deno.env.get('GOOGLE_SHEET_ID');
    if (!sheetId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'GOOGLE_SHEET_ID não configurado. Por favor, configure o secret com o ID da planilha.',
          howTo: 'Vá em Configurações > Secrets e adicione GOOGLE_SHEET_ID com o valor do ID da sua planilha (parte da URL: docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit)'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch data from Google Sheets using public export URL
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    console.log(`Fetching from: ${sheetUrl}`);

    const startTime = Date.now();
    const response = await fetch(sheetUrl);
    
    if (!response.ok) {
      throw new Error(`Falha ao acessar planilha: ${response.status} ${response.statusText}. Verifique se a planilha está compartilhada como "Qualquer pessoa com o link pode ver".`);
    }

    const text = await response.text();
    const fetchTime = Date.now() - startTime;
    console.log(`Sheet fetched in ${fetchTime}ms`);

    // Parse the response
    const rows = parseGoogleSheetsResponse(text);
    console.log(`Parsed ${rows.length} rows from sheet`);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Planilha vazia ou sem dados',
          insertedCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log first row (headers) and sample data rows for debugging
    console.log('=== DEBUG: Column headers ===');
    console.log('Headers:', JSON.stringify(rows[0]));
    
    console.log('=== DEBUG: Sample data rows (first 5) ===');
    for (let i = 1; i <= Math.min(5, rows.length - 1); i++) {
      console.log(`Row ${i}:`, JSON.stringify(rows[i]));
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process rows into funnel records
    // Expected columns: Pipe | Card ID | Data Criação | Fase Atual | Faturamento | Produto | Data Assinatura
    // Skip first row (header)
    const dataRows = rows.slice(1);
    
    // Initialize debug stats
    const debugStats: DebugStats = {
      totalRows: dataRows.length,
      rowsWithInsufficientCols: 0,
      rowsWithInvalidDate: 0,
      rowsWithWrongYear: 0,
      rowsWithUnknownBU: 0,
      rowsWithUnknownPhase: 0,
      validRows: 0,
      unknownBUs: {},
      unknownPhases: {},
      yearsFound: {},
      sampleRows: [],
    };

    // Collect sample rows for debug output
    for (let i = 0; i < Math.min(5, dataRows.length); i++) {
      const row = dataRows[i];
      if (row && row.length >= 4) {
        debugStats.sampleRows.push({
          index: i + 2,
          pipe: row[0],
          cardId: row[1],
          dataCriacao: row[2],
          faseAtual: row[3],
        });
      }
    }

    const records: any[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.length < 4) {
        debugStats.rowsWithInsufficientCols++;
        continue;
      }

      const [pipe, cardId, dataCriacao, faseAtual, faturamento, produto, dataAssinatura] = row;

      // Parse creation date
      const createdDate = parseDate(dataCriacao);
      if (!createdDate) {
        debugStats.rowsWithInvalidDate++;
        if (i < 10) {
          console.log(`Row ${i + 2}: Invalid date: "${dataCriacao}" (type: ${typeof dataCriacao})`);
        }
        continue;
      }

      // Track years found
      const rowYear = createdDate.getFullYear();
      debugStats.yearsFound[rowYear] = (debugStats.yearsFound[rowYear] || 0) + 1;

      // Filter by year
      if (rowYear !== year) {
        debugStats.rowsWithWrongYear++;
        continue;
      }

      // Normalize BU
      const bu = normalizeBU(pipe);
      if (!bu) {
        debugStats.rowsWithUnknownBU++;
        const pipeStr = String(pipe || '').toLowerCase().trim();
        debugStats.unknownBUs[pipeStr] = (debugStats.unknownBUs[pipeStr] || 0) + 1;
        continue;
      }

      // Normalize indicator from phase
      const indicator = normalizeIndicator(faseAtual);
      if (!indicator) {
        debugStats.rowsWithUnknownPhase++;
        const phaseStr = String(faseAtual || '').toLowerCase().trim();
        debugStats.unknownPhases[phaseStr] = (debugStats.unknownPhases[phaseStr] || 0) + 1;
        continue;
      }

      debugStats.validRows++;

      const dateStr = createdDate.toISOString().split('T')[0];
      const month = createdDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();

      records.push({
        bu,
        month,
        year,
        indicator,
        value: 1,
        date: dateStr,
      });
    }

    // Log detailed debug stats
    console.log('=== DEBUG: Processing Statistics ===');
    console.log(`Total data rows: ${debugStats.totalRows}`);
    console.log(`Rows with insufficient columns: ${debugStats.rowsWithInsufficientCols}`);
    console.log(`Rows with invalid date: ${debugStats.rowsWithInvalidDate}`);
    console.log(`Rows with wrong year (not ${year}): ${debugStats.rowsWithWrongYear}`);
    console.log(`Rows with unknown BU: ${debugStats.rowsWithUnknownBU}`);
    console.log(`Rows with unknown phase: ${debugStats.rowsWithUnknownPhase}`);
    console.log(`Valid rows: ${debugStats.validRows}`);
    
    console.log('=== DEBUG: Years found in data ===');
    console.log(JSON.stringify(debugStats.yearsFound));
    
    // Log top unknown BUs
    const topUnknownBUs = Object.entries(debugStats.unknownBUs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log('=== DEBUG: Top unknown BUs ===');
    console.log(JSON.stringify(topUnknownBUs));
    
    // Log top unknown phases
    const topUnknownPhases = Object.entries(debugStats.unknownPhases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log('=== DEBUG: Top unknown phases ===');
    console.log(JSON.stringify(topUnknownPhases));

    console.log(`Processed ${records.length} valid records`);

    if (records.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Nenhum registro válido para ${year}`,
          debug: {
            totalRows: debugStats.totalRows,
            yearsFound: debugStats.yearsFound,
            rowsWithWrongYear: debugStats.rowsWithWrongYear,
            rowsWithUnknownBU: debugStats.rowsWithUnknownBU,
            rowsWithUnknownPhase: debugStats.rowsWithUnknownPhase,
            rowsWithInvalidDate: debugStats.rowsWithInvalidDate,
            topUnknownBUs: topUnknownBUs,
            topUnknownPhases: topUnknownPhases,
            sampleRows: debugStats.sampleRows,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate records by bu + date + indicator
    const aggregatedMap = new Map<string, any>();
    for (const record of records) {
      const key = `${record.bu}|${record.date}|${record.indicator}`;
      if (aggregatedMap.has(key)) {
        aggregatedMap.get(key).value += record.value;
      } else {
        aggregatedMap.set(key, { ...record });
      }
    }

    const aggregatedRecords = Array.from(aggregatedMap.values());
    console.log(`Aggregated to ${aggregatedRecords.length} unique records`);

    // Delete existing records for this year before inserting
    const { error: deleteError } = await supabase
      .from('funnel_realized')
      .delete()
      .eq('year', year);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw new Error(`Erro ao limpar dados existentes: ${deleteError.message}`);
    }

    // Insert in batches
    const BATCH_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < aggregatedRecords.length; i += BATCH_SIZE) {
      const batch = aggregatedRecords.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from('funnel_realized')
        .insert(batch);

      if (insertError) {
        console.error(`Insert error at batch ${i / BATCH_SIZE}:`, insertError);
        throw new Error(`Erro ao inserir dados: ${insertError.message}`);
      }

      insertedCount += batch.length;
    }

    const totalTime = Date.now() - startTime;
    console.log(`=== Sync completed in ${totalTime}ms ===`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronizado com sucesso!`,
        year,
        insertedCount,
        totalRecords: records.length,
        debug: {
          yearsFound: debugStats.yearsFound,
          topUnknownBUs: topUnknownBUs.length > 0 ? topUnknownBUs : undefined,
          topUnknownPhases: topUnknownPhases.length > 0 ? topUnknownPhases : undefined,
        },
        timeMs: totalTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
