import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("META_ACCESS_TOKEN");
    const adAccountId = Deno.env.get("META_AD_ACCOUNT_ID");
    
    if (!accessToken || !adAccountId) {
      throw new Error("META_ACCESS_TOKEN ou META_AD_ACCOUNT_ID não configurados");
    }

    const body = await req.json();
    const { campaignId, startDate, endDate } = body;

    if (!campaignId) {
      throw new Error("campaignId é obrigatório");
    }

    console.log("Fetching ad sets for campaign:", { campaignId, startDate, endDate });

    const formattedAccountId = adAccountId.startsWith('act_') 
      ? adAccountId 
      : `act_${adAccountId}`;

    // Fetch ad sets for this campaign
    const adSetsUrl = `${META_BASE_URL}/${campaignId}/adsets?fields=id,name,status,daily_budget&access_token=${accessToken}`;
    const adSetsResponse = await fetch(adSetsUrl);
    const adSetsData = await adSetsResponse.json();
    
    if (adSetsData.error) {
      console.error("Meta API error fetching ad sets:", adSetsData.error);
      throw new Error(adSetsData.error.message || "Erro ao buscar ad sets");
    }

    console.log(`Found ${adSetsData.data?.length || 0} ad sets for campaign ${campaignId}`);

    // Fetch insights for each ad set
    const insightsFields = ["spend", "impressions", "clicks", "actions", "cpc", "cpm"].join(",");
    const timeRange = JSON.stringify({ since: startDate, until: endDate });
    
    const adSetsWithInsights = await Promise.all(
      (adSetsData.data || []).map(async (adSet: MetaAdSet) => {
        try {
          // Fetch insights
          const adSetInsightsUrl = `${META_BASE_URL}/${adSet.id}/insights?fields=${insightsFields}&time_range=${encodeURIComponent(timeRange)}&access_token=${accessToken}`;
          const adSetInsightsResponse = await fetch(adSetInsightsUrl);
          const adSetInsightsData = await adSetInsightsResponse.json();
          
          // Fetch first ad to get thumbnail
          const adsUrl = `${META_BASE_URL}/${adSet.id}/ads?fields=creative{thumbnail_url,image_url}&limit=1&access_token=${accessToken}`;
          const adsResponse = await fetch(adsUrl);
          const adsData = await adsResponse.json();
          
          const firstAd = adsData.data?.[0];
          const thumbnailUrl = firstAd?.creative?.thumbnail_url || 
                               firstAd?.creative?.image_url || 
                               null;
          
          return {
            ...adSet,
            insights: adSetInsightsData.data?.[0] || null,
            thumbnailUrl,
            previewUrl: `https://www.facebook.com/adsmanager/manage/adsets?act=${formattedAccountId.replace('act_', '')}&selected_adset_ids=${adSet.id}`,
          };
        } catch (err) {
          console.error(`Error fetching insights for ad set ${adSet.id}:`, err);
          return { ...adSet, insights: null, thumbnailUrl: null, previewUrl: null };
        }
      })
    );

    console.log(`Successfully fetched ${adSetsWithInsights.length} ad sets with insights`);

    return new Response(JSON.stringify({ 
      success: true, 
      adSets: adSetsWithInsights,
      campaignId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching ad sets:", errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      adSets: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
