import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaInsight {
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: Array<{ action_type: string; value: string }>;
  cpc?: string;
  cpm?: string;
}

interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("META_ACCESS_TOKEN");
    const adAccountId = Deno.env.get("META_AD_ACCOUNT_ID");
    
    if (!accessToken || !adAccountId) {
      console.error("Missing credentials:", { 
        hasToken: !!accessToken, 
        hasAccountId: !!adAccountId 
      });
      throw new Error("META_ACCESS_TOKEN ou META_AD_ACCOUNT_ID não configurados");
    }

    const body = await req.json();
    const { startDate, endDate } = body;

    console.log("Fetching Meta campaigns:", { startDate, endDate, adAccountId });

    // Ensure ad account ID has proper format
    const formattedAccountId = adAccountId.startsWith('act_') 
      ? adAccountId 
      : `act_${adAccountId}`;

    // Fetch campaigns with filtering for active/paused
    const campaignFields = [
      "id", "name", "status", "objective", "daily_budget", "lifetime_budget"
    ].join(",");
    
    const filterJson = JSON.stringify([{
      field: "effective_status",
      operator: "IN",
      value: ["ACTIVE", "PAUSED"]
    }]);
    
    const campaignsUrl = `${META_BASE_URL}/${formattedAccountId}/campaigns?fields=${campaignFields}&filtering=${encodeURIComponent(filterJson)}&access_token=${accessToken}`;
    
    console.log("Fetching campaigns from:", campaignsUrl.replace(accessToken, '[REDACTED]'));
    
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();
    
    if (campaignsData.error) {
      console.error("Meta API error:", campaignsData.error);
      throw new Error(campaignsData.error.message || "Erro na API do Meta");
    }

    console.log(`Found ${campaignsData.data?.length || 0} campaigns`);

    // For each campaign, fetch insights only - ad sets fetched on-demand via separate function
    const insightsFields = ["spend", "impressions", "clicks", "actions", "cpc", "cpm"].join(",");
    const timeRange = JSON.stringify({ since: startDate, until: endDate });
    
    // Process campaigns in small batches with delay to avoid rate limiting
    const BATCH_SIZE = 3;
    const BATCH_DELAY_MS = 500;
    const enrichedCampaigns: any[] = [];
    
    for (let i = 0; i < (campaignsData.data || []).length; i += BATCH_SIZE) {
      const batch = (campaignsData.data || []).slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (campaign: MetaCampaign) => {
          try {
            // Fetch campaign insights only
            const insightsUrl = `${META_BASE_URL}/${campaign.id}/insights?fields=${insightsFields}&time_range=${encodeURIComponent(timeRange)}&access_token=${accessToken}`;
            const insightsResponse = await fetch(insightsUrl);
            const insightsData = await insightsResponse.json();

            // Fetch first ad creative for thumbnail
            let thumbnailUrl: string | null = null;
            try {
              const adsUrl = `${META_BASE_URL}/${campaign.id}/ads?fields=creative{thumbnail_url,image_url}&limit=1&access_token=${accessToken}`;
              const adsResponse = await fetch(adsUrl);
              const adsData = await adsResponse.json();
              const firstAd = adsData.data?.[0];
              thumbnailUrl = firstAd?.creative?.thumbnail_url || firstAd?.creative?.image_url || null;
            } catch (err) {
              console.error(`Error fetching ads for campaign ${campaign.id}:`, err);
            }

            return {
              ...campaign,
              insights: insightsData.data?.[0] || null,
              adSets: [], // Ad sets fetched on-demand via fetch-campaign-adsets
              thumbnailUrl,
              previewUrl: `https://www.facebook.com/adsmanager/manage/campaigns?act=${formattedAccountId.replace('act_', '')}&selected_campaign_ids=${campaign.id}`,
            };
          } catch (err) {
            console.error(`Error enriching campaign ${campaign.id}:`, err);
            return {
              ...campaign,
              insights: null,
              adSets: [],
              thumbnailUrl: null,
              previewUrl: null,
            };
          }
        })
      );
      
      enrichedCampaigns.push(...batchResults);
      
      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < (campaignsData.data || []).length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log("Successfully enriched campaigns with insights and ad sets");

    return new Response(JSON.stringify({ 
      success: true, 
      campaigns: enrichedCampaigns,
      dateRange: { startDate, endDate },
      totalCampaigns: enrichedCampaigns.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching Meta campaigns:", errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      campaigns: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
