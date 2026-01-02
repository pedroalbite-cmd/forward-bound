import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting sales data sync...");

    // External Supabase credentials
    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const externalKey = Deno.env.get("EXTERNAL_SUPABASE_KEY");

    if (!externalUrl || !externalKey) {
      console.error("Missing external Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Missing external Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Local Supabase credentials
    const localUrl = Deno.env.get("SUPABASE_URL")!;
    const localServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create clients
    const externalSupabase = createClient(externalUrl, externalKey);
    const localSupabase = createClient(localUrl, localServiceKey);

    // Fetch data from external project
    console.log("Fetching data from external project...");
    const { data: externalData, error: fetchError } = await externalSupabase
      .from("sales_realized")
      .select("*")
      .eq("year", 2026);

    if (fetchError) {
      console.error("Error fetching external data:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch external data", details: fetchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetched ${externalData?.length || 0} records from external project`);

    if (!externalData || externalData.length === 0) {
      console.log("No data to sync");
      return new Response(
        JSON.stringify({ success: true, message: "No data to sync", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert data into local database
    let syncedCount = 0;
    const errors: any[] = [];

    for (const record of externalData) {
      const { error: upsertError } = await localSupabase
        .from("sales_realized")
        .upsert(
          {
            bu: record.bu,
            month: record.month,
            year: record.year,
            value: record.value,
          },
          { onConflict: "bu,month,year" }
        );

      if (upsertError) {
        console.error(`Error upserting record:`, upsertError);
        errors.push({ record, error: upsertError });
      } else {
        syncedCount++;
      }
    }

    console.log(`Sync completed. Synced: ${syncedCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${syncedCount} records`,
        synced: syncedCount,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Unexpected error during sync:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
