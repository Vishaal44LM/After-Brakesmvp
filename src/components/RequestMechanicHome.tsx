import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Send, AlertTriangle, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ISSUE_TYPES } from "@/data/issueTypes";

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(220 90% 60%);border:3px solid white;box-shadow:0 0 0 3px hsla(220,90%,60%,0.35);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
const mechIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(263 56% 50%);border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg);"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const CHENNAI_FALLBACK: [number, number] = [13.0827, 80.2707];

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  return null;
}

type Props = {
  vehicles: any[];
  onActiveIssue: (issueId: string | null) => void;
};

export default function RequestMechanicHome({ vehicles, onActiveIssue }: Props) {
  const { user, profile } = useAuth();
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loadingMechs, setLoadingMechs] = useState(true);

  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [requesting, setRequesting] = useState(false);

  // Active outgoing request waiting for acceptance
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // 1. Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported.");
      setUserPos(CHENNAI_FALLBACK);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {
        setLocError("Location permission denied. Showing Chennai by default.");
        setUserPos(CHENNAI_FALLBACK);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // 2. Load available mechanics for map markers
  useEffect(() => {
    (async () => {
      setLoadingMechs(true);
      const { data } = await supabase
        .from("mechanic_profiles")
        .select("user_id,name,garage_name,area,latitude,longitude,is_available")
        .or("is_available.is.null,is_available.eq.true");
      setMechanics((data as any[]) || []);
      setLoadingMechs(false);
    })();
  }, []);

  // 2b. Restore active outgoing request on mount (persistence across refresh/login)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: openIssues } = await supabase
        .from("issues")
        .select("id, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);
      if (!openIssues?.length) return;
      // Find one that has NO accepted response
      const ids = openIssues.map((i: any) => i.id);
      const { data: resps } = await supabase
        .from("mechanic_responses")
        .select("issue_id,status")
        .in("issue_id", ids);
      const acceptedSet = new Set((resps || []).filter((r: any) => r.status === "accepted").map((r: any) => r.issue_id));
      const stillLooking = openIssues.find((i: any) => !acceptedSet.has(i.id));
      if (stillLooking) setActiveIssueId(stillLooking.id);
    })();
  }, [user]);

  // 3. Watch for an accepted response on the active issue
  useEffect(() => {
    if (!activeIssueId || !user) return;
    let cancelled = false;
    const check = async () => {
      const { data } = await supabase
        .from("mechanic_responses")
        .select("id, mechanic_id, status")
        .eq("issue_id", activeIssueId)
        .eq("status", "accepted")
        .limit(1);
      if (cancelled) return;
      if (data && data.length > 0) {
        const accepted = data[0];
        // Auto-grant phone consent so the accepting mechanic can see our number
        await supabase
          .from("phone_share_consents")
          .insert({
            user_id: user.id,
            mechanic_id: accepted.mechanic_id,
            issue_id: activeIssueId,
            granted: true,
          } as any);
        toast.success("A mechanic accepted your request!");
        onActiveIssue(activeIssueId);
        setActiveIssueId(null);
      }
    };
    check();
    pollRef.current = window.setInterval(check, 4000);
    const ch = supabase
      .channel(`req-${activeIssueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mechanic_responses", filter: `issue_id=eq.${activeIssueId}` },
        () => check(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      if (pollRef.current) window.clearInterval(pollRef.current);
      supabase.removeChannel(ch);
    };
  }, [activeIssueId, user, onActiveIssue]);

  const allPoints: [number, number][] = useMemo(() => {
    const p: [number, number][] = [];
    if (userPos) p.push(userPos);
    mechanics
      .filter((m) => m.latitude != null && m.longitude != null)
      .forEach((m) => p.push([m.latitude, m.longitude]));
    return p;
  }, [userPos, mechanics]);

  const center: [number, number] = userPos || CHENNAI_FALLBACK;

  const handleRequest = async () => {
    if (!user) { toast.error("Please log in"); return; }
    if (!issueType) { toast.error("Select what's wrong"); return; }
    if (!userPos) { toast.error("Waiting for your location…"); return; }

    setRequesting(true);
    try {
      const { data: issue, error } = await supabase
        .from("issues")
        .insert({
          user_id: user.id,
          description: description || ISSUE_TYPES.find(t => t.value === issueType)?.label || "Service request",
          issue_type: issueType,
          vehicle_id: vehicleId || null,
          area: profile?.area || null,
          latitude: userPos[0],
          longitude: userPos[1],
          status: "open",
        } as any)
        .select()
        .single();
      if (error) throw error;

      toast.success("Request sent — looking for a mechanic…");
      setActiveIssueId(issue.id);
      setDescription("");
      setIssueType("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send request");
    } finally {
      setRequesting(false);
    }
  };

  const cancelRequest = async () => {
    if (!activeIssueId) return;
    try {
      await supabase.from("issues").update({ status: "cancelled" } as any).eq("id", activeIssueId);
      toast.success("Request cancelled");
    } finally {
      setActiveIssueId(null);
    }
  };

  return (
    <div className="space-y-4 relative">
      <Card className="overflow-hidden border-border/60 relative">
        <div className="h-[320px] sm:h-[420px] w-full">
          {userPos ? (
            <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }} className="rounded-t-lg">
              <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={userPos} icon={userIcon}>
                <Popup>You are here</Popup>
              </Marker>
              {mechanics
                .filter((m) => m.latitude != null && m.longitude != null)
                .map((m) => (
                  <Marker key={m.user_id} position={[m.latitude, m.longitude]} icon={mechIcon}>
                    <Popup>
                      <strong>{m.garage_name}</strong>
                      <br />
                      {m.area}
                    </Popup>
                  </Marker>
                ))}
              <FitBounds points={allPoints} />
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="p-4 space-y-3 bg-card">
          {locError && (
            <div className="flex items-start gap-2 text-xs text-warning rounded-md bg-warning/10 p-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{locError}</span>
            </div>
          )}
          {loadingMechs ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Finding nearby mechanics…
            </div>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {mechanics.length} mechanic{mechanics.length !== 1 ? "s" : ""} online nearby
            </p>
          )}

          <Button className="w-full" size="lg" onClick={handleRequest} disabled={requesting || !!activeIssueId}>
            {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Request a Mechanic
          </Button>

          <div className="space-y-2 pt-1">
            <label className="text-xs font-medium text-muted-foreground">What's the problem?</label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="w-[var(--radix-select-trigger-width)]">
                {ISSUE_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        {t.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {vehicles.length > 0 && (
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue placeholder="Select vehicle (optional)" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="w-[var(--radix-select-trigger-width)]">
                  {vehicles.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vehicle_type} {v.vehicle_brand} {v.vehicle_model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details (optional)"
              className="bg-secondary border-0 min-h-[60px]"
            />
          </div>
        </div>

        {/* Looking for mechanics — compact overlay anchored to bottom of MAP, keeps map visible */}
        {activeIssueId && (
          <div className="absolute left-3 right-3 bottom-3 sm:left-4 sm:right-4 sm:bottom-4 z-[1000] animate-fade-in pointer-events-none">
            <Card className="pointer-events-auto bg-background/95 backdrop-blur-md border-primary/50 shadow-xl p-3 sm:p-4 flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold leading-tight">Looking for mechanics…</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  Nearby mechanics have been notified. First to accept is yours.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={cancelRequest} className="shrink-0">
                <X className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
