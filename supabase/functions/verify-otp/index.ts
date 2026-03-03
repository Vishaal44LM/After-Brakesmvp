import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "Phone and code required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify OTP
    const { data: otpData, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return new Response(JSON.stringify({ error: "Invalid or expired OTP" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark OTP as verified
    await supabase.from("otp_codes").update({ verified: true }).eq("id", otpData.id);

    const email = `${phone}@afterbrakes.app`;
    const password = `AB_otp_${phone}_secure_key`;

    // Check if user exists by listing users with this email
    const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    let existingUser = null;

    // Search by email
    const { data: usersSearch } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("phone", phone)
      .limit(1)
      .single();

    if (usersSearch) {
      existingUser = usersSearch;
    }

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { phone },
      });
      if (createError) throw createError;

      // Create profile
      await supabase.from("profiles").insert({
        user_id: newUser.user.id,
        phone,
      });

      return new Response(JSON.stringify({ success: true, isNew: true, email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", existingUser.user_id);

    const role = roles && roles.length > 0 ? roles[0].role : null;

    // Check if profile is complete (has name)
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", existingUser.user_id)
      .single();

    const profileComplete = profile?.name ? true : false;

    return new Response(JSON.stringify({ success: true, isNew: false, email, role, profileComplete }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-otp error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
