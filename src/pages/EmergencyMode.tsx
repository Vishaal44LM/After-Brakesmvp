import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Loader2, CheckCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

const EmergencyMode = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEmergency = async () => {
    if (!user) { toast.error("Please login first"); return; }
    setSending(true);
    try {
      // Fetch user vehicles
      const { data: vehicles } = await supabase.from("vehicles").select("*").eq("user_id", user.id);
      const vehicleInfo = vehicles?.map((v: any) => `${v.vehicle_type} ${v.vehicle_brand || ""} ${v.vehicle_model || ""}`.trim()).join(", ") || "Not specified";

      const { error } = await supabase.from("emergency_alerts").insert({
        user_id: user.id,
        user_name: profile?.name || "Unknown",
        user_phone: profile?.phone || "",
        user_area: profile?.area || "Unknown",
        vehicle_info: vehicleInfo,
        status: "active",
      } as any);

      if (error) throw error;
      setSent(true);
      toast.success("Emergency alert sent to nearby mechanics!");
    } catch (e: any) {
      toast.error(e.message || "Failed to send alert");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="user" onLogout={handleLogout} />
      <div className="container max-w-lg py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        {!sent ? (
          <div className="text-center space-y-6 animate-slide-up">
            <div className="relative">
              <div className="h-32 w-32 mx-auto rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Emergency Mode</h1>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                One tap to alert nearby mechanics. Your profile info (name, area, phone, vehicle) will be shared automatically.
              </p>
            </div>

            {profile && (
              <div className="bg-card rounded-xl border border-border p-4 text-left text-sm space-y-1">
                <p className="text-muted-foreground">Name: <span className="text-foreground font-medium">{profile.name || "Not set"}</span></p>
                <p className="text-muted-foreground">Area: <span className="text-foreground font-medium">{profile.area || "Not set"}</span></p>
                <p className="text-muted-foreground">Phone: <span className="text-foreground font-medium">{profile.phone || "Not set"}</span></p>
              </div>
            )}

            <button
              onClick={handleEmergency}
              disabled={sending}
              className="h-40 w-40 mx-auto rounded-full bg-destructive text-destructive-foreground flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: "0 0 40px hsl(var(--destructive) / 0.4)" }}
            >
              {sending ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="h-10 w-10" />
                  <span className="text-sm font-bold">SOS</span>
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground">Tap the button to send emergency alert</p>
          </div>
        ) : (
          <div className="text-center space-y-6 animate-slide-up">
            <div className="h-24 w-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Alert Sent!</h2>
              <p className="text-muted-foreground text-sm">Nearby mechanics have been notified. They'll contact you soon.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={() => setSent(false)} className="w-full">
                Send Another Alert
              </Button>
            </div>
          </div>
        )}

        <button onClick={() => navigate("/dashboard")} className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default EmergencyMode;
