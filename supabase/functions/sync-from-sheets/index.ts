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
  
  // Fases de MQL
  'mql': 'mql',
  'qualificado': 'mql',
  'qualified': 'mql',
  
  // Fases de RM (Reunião Marcada)
  'rm': 'rm',
  'reunião marcada': 'rm',
  'meeting scheduled': 'rm',
  'agendamento': 'rm',
  
  // Fases de RR (Reunião Realizada)
  'rr': 'rr',
  'reunião realizada': 'rr',
  'meeting done': 'rr',
  'diagnóstico': 'rr',
  
  // Fases de Proposta
  'proposta': 'proposta',
  'proposal': 'proposta',
  'proposta enviada': 'proposta',
  'negociação': 'proposta',
  
  // Fases de Venda
  'venda': 'venda',
  'sale': 'venda',
  'ganho': 'venda',
  'won': 'venda',
  'fechado': 'venda',
  'closed won': 'venda',
  'assinatura': 'venda',
};

// Mapeamento de BU (Business Unit)
const BU_MAPPING: Record<string, string> = {
  'modelo_atual': 'modelo_atual',
  'modelo atual': 'modelo_atual',
  'atual': 'modelo_atual',
  'o2_tax': 'o2_tax',
  'o2 tax': 'o2_tax',
  'o2tax': 'o2_tax',
  'tax': 'o2_tax',
  'expansao': 'expansao',
  'expansão': 'expansao',
  'exp': 'expansao',
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
  const normalized = phase.toLowerCase().trim();
  return PHASE_TO_INDICATOR[normalized] || null;
}

// Normalize BU from pipe/bu name
function normalizeBU(bu: string): string | null {
  const normalized = bu.toLowerCase().trim();
  return BU_MAPPING[normalized] || null;
}

// Parse date from various formats
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try ISO format
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // Try DD/MM/YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    date = new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try Google Sheets date (days since epoch)
  if (typeof dateStr === 'number' || !isNaN(Number(dateStr))) {
    const days = Number(dateStr);
    // Google Sheets epoch is December 30, 1899
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
    // Sheet must be shared as "Anyone with the link can view"
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process rows into funnel records
    // Expected columns: Pipe | Card ID | Data Criação | Fase Atual | Faturamento | Produto | Data Assinatura
    // Skip first row (header)
    const dataRows = rows.slice(1);
    
    const records: any[] = [];
    const errors: string[] = [];
    let skippedCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.length < 4) {
        skippedCount++;
        continue;
      }

      const [pipe, cardId, dataCriacao, faseAtual, faturamento, produto, dataAssinatura] = row;

      // Parse creation date
      const createdDate = parseDate(dataCriacao);
      if (!createdDate) {
        skippedCount++;
        continue;
      }

      // Filter by year
      if (createdDate.getFullYear() !== year) {
        skippedCount++;
        continue;
      }

      // Normalize BU
      const bu = normalizeBU(pipe);
      if (!bu) {
        errors.push(`Row ${i + 2}: BU não reconhecida: "${pipe}"`);
        skippedCount++;
        continue;
      }

      // Normalize indicator from phase
      const indicator = normalizeIndicator(faseAtual);
      if (!indicator) {
        // Log unknown phases for debugging
        console.log(`Row ${i + 2}: Fase desconhecida: "${faseAtual}"`);
        skippedCount++;
        continue;
      }

      const dateStr = createdDate.toISOString().split('T')[0];
      const month = createdDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();

      records.push({
        bu,
        month,
        year,
        indicator,
        value: 1, // Each card is 1 unit
        date: dateStr,
      });
    }

    console.log(`Processed ${records.length} valid records, skipped ${skippedCount}`);
    if (errors.length > 0) {
      console.log(`Errors (first 10): ${errors.slice(0, 10).join('; ')}`);
    }

    if (records.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Nenhum registro válido para ${year}`,
          insertedCount: 0,
          skippedCount,
          errors: errors.slice(0, 10)
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
        skippedCount,
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
