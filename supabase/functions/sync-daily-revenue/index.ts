import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_URL = 'https://api.oxy.finance';
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { startDate, endDate } = await req.json();
    if (!startDate || !endDate) {
      return new Response(JSON.stringify({ error: 'startDate and endDate are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Syncing daily revenue from ${startDate} to ${endDate}`);

    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    };

    // Generate all dates in range
    const dates: string[] = [];
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    console.log(`Processing ${dates.length} days`);

    const results: { date: string; total_inflows: number; customer_count: number }[] = [];
    let errors = 0;

    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < dates.length; i += 5) {
      const batch = dates.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(async (day) => {
          try {
            const params = new URLSearchParams({
              startDate: day,
              endDate: day,
              'cnpjs[]': CNPJ_FORMATTED,
              movimentType: 'R',
              isLate: 'false',
            });
            const url = `${BASE_URL}/widgets/cash-flow/v2/card/details?${params}`;
            const response = await fetch(url, { method: 'GET', headers: authHeaders });
            const text = await response.text();

            if (!response.ok) {
              console.error(`Error fetching ${day}: ${response.status} ${text.substring(0, 200)}`);
              errors++;
              return null;
            }

            const data = JSON.parse(text);
            // Response: { data: [ { label: "Customer", data: [ { period: "Total", value: X } ] } ] }
            const customers = Array.isArray(data) ? data : data?.data || [];
            let totalInflows = 0;
            let customerCount = 0;

            if (Array.isArray(customers)) {
              for (const customer of customers) {
                const entries = customer.data || [];
                // Get the "Total" entry for this customer
                const totalEntry = entries.find((e: any) => e.period === 'Total');
                const value = Number(totalEntry?.value || 0);
                if (value > 0) {
                  totalInflows += value;
                  customerCount++;
                }
              }
            }

            return { date: day, total_inflows: totalInflows, customer_count: customerCount };
          } catch (e) {
            console.error(`Exception fetching ${day}:`, e);
            errors++;
            return null;
          }
        })
      );

      for (const r of batchResults) {
        if (r) results.push(r);
      }

      // Small delay between batches
      if (i + 5 < dates.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    console.log(`Fetched ${results.length} days, ${errors} errors. Upserting...`);

    // Upsert all results
    if (results.length > 0) {
      const rows = results.map((r) => ({
        date: r.date,
        total_inflows: r.total_inflows,
        customer_count: r.customer_count,
        year: parseInt(r.date.split('-')[0], 10),
        synced_at: new Date().toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from('daily_revenue')
        .upsert(rows, { onConflict: 'date' });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        return new Response(JSON.stringify({ error: upsertError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const summary = {
      synced: results.length,
      errors,
      totalInflows: results.reduce((s, r) => s + r.total_inflows, 0),
      dateRange: { startDate, endDate },
    };

    console.log('Sync complete:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
