import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, pin, action } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ACTION: CHECK - check if phone exists and has PIN
    if (action === "check") {
      if (!phone || !/^\d{10}$/.test(phone)) {
        return new Response(JSON.stringify({ error: "Invalid phone number" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", phone)
        .limit(1)
        .single();

      const { data: pinData } = await supabase
        .from("user_pins")
        .select("id")
        .eq("phone", phone)
        .limit(1)
        .single();

      return new Response(JSON.stringify({ exists: !!profile, hasPin: !!pinData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: REGISTER - create new user or migrate existing user with PIN
    if (action === "register") {
      if (!phone || !/^\d{10}$/.test(phone)) {
        return new Response(JSON.stringify({ error: "Invalid phone number" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!pin || !/^\d{4}$/.test(pin)) {
        return new Response(JSON.stringify({ error: "PIN must be 4 digits" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const email = `${phone}@afterbrakes.app`;
      const password = `AB_pin_${phone}_${pin}`;

      // Store/update PIN
      await supabase.from("user_pins").upsert({ phone, pin }, { onConflict: "phone" });

      // Check if user already exists (migration from OTP system)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", phone)
        .limit(1)
        .single();

      if (existingProfile) {
        // Existing user - update password to PIN-based
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingProfile.user_id,
          { password, email_confirm: true }
        );
        if (updateError) throw updateError;

        // Get role info
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", existingProfile.user_id);
        const role = roles && roles.length > 0 ? roles[0].role : null;

        // Check profile completeness
        const { data: prof } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", existingProfile.user_id)
          .single();
        let profileComplete = !!prof?.name;

        if (role === "mechanic") {
          const { data: mechProf } = await supabase
            .from("mechanic_profiles")
            .select("id")
            .eq("user_id", existingProfile.user_id)
            .single();
          if (!mechProf) profileComplete = false;
        }

        return new Response(JSON.stringify({ success: true, email, isNew: false, role, profileComplete }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // New user - create account
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { phone },
      });
      if (createError) throw createError;

      // Create profile
      await supabase.from("profiles").insert({ user_id: newUser.user.id, phone });

      return new Response(JSON.stringify({ success: true, email, isNew: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: LOGIN - verify PIN and sign in
    if (action === "login") {
      if (!phone || !/^\d{10}$/.test(phone)) {
        return new Response(JSON.stringify({ error: "Invalid phone number" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!pin || !/^\d{4}$/.test(pin)) {
        return new Response(JSON.stringify({ error: "PIN must be 4 digits" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify PIN
      const { data: pinData, error: pinError } = await supabase
        .from("user_pins")
        .select("pin")
        .eq("phone", phone)
        .single();

      if (pinError || !pinData) {
        return new Response(JSON.stringify({ error: "Account not found. Please register first." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (pinData.pin !== pin) {
        return new Response(JSON.stringify({ error: "Incorrect PIN" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const email = `${phone}@afterbrakes.app`;
      const password = `AB_pin_${phone}_${pin}`;

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", phone)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update password to ensure it matches current PIN
      await supabase.auth.admin.updateUserById(profile.user_id, { password, email_confirm: true });

      // Get role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.user_id);
      const role = roles && roles.length > 0 ? roles[0].role : null;

      // Check profile completeness
      const { data: prof } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", profile.user_id)
        .single();
      let profileComplete = !!prof?.name;

      if (role === "mechanic") {
        const { data: mechProf } = await supabase
          .from("mechanic_profiles")
          .select("id")
          .eq("user_id", profile.user_id)
          .single();
        if (!mechProf) profileComplete = false;
      }

      return new Response(JSON.stringify({ success: true, email, role, profileComplete }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auth-pin error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
