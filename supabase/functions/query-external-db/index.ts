import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

interface CountRow {
  total: number;
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
    const { table, action = 'preview', limit = 100 } = body;
    
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
      hostname: host,
      port: parseInt(port),
      database: database,
      user: dbUser,
      password: password,
      tls: { enabled: false },
    });

    await client.connect();
    console.log('Connected to external database successfully');

    let result: Record<string, unknown>;

    if (action === 'schema') {
      // Get table schema (columns and types)
      const schemaQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `;
      const schemaResult = await client.queryObject(schemaQuery, [table]);
      result = {
        action: 'schema',
        table,
        columns: schemaResult.rows,
      };
      console.log(`Schema for ${table}:`, result.columns);
    } else if (action === 'preview') {
      // Get sample data
      const validTables = ['pipefy_cards', 'pipefy_cards_expansao', 'pipefy_cards_movements', 'pipefy_cards_movements_expansao', 'pipefy_moviment_cfos'];
      if (!validTables.includes(table)) {
        await client.end();
        return new Response(
          JSON.stringify({ error: 'Invalid table name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const dataQuery = `SELECT * FROM ${table} LIMIT $1`;
      const dataResult = await client.queryObject(dataQuery, [limit]);
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${table}`;
      const countResult = await client.queryObject<CountRow>(countQuery);
      
      result = {
        action: 'preview',
        table,
        totalRows: countResult.rows[0]?.total,
        previewRows: dataResult.rows.length,
        data: dataResult.rows,
      };
      console.log(`Preview for ${table}: ${result.previewRows} rows of ${result.totalRows} total`);
    } else if (action === 'count') {
      // Just get count
      const validTables = ['pipefy_cards', 'pipefy_cards_expansao', 'pipefy_cards_movements', 'pipefy_cards_movements_expansao', 'pipefy_moviment_cfos'];
      if (!validTables.includes(table)) {
        await client.end();
        return new Response(
          JSON.stringify({ error: 'Invalid table name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const countQuery = `SELECT COUNT(*) as total FROM ${table}`;
      const countResult = await client.queryObject<CountRow>(countQuery);
      
      result = {
        action: 'count',
        table,
        totalRows: countResult.rows[0]?.total,
      };
      console.log(`Count for ${table}: ${result.totalRows}`);
    } else if (action === 'query_period') {
      // Query with date filtering for Modelo Atual
      const { startDate, endDate } = body;
      
      const validTables = ['pipefy_cards', 'pipefy_cards_expansao', 'pipefy_cards_movements', 'pipefy_cards_movements_expansao', 'pipefy_moviment_cfos'];
      if (!validTables.includes(table)) {
        await client.end();
        return new Response(
          JSON.stringify({ error: 'Invalid table name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Querying ${table} for period: ${startDate} to ${endDate}`);

      // Query with date filter and ordering by most recent first
      const dataQuery = `
        SELECT * FROM ${table} 
        WHERE "Entrada" >= $1::timestamp 
        AND "Entrada" <= $2::timestamp 
        ORDER BY "Entrada" DESC 
        LIMIT $3
      `;
      const dataResult = await client.queryObject(dataQuery, [startDate, endDate, limit]);
      
      // Count in period
      const countQuery = `
        SELECT COUNT(*) as total FROM ${table} 
        WHERE "Entrada" >= $1::timestamp 
        AND "Entrada" <= $2::timestamp
      `;
      const countResult = await client.queryObject<CountRow>(countQuery, [startDate, endDate]);
      
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
    } else if (action === 'stats') {
      // Get table statistics for diagnostics
      const validTables = ['pipefy_cards', 'pipefy_cards_expansao', 'pipefy_cards_movements', 'pipefy_cards_movements_expansao', 'pipefy_moviment_cfos'];
      if (!validTables.includes(table)) {
        await client.end();
        return new Response(
          JSON.stringify({ error: 'Invalid table name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_rows,
          MIN("Entrada") as min_entrada,
          MAX("Entrada") as max_entrada,
          COUNT(CASE WHEN "Entrada" >= '2026-01-01' THEN 1 END) as count_2026
        FROM ${table}
      `;
      const statsResult = await client.queryObject(statsQuery);
      
      result = {
        action: 'stats',
        table,
        stats: statsResult.rows[0],
      };
      console.log(`Stats for ${table}:`, result.stats);
    } else {
      await client.end();
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use: schema, preview, count, query_period, or stats' }),
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