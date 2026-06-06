import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MapPin, Send, AlertTriangle, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ISSUE_TYPES } from "@/data/issueTypes";
import AddressSearch from "@/components/AddressSearch";

const nativeSelectClass =
  "w-full h-10 px-3 rounded-md bg-secondary border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[right_12px_center] pr-8";

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

type SavedLoc = { lat: number; lng: number; address?: string };

function loadSavedLoc(): SavedLoc | null {
  try {
    const raw = localStorage.getItem("user_pinned_loc");
    if (raw) return JSON.parse(raw);
    const sess = sessionStorage.getItem("user_coords");
    if (sess) {
      const { lat, lng } = JSON.parse(sess);
      return { lat, lng };
    }
  } catch {}
  return null;
}

function FlyTo({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [pos, map]);
  return null;
}

export default function RequestMechanicHome({ vehicles, onActiveIssue }: Props) {
  const { user, profile } = useAuth();
  const initial = loadSavedLoc();
  const [userPos, setUserPos] = useState<[number, number] | null>(
    initial ? [initial.lat, initial.lng] : null,
  );
  const [address, setAddress] = useState<string>(initial?.address || "");
  const [locError, setLocError] = useState<string | null>(null);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loadingMechs, setLoadingMechs] = useState(true);

  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [requesting, setRequesting] = useState(false);

  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const persistLoc = (lat: number, lng: number, addr?: string) => {
    try {
      localStorage.setItem("user_pinned_loc", JSON.stringify({ lat, lng, address: addr }));
    } catch {}
  };

  // 1. Geolocation — handle every error code distinctly. Don't overwrite a manually-pinned address.
  useEffect(() => {
    if (initial) return;
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported in this browser. Search your address above.");
      setUserPos(CHENNAI_FALLBACK);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Type your address above or update browser settings."
            : err.code === err.POSITION_UNAVAILABLE
            ? "Couldn't determine your position. Type your address above."
            : err.code === err.TIMEOUT
            ? "Location request timed out. Type your address above."
            : "Couldn't get your location. Type your address above.";
        setLocError(msg);
        setUserPos(CHENNAI_FALLBACK);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
    // Listen for location events emitted by the permission gate.
    const onCoords = (e: any) => {
      if (!e?.detail) return;
      setUserPos([e.detail.lat, e.detail.lng]);
      setLocError(null);
    };
    window.addEventListener("user-coords", onCoords);
    return () => window.removeEventListener("user-coords", onCoords);
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

  // 2b. Restore active outgoing request ONLY if it's recent and has no responses yet.
  // Prevents old "open" issues (e.g. from Find Mechanics flow) from re-triggering
  // the "Looking for mechanics" overlay on every visit to the Nearby tab.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: openIssues } = await supabase
        .from("issues")
        .select("id, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "open")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!openIssues?.length) return;
      const ids = openIssues.map((i: any) => i.id);
      const { data: resps } = await supabase
        .from("mechanic_responses")
        .select("issue_id")
        .in("issue_id", ids);
      const respondedSet = new Set((resps || []).map((r: any) => r.issue_id));
      const stillLooking = openIssues.find((i: any) => !respondedSet.has(i.id));
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
    if (vehicles.length > 0 && !vehicleId) { toast.error("Please select your vehicle"); return; }
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
            <label className="text-xs font-medium text-muted-foreground">What's the problem? <span className="text-destructive">*</span></label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className={nativeSelectClass}
            >
              <option value="">Select issue type</option>
              {ISSUE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {vehicles.length > 0 && (
              <>
                <label className="text-xs font-medium text-muted-foreground">Vehicle <span className="text-destructive">*</span></label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className={nativeSelectClass}
                >
                  <option value="">Select your vehicle</option>
                  {vehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_type} {v.vehicle_brand} {v.vehicle_model}
                    </option>
                  ))}
                </select>
              </>
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
