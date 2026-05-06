import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Loader2, CheckCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

const EmergencyMode = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  const getCurrentPos = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
      });
    });

  const handleEmergency = async () => {
    if (!user) { toast.error("Please login first"); return; }
    setSending(true);
    try {
      let lat: number | null = null, lng: number | null = null;
      try {
        const pos = await getCurrentPos();
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch {
        toast.warning("Location permission denied — alert sent without GPS");
      }

      const { data: vehicles } = await supabase.from("vehicles").select("*").eq("user_id", user.id);
      const vehicleInfo = vehicles?.map((v: any) => `${v.vehicle_type} ${v.vehicle_brand || ""} ${v.vehicle_model || ""}`.trim()).join(", ") || "Not specified";

      const { data, error } = await supabase.from("emergency_alerts").insert({
        user_id: user.id,
        user_name: profile?.name || "Unknown",
        user_phone: profile?.phone || "",
        user_area: profile?.area || "Unknown",
        vehicle_info: vehicleInfo,
        status: "active",
        latitude: lat,
        longitude: lng,
        location_updated_at: lat != null ? new Date().toISOString() : null,
      } as any).select().single();

      if (error) throw error;
      setAlertId((data as any).id);
      setSent(true);
      toast.success("SOS sent! Sharing your live location with nearby mechanics.");
    } catch (e: any) {
      toast.error(e.message || "Failed to send alert");
    } finally {
      setSending(false);
    }
  };

  // Continuous location broadcast while alert active
  useEffect(() => {
    if (!sent || !alertId) return;
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < 5000) return;
        lastSentRef.current = now;
        await supabase.from("emergency_alerts").update({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location_updated_at: new Date().toISOString(),
        } as any).eq("id", alertId);
      },
      (e) => console.warn("SOS geo error", e),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [sent, alertId]);

  const stopSharing = async () => {
    if (alertId) {
      await supabase.from("emergency_alerts").update({ status: "resolved", resolved_at: new Date().toISOString() } as any).eq("id", alertId);
    }
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    setSent(false);
    setAlertId(null);
    toast.success("Live location sharing stopped.");
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
                One tap shares your live GPS location with nearby mechanics on a real-time map.
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
            <p className="text-xs text-muted-foreground">Tap to share your location with nearby mechanics</p>
          </div>
        ) : (
          <div className="text-center space-y-6 animate-slide-up w-full">
            <div className="h-24 w-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Live Location Shared</h2>
              <p className="text-muted-foreground text-sm flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4 text-destructive animate-pulse" /> Nearby mechanics can now track you on a map.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="destructive" onClick={stopSharing} className="w-full">
                Stop Sharing & Resolve
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
                Back to Dashboard
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
