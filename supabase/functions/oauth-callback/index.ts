
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OAuthCallbackRequest {
  code: string;
  provider: string;
  redirect_uri: string;
}

serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const requestBody = await req.text();
    console.log("Raw request body:", requestBody);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (e) {
      console.error("Failed to parse request body:", e);
      throw new Error(`Invalid request body: ${e.message}`);
    }
    
    const { code, provider, redirect_uri } = parsedBody as OAuthCallbackRequest;

    if (!code || !provider) {
      throw new Error("Missing required parameters: code, provider");
    }

    // Log basic info
    console.log(`Processing OAuth callback for provider: ${provider}`);
    console.log(`Redirect URI: ${redirect_uri}`);

    // Get client ID and secret based on provider
    let client_id, client_secret, token_url, scope;

    if (provider === "google") {
      client_id = Deno.env.get("GOOGLE_CLIENT_ID");
      client_secret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      token_url = "https://oauth2.googleapis.com/token";
      scope = "https://www.googleapis.com/auth/calendar";
    } else if (provider === "microsoft") {
      client_id = Deno.env.get("MICROSOFT_CLIENT_ID");
      client_secret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
      token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
      scope = "Calendars.ReadWrite User.Read offline_access";
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    if (!client_id || !client_secret) {
      throw new Error(`Missing credentials for provider: ${provider}`);
    }

    console.log(`Using token URL: ${token_url}`);
    console.log(`Using client_id: ${client_id.substring(0, 5)}...`); // Log part of the client ID for debugging

    // Create form data parameters for token exchange
    const formData = new FormData();
    formData.append("client_id", client_id);
    formData.append("client_secret", client_secret);
    formData.append("code", code);
    formData.append("redirect_uri", redirect_uri);
    formData.append("grant_type", "authorization_code");
    
    if (provider === "microsoft") {
      // Microsoft needs scope explicitly in the token request
      formData.append("scope", scope);
    }
    
    // For Microsoft, use URLSearchParams instead of FormData
    let body;
    let headers = {};
    
    if (provider === "microsoft") {
      const urlParams = new URLSearchParams();
      urlParams.append("client_id", client_id);
      urlParams.append("client_secret", client_secret);
      urlParams.append("code", code);
      urlParams.append("redirect_uri", redirect_uri);
      urlParams.append("grant_type", "authorization_code");
      urlParams.append("scope", scope);
      
      body = urlParams.toString();
      headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };
      
      // Double-check the request before sending
      console.log("Microsoft token request body:", body);
      console.log("Microsoft token request headers:", headers);
    } else {
      // For Google, continue using FormData
      body = formData;
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch(token_url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    const responseText = await tokenResponse.text();
    
    // Log detailed response info for debugging
    console.log(`Token response status: ${tokenResponse.status}`);
    console.log(`Token response headers: ${JSON.stringify(Object.fromEntries(tokenResponse.headers.entries()))}`);
    
    if (!tokenResponse.ok) {
      console.error("Error exchanging code for token:", responseText);
      throw new Error(`Failed to exchange code for token: ${responseText}`);
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
      console.log("Successfully exchanged code for tokens");
    } catch (error) {
      console.error("Failed to parse token response:", error);
      throw new Error("Failed to parse token response");
    }

    // Get user info based on provider
    let provider_user_id = null;
    
    if (provider === "google") {
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        provider_user_id = userInfo.id;
      }
    } else if (provider === "microsoft") {
      const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        provider_user_id = userInfo.id;
      }
    }

    // Get the user from the request
    const { data: { user } } = await supabase.auth.getUser(req.headers.get("Authorization")?.split("Bearer ")[1] || "");
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
    
    // Check if integration already exists
    const { data: existingIntegration } = await supabase
      .from("integrations")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .maybeSingle();

    // Integration data
    const integrationData = {
      user_id: user.id,
      provider,
      provider_user_id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      scopes: [scope],
      settings: {}
    };

    let result;
    
    if (existingIntegration) {
      // Update existing integration
      result = await supabase
        .from("integrations")
        .update(integrationData)
        .eq("id", existingIntegration.id)
        .select()
        .single();
    } else {
      // Create new integration
      result = await supabase
        .from("integrations")
        .insert(integrationData)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    console.log(`Integration ${existingIntegration ? 'updated' : 'created'} successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        integration_id: result.data.id,
        provider
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in oauth-callback function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
