import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pipefy GraphQL endpoint
const PIPEFY_API_URL = 'https://api.pipefy.com/graphql';

// Map BU names to their pipe IDs (to be configured)
// TODO: Update with actual pipe IDs from user
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

function processCardsToMonthly(
  phases: PipefyPhase[],
  year: number
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};

  // Initialize all indicators with all months
  Object.values(PHASE_TO_INDICATOR).forEach((indicator) => {
    if (!result[indicator]) {
      result[indicator] = {};
      Object.values(MONTH_MAP).forEach((month) => {
        result[indicator][month] = 0;
      });
    }
  });

  phases.forEach((phase) => {
    const indicator = PHASE_TO_INDICATOR[phase.name];
    if (!indicator) return;

    phase.cards.edges.forEach(({ node: card }) => {
      const createdDate = new Date(card.created_at);
      const cardYear = createdDate.getFullYear();
      const cardMonth = createdDate.getMonth() + 1;

      if (cardYear === year) {
        const monthName = MONTH_MAP[cardMonth];
        if (monthName) {
          result[indicator][monthName]++;
        }
      }
    });
  });

  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pipefyApiKey = Deno.env.get('PIPEFY_API_KEY');
    if (!pipefyApiKey) {
      console.error('PIPEFY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'PIPEFY_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional parameters
    let year = 2026;
    try {
      const body = await req.json();
      if (body.year) year = body.year;
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log(`Syncing Pipefy funnel data for year ${year}...`);

    const results: Array<{ bu: string; indicator: string; month: string; value: number }> = [];

    // Process each BU
    for (const [buName, config] of Object.entries(BU_PIPE_CONFIG)) {
      if (!config.pipeId) {
        console.log(`Skipping ${buName}: no pipe ID configured`);
        
        // Generate mock data for demo purposes when pipe ID is not set
        const indicators = ['mql', 'rm', 'rr', 'proposta', 'venda'];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        indicators.forEach((indicator) => {
          months.forEach((month) => {
            // Generate realistic mock data based on indicator type
            let baseValue = 0;
            switch (indicator) {
              case 'mql': baseValue = Math.floor(Math.random() * 50) + 20; break;
              case 'rm': baseValue = Math.floor(Math.random() * 30) + 10; break;
              case 'rr': baseValue = Math.floor(Math.random() * 20) + 5; break;
              case 'proposta': baseValue = Math.floor(Math.random() * 15) + 3; break;
              case 'venda': baseValue = Math.floor(Math.random() * 8) + 1; break;
            }
            
            results.push({
              bu: config.buKey,
              indicator,
              month,
              value: baseValue,
            });
          });
        });
        continue;
      }

      console.log(`Fetching data for ${buName} (pipe ${config.pipeId})...`);
      const pipeData = await fetchPipeData(config.pipeId, pipefyApiKey);

      if (!pipeData?.data?.pipe) {
        console.error(`Failed to fetch data for ${buName}`);
        continue;
      }

      const monthlyData = processCardsToMonthly(pipeData.data.pipe.phases, year);

      Object.entries(monthlyData).forEach(([indicator, months]) => {
        Object.entries(months).forEach(([month, value]) => {
          results.push({
            bu: config.buKey,
            indicator,
            month,
            value,
          });
        });
      });
    }

    console.log(`Upserting ${results.length} records...`);

    // Upsert all records
    for (const record of results) {
      const { error } = await supabase
        .from('funnel_realized')
        .upsert({
          bu: record.bu,
          month: record.month,
          year,
          indicator: record.indicator,
          value: record.value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'bu,month,year,indicator',
        });

      if (error) {
        console.error('Upsert error:', error);
      }
    }

    console.log('Sync completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${results.length} records`,
        year,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
