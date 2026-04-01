import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, otp, action } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // ACTION: SEND-OTP
    if (action === "send-otp") {
      if (!email || !email.includes("@") || !email.includes(".")) {
        return new Response(JSON.stringify({ error: "Invalid email address" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Delete old OTPs for this email
      await supabase.from("otp_codes").delete().eq("phone", email);

      // Store OTP (reusing otp_codes table, "phone" column stores email)
      await supabase.from("otp_codes").insert({
        phone: email,
        code,
        expires_at: expiresAt,
        verified: false,
      });

      // Send email via Resend
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "After Brakes <onboarding@resend.dev>",
          to: [email],
          subject: `Your After Brakes OTP: ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #f97316; text-align: center;">After Brakes</h2>
              <p style="text-align: center; color: #333;">Your verification code is:</p>
              <div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f97316; padding: 20px; background: #fff7ed; border-radius: 12px; margin: 16px 0;">
                ${code}
              </div>
              <p style="text-align: center; color: #888; font-size: 13px;">This code expires in 5 minutes. Do not share it with anyone.</p>
            </div>
          `,
        }),
      });

      if (!resendRes.ok) {
        const errBody = await resendRes.text();
        console.error("Resend error:", errBody);
        throw new Error("Failed to send OTP email");
      }

      return new Response(JSON.stringify({ success: true, message: "OTP sent to your email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: VERIFY-OTP
    if (action === "verify-otp") {
      if (!email || !otp || !/^\d{4}$/.test(otp)) {
        return new Response(JSON.stringify({ error: "Invalid email or OTP" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get latest OTP for this email
      const { data: otpData, error: otpErr } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("phone", email)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (otpErr || !otpData) {
        return new Response(JSON.stringify({ error: "No OTP found. Please request a new one." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(otpData.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "OTP expired. Please request a new one." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (otpData.code !== otp) {
        return new Response(JSON.stringify({ error: "Incorrect OTP. Please try again." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark OTP as verified
      await supabase.from("otp_codes").update({ verified: true }).eq("id", otpData.id);

      // Check if user exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", email)
        .limit(1)
        .single();

      const password = `AB_otp_${email}_secure_${otpData.code}`;

      if (existingProfile) {
        // Existing user - update password and sign in
        await supabase.auth.admin.updateUserById(existingProfile.user_id, {
          password,
          email_confirm: true,
        });

        // Get role
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

        return new Response(JSON.stringify({
          success: true, email, password, isNew: false, role, profileComplete
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // New user - create account
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { email },
      });
      if (createError) throw createError;

      // Create profile (store email in phone column for backwards compat)
      await supabase.from("profiles").insert({ user_id: newUser.user.id, phone: email });

      return new Response(JSON.stringify({
        success: true, email, password, isNew: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auth-email-otp error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
