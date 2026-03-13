import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_URL = 'https://api.oxy.finance';
const CNPJ_CLEAN = '23813779000160';
const CNPJ_FORMATTED = '23.813.779/0001-60';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OXY_FINANCE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OXY_FINANCE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, startDate, endDate, movimentType, isLate } = await req.json();
    console.log(`Action: ${action}, startDate: ${startDate}, endDate: ${endDate}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    let url: string;
    let fetchOptions: RequestInit;

    switch (action) {
      case 'dre': {
        url = `${BASE_URL}/v2/dre/dre-table`;
        fetchOptions = {
          method: 'POST',
          headers,
          body: JSON.stringify({
            startDate,
            endDate,
            cnpjs: [CNPJ_CLEAN],
          }),
        };
        break;
      }
      case 'cashflow_details': {
        url = `${BASE_URL}/widgets/cash-flow/v2/card/details`;
        fetchOptions = {
          method: 'POST',
          headers,
          body: JSON.stringify({
            startDate,
            endDate,
            cnpjs: [CNPJ_FORMATTED],
            movimentType: movimentType || 'R',
            isLate: isLate || false,
          }),
        };
        break;
      }
      case 'cashflow_chart': {
        url = `${BASE_URL}/widgets/cash-flow/charts/fluxo-caixa`;
        fetchOptions = {
          method: 'POST',
          headers,
          body: JSON.stringify({
            startDate,
            endDate,
            cnpjs: [CNPJ_FORMATTED],
          }),
        };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    console.log(`Fetching: ${url}`);
    console.log(`Body: ${(fetchOptions as any).body}`);

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response body (first 2000 chars): ${responseText.substring(0, 2000)}`);
    
    // Try to parse as JSON for structured logging
    try {
      const jsonData = JSON.parse(responseText);
      console.log(`Response keys: ${JSON.stringify(Object.keys(jsonData))}`);
      if (Array.isArray(jsonData)) {
        console.log(`Array length: ${jsonData.length}`);
        if (jsonData.length > 0) {
          console.log(`First item keys: ${JSON.stringify(Object.keys(jsonData[0]))}`);
          console.log(`First item: ${JSON.stringify(jsonData[0]).substring(0, 1000)}`);
        }
      }
    } catch {
      console.log('Response is not JSON');
    }

    return new Response(responseText, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
