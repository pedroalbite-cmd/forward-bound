import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import pg from "npm:pg@8.13.1";
const { Client } = pg;

interface CountRow {
  total: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { table, action = 'preview', limit = 100, offset = 0 } = body;
    
    // Verify user is authenticated (any authenticated user can read expansão data)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.email} - Action: ${action}, Table: ${table}, Limit: ${limit}`);

    // Get external database credentials
    const host = Deno.env.get('EXTERNAL_PG_HOST');
    const port = Deno.env.get('EXTERNAL_PG_PORT');
    const database = Deno.env.get('EXTERNAL_PG_DATABASE');
    const dbUser = Deno.env.get('EXTERNAL_PG_USER');
    const password = Deno.env.get('EXTERNAL_PG_PASSWORD');

    if (!host || !port || !database || !dbUser || !password) {
      console.error('Missing external database credentials');
      return new Response(
        JSON.stringify({ error: 'External database credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Connecting to external database: ${host}:${port}/${database}`);

    // Connect to external PostgreSQL database
    const client = new Client({
      host: host,
      port: parseInt(port),
      database: database,
      user: dbUser,
      password: password,
      ssl: false,
    });

    await client.connect();
    console.log('Connected to external database successfully');

    let result: Record<string, unknown>;

    const validTables = ['pipefy_cards', 'pipefy_cards_expansao', 'pipefy_cards_movements', 'pipefy_cards_movements_expansao', 'pipefy_moviment_cfos', 'pipefy_central_projetos', 'pipefy_moviment_tratativas', 'pipefy_db_clientes', 'pipefy_db_pessoas', 'pipefy_moviment_nps', 'pipefy_moviment_setup', 'pipefy_moviment_rotinas', 'pipefy_card_connections'];

    const validateTable = async (tbl: string) => {
      if (!validTables.includes(tbl)) {
        await client.end();
        return new Response(
          JSON.stringify({ error: 'Invalid table name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return null;
    };

    if (action === 'schema') {
      const schemaQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `;
      const schemaResult = await client.query(schemaQuery, [table]);
      result = {
        action: 'schema',
        table,
        columns: schemaResult.rows,
      };
      console.log(`Schema for ${table}:`, result.columns);
    } else if (action === 'preview') {
      const invalid = await validateTable(table);
      if (invalid) return invalid;

      const dataQuery = `SELECT * FROM ${table} LIMIT $1`;
      const dataResult = await client.query(dataQuery, [limit]);
      
      const countQuery = `SELECT COUNT(*) as total FROM ${table}`;
      const countResult = await client.query(countQuery);
      
      result = {
        action: 'preview',
        table,
        totalRows: countResult.rows[0]?.total,
        previewRows: dataResult.rows.length,
        data: dataResult.rows,
      };
      console.log(`Preview for ${table}: ${result.previewRows} rows of ${result.totalRows} total`);
    } else if (action === 'count') {
      const invalid = await validateTable(table);
      if (invalid) return invalid;

      const countQuery = `SELECT COUNT(*) as total FROM ${table}`;
      const countResult = await client.query(countQuery);
      
      result = {
        action: 'count',
        table,
        totalRows: countResult.rows[0]?.total,
      };
      console.log(`Count for ${table}: ${result.totalRows}`);
    } else if (action === 'query_period') {
      const { startDate, endDate } = body;
      const invalid = await validateTable(table);
      if (invalid) return invalid;

      console.log(`Querying ${table} for period: ${startDate} to ${endDate}`);

      const dataQuery = `
        SELECT * FROM ${table} 
        WHERE "Entrada" >= $1::timestamp 
        AND "Entrada" <= $2::timestamp 
        ORDER BY "Entrada" DESC 
        LIMIT $3 OFFSET $4
      `;
      const dataResult = await client.query(dataQuery, [startDate, endDate, limit, offset]);
      
      const countQuery = `
        SELECT COUNT(*) as total FROM ${table} 
        WHERE "Entrada" >= $1::timestamp 
        AND "Entrada" <= $2::timestamp
      `;
      const countResult = await client.query(countQuery, [startDate, endDate]);
      
      result = {
        action: 'query_period',
        table,
        startDate,
        endDate,
        totalRows: countResult.rows[0]?.total,
        previewRows: dataResult.rows.length,
        data: dataResult.rows,
      };
      console.log(`Period query for ${table}: ${result.previewRows} rows of ${result.totalRows} total in period`);
    } else if (action === 'search') {
      const { searchTerm, searchColumn = 'Título' } = body;
      const invalid = await validateTable(table);
      if (invalid) return invalid;

      const allowedColumns = ['Título', 'ID', 'Empresa', 'Nome', 'Fase', 'Fase Atual', 'Campanha', 'Conjunto/grupo', 'Fonte', 'Origem do lead'];
      if (!allowedColumns.includes(searchColumn)) {
        await client.end();
        return new Response(
          JSON.stringify({ error: `Invalid search column. Allowed: ${allowedColumns.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Searching ${table} for term: ${searchTerm} in column: ${searchColumn}`);

      let searchQuery: string;
      let searchPattern: string;
      
      if (searchColumn === 'ID') {
        searchQuery = `
          SELECT * FROM ${table} 
          WHERE "ID" = $1
          ORDER BY "Entrada" DESC 
          LIMIT $2
        `;
        searchPattern = searchTerm;
      } else {
        searchQuery = `
          SELECT * FROM ${table} 
          WHERE "${searchColumn}" ILIKE $1
          ORDER BY "Entrada" DESC 
          LIMIT $2
        `;
        searchPattern = `%${searchTerm}%`;
      }
      
      const dataResult = await client.query(searchQuery, [searchPattern, limit]);
      
      result = {
        action: 'search',
        table,
        searchTerm,
        searchColumn,
        totalRows: dataResult.rows.length,
        data: dataResult.rows,
      };
      console.log(`Search for "${searchTerm}" in column "${searchColumn}" of ${table}: ${result.totalRows} rows found`);
    } else if (action === 'stats') {
      const invalid = await validateTable(table);
      if (invalid) return invalid;

      const statsQuery = `
        SELECT 
          COUNT(*) as total_rows,
          MIN("Entrada") as min_entrada,
          MAX("Entrada") as max_entrada,
          COUNT(CASE WHEN "Entrada" >= '2026-01-01' THEN 1 END) as count_2026
        FROM ${table}
      `;
      const statsResult = await client.query(statsQuery);
      
      result = {
        action: 'stats',
        table,
        stats: statsResult.rows[0],
      };
      console.log(`Stats for ${table}:`, result.stats);
    } else if (action === 'query_card_history') {
      const { cardIds } = body;
      
      if (!Array.isArray(cardIds) || cardIds.length === 0) {
        await client.end();
        return new Response(
          JSON.stringify({ error: 'cardIds array required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const invalid = await validateTable(table);
      if (invalid) return invalid;
      
      const limitedIds = cardIds.slice(0, 500);
      
      console.log(`Querying full history for ${limitedIds.length} card IDs in ${table}`);
      
      const placeholders = limitedIds.map((_: string, i: number) => `$${i + 1}`).join(', ');
      const dataQuery = `
        SELECT * FROM ${table} 
        WHERE "ID" IN (${placeholders})
        ORDER BY "Entrada" ASC
      `;
      
      const dataResult = await client.query(dataQuery, limitedIds);
      
      result = {
        action: 'query_card_history',
        table,
        cardIds: limitedIds,
        totalRows: dataResult.rows.length,
        data: dataResult.rows,
      };
      console.log(`Card history query: ${result.totalRows} total movements for ${limitedIds.length} cards`);
    } else if (action === 'query_period_by_signature') {
      const { startDate, endDate } = body;
      const invalid = await validateTable(table);
      if (invalid) return invalid;

      console.log(`Querying ${table} by signature date for period: ${startDate} to ${endDate}`);

      const dataQuery = `
        SELECT * FROM ${table} 
        WHERE "Data de assinatura do contrato" >= $1::timestamp 
        AND "Data de assinatura do contrato" <= $2::timestamp 
        ORDER BY "Data de assinatura do contrato" DESC 
        LIMIT $3 OFFSET $4
      `;
      const dataResult = await client.query(dataQuery, [startDate, endDate, limit, offset]);
      
      const countQuery = `
        SELECT COUNT(*) as total FROM ${table} 
        WHERE "Data de assinatura do contrato" >= $1::timestamp 
        AND "Data de assinatura do contrato" <= $2::timestamp
      `;
      const countResult = await client.query(countQuery, [startDate, endDate]);
      
      result = {
        action: 'query_period_by_signature',
        table,
        startDate,
        endDate,
        totalRows: countResult.rows[0]?.total,
        previewRows: dataResult.rows.length,
        data: dataResult.rows,
      };
      console.log(`Signature date query for ${table}: ${result.previewRows} rows of ${result.totalRows} total in period`);
    } else if (action === 'query_period_by_creation') {
      const { startDate, endDate } = body;
      const invalid = await validateTable(table);
      if (invalid) return invalid;

      console.log(`Querying ${table} by creation date for period: ${startDate} to ${endDate}`);

      const dataQuery = `
        SELECT * FROM ${table} 
        WHERE "Data Criação" >= $1::timestamp 
        AND "Data Criação" <= $2::timestamp 
        ORDER BY "Data Criação" DESC 
        LIMIT $3 OFFSET $4
      `;
      const dataResult = await client.query(dataQuery, [startDate, endDate, limit, offset]);
      
      const countQuery = `
        SELECT COUNT(*) as total FROM ${table} 
        WHERE "Data Criação" >= $1::timestamp 
        AND "Data Criação" <= $2::timestamp
      `;
      const countResult = await client.query(countQuery, [startDate, endDate]);
      
      result = {
        action: 'query_period_by_creation',
        table,
        startDate,
        endDate,
        totalRows: countResult.rows[0]?.total,
        previewRows: dataResult.rows.length,
        data: dataResult.rows,
      };
      console.log(`Creation date query for ${table}: ${result.previewRows} rows of ${result.totalRows} total in period`);
    } else if (action === 'mql_diagnosis') {
      const { startDate, endDate } = body;
      const invalid = await validateTable(table);
      if (invalid) return invalid;

      console.log(`MQL diagnosis for ${table}: ${startDate} to ${endDate}`);

      // Get unique cards with qualifying faixas, their loss reasons, and title
      const dataQuery = `
        WITH card_data AS (
          SELECT "ID",
                 MAX("Título") as titulo,
                 array_agg(DISTINCT "Faixa de faturamento mensal") FILTER (WHERE "Faixa de faturamento mensal" IS NOT NULL) as faixas,
                 array_agg(DISTINCT "Motivo da perda") FILTER (WHERE "Motivo da perda" IS NOT NULL) as motivos_perda,
                 MAX("Fase Atual") as fase_atual
          FROM ${table}
          WHERE "Data Criação" >= $1::timestamp
          AND "Data Criação" <= $2::timestamp
          GROUP BY "ID"
        )
        SELECT *,
          CASE WHEN faixas && ARRAY[
            'Entre R$ 200 mil e R$ 350 mil',
            'Entre R$ 350 mil e R$ 500 mil',
            'Entre R$ 500 mil e R$ 1 milhão',
            'Entre R$ 1 milhão e R$ 5 milhões',
            'Acima de R$ 5 milhões'
          ] THEN true ELSE false END as is_qualified
        FROM card_data
      `;
      const dataResult = await client.query(dataQuery, [startDate, endDate]);

      // Separate qualified vs not
      const qualified = dataResult.rows.filter((r: Record<string, unknown>) => r.is_qualified);
      const notQualified = dataResult.rows.filter((r: Record<string, unknown>) => !r.is_qualified);

      result = {
        action: 'mql_diagnosis',
        table,
        startDate,
        endDate,
        totalUniqueCards: dataResult.rows.length,
        qualifiedCount: qualified.length,
        notQualifiedCount: notQualified.length,
        qualified: qualified.map((r: Record<string, unknown>) => ({
          id: r["ID"],
          titulo: r.titulo,
          faixas: r.faixas,
          motivos_perda: r.motivos_perda,
          fase_atual: r.fase_atual,
        })),
      };
      console.log(`MQL diagnosis: ${result.totalUniqueCards} total, ${result.qualifiedCount} qualified`);
    } else {
      await client.end();
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use: schema, preview, count, query_period, query_period_by_creation, query_period_by_signature, search, stats, query_card_history, or mql_diagnosis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await client.end();
    console.log('Disconnected from external database');

    // Handle BigInt serialization
    const jsonString = JSON.stringify(result, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );

    return new Response(
      jsonString,
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in query-external-db:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
