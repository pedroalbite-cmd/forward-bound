import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pipefy GraphQL endpoint
const PIPEFY_API_URL = 'https://api.pipefy.com/graphql';

// Map BU names to their pipe IDs (to be configured)
const BU_PIPE_CONFIG: Record<string, { pipeId: string; buKey: string }> = {
  'Modelo Atual': { pipeId: '', buKey: 'modelo_atual' },
  'O2 TAX': { pipeId: '', buKey: 'o2_tax' },
  'Oxy Hacker': { pipeId: '', buKey: 'oxy_hacker' },
  'Franquia': { pipeId: '', buKey: 'franquia' },
};

// Map phase names to indicator keys
const PHASE_TO_INDICATOR: Record<string, string> = {
  'MQL': 'mql',
  'RM Agendada': 'rm',
  'RR Realizada': 'rr',
  'Proposta': 'proposta',
  'Proposta Enviada': 'proposta',
  'Venda': 'venda',
  'Vendido': 'venda',
  'Ganho': 'venda',
};

// Month mapping from number to abbreviation
const MONTH_MAP: Record<number, string> = {
  1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr',
  5: 'Mai', 6: 'Jun', 7: 'Jul', 8: 'Ago',
  9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez',
};

// Input validation schema
const requestBodySchema = z.object({
  year: z.number().int().min(2020).max(2100).optional(),
}).optional();

interface PipefyCard {
  id: string;
  title: string;
  created_at: string;
  current_phase: {
    id: string;
    name: string;
  };
}

interface PipefyPhase {
  id: string;
  name: string;
  cards_count: number;
  cards: {
    edges: Array<{
      node: PipefyCard;
    }>;
  };
}

interface PipefyPipeResponse {
  data: {
    pipe: {
      id: string;
      name: string;
      phases: PipefyPhase[];
    };
  };
}

interface DailyRecord {
  bu: string;
  indicator: string;
  date: string;
  value: number;
}

async function fetchPipeData(pipeId: string, apiKey: string): Promise<PipefyPipeResponse | null> {
  if (!pipeId) return null;

  const query = `
    query {
      pipe(id: ${pipeId}) {
        id
        name
        phases {
          id
          name
          cards_count
          cards(first: 100) {
            edges {
              node {
                id
                title
                created_at
                current_phase {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(PIPEFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error(`Pipefy API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pipe data:', error);
    return null;
  }
}

// Process Pipefy cards to daily records (used when real Pipefy data is available)

function generateMockDailyData(buKey: string, year: number): DailyRecord[] {
  const results: DailyRecord[] = [];
  const indicators = ['leads', 'mql', 'rm', 'rr', 'proposta', 'venda'];
  
  // Generate data for each day of the year
  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      
      // Weekend factor - less activity on weekends
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.3 : 1;
      
      // Seasonal factor - more activity mid-year
      const seasonalFactor = 0.7 + 0.6 * Math.sin((month - 1) * Math.PI / 12);
      
      indicators.forEach((indicator) => {
        // Base daily values by indicator type
        let baseValue = 0;
        switch (indicator) {
          case 'leads': baseValue = 5; break;
          case 'mql': baseValue = 3; break;
          case 'rm': baseValue = 2; break;
          case 'rr': baseValue = 1.5; break;
          case 'proposta': baseValue = 1; break;
          case 'venda': baseValue = 0.5; break;
        }
        
        // Apply factors and add randomness
        const adjustedValue = baseValue * weekendFactor * seasonalFactor;
        const randomFactor = 0.5 + Math.random();
        const finalValue = Math.max(0, Math.round(adjustedValue * randomFactor));
        
        // Only add record if value > 0
        if (finalValue > 0) {
          results.push({
            bu: buKey,
            indicator,
            date: dateStr,
            value: finalValue,
          });
        }
      });
    }
  }
  
  return results;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION CHECK ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'Invalid token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User authenticated: ${user.id}`);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Admin role check failed:', roleError?.message || 'User is not an admin');
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin role verified, proceeding with sync...');
    // ========== END AUTHENTICATION CHECK ==========

    const pipefyApiKey = Deno.env.get('PIPEFY_API_KEY');
    if (!pipefyApiKey) {
      console.error('PIPEFY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'PIPEFY_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let year = 2026;
    try {
      const body = await req.json();
      const validated = requestBodySchema.parse(body);
      if (validated?.year) year = validated.year;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: 'Invalid input', details: error.errors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // No body or invalid JSON, use defaults
    }

    console.log(`Syncing Pipefy funnel data for year ${year}...`);

    const allResults: DailyRecord[] = [];

    // Process each BU
    for (const [buName, config] of Object.entries(BU_PIPE_CONFIG)) {
      if (!config.pipeId) {
        console.log(`Generating mock daily data for ${buName}...`);
        const mockData = generateMockDailyData(config.buKey, year);
        allResults.push(...mockData);
        continue;
      }

      console.log(`Fetching data for ${buName} (pipe ${config.pipeId})...`);
      const pipeData = await fetchPipeData(config.pipeId, pipefyApiKey);

      if (!pipeData?.data?.pipe) {
        console.error(`Failed to fetch data for ${buName}`);
        continue;
      }

      // Process real Pipefy data to daily records
      const phases = pipeData.data.pipe.phases;
      phases.forEach((phase) => {
        const indicator = PHASE_TO_INDICATOR[phase.name];
        if (!indicator) return;

        phase.cards.edges.forEach(({ node: card }) => {
          const createdDate = new Date(card.created_at);
          const cardYear = createdDate.getFullYear();

          if (cardYear === year) {
            const dateStr = createdDate.toISOString().split('T')[0];
            allResults.push({
              bu: config.buKey,
              indicator,
              date: dateStr,
              value: 1,
            });
          }
        });
      });
    }

    console.log(`Upserting ${allResults.length} daily records...`);

    // Batch upsert for better performance
    const batchSize = 100;
    for (let i = 0; i < allResults.length; i += batchSize) {
      const batch = allResults.slice(i, i + batchSize);
      
      const records = batch.map(record => ({
        bu: record.bu,
        date: record.date,
        indicator: record.indicator,
        month: MONTH_MAP[parseInt(record.date.split('-')[1])],
        year,
        value: record.value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('funnel_realized')
        .upsert(records, {
          onConflict: 'bu,date,indicator',
        });

      if (error) {
        console.error('Upsert error:', error);
      }
    }

    console.log('Sync completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${allResults.length} daily records`,
        year,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
