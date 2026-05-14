import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Send, AlertTriangle, Search } from "lucide-react";
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
    <span style="transform:rotate(45deg);color:white;font-weight:700;font-size:13px;">🔧</span>
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
  const [acceptedCount, setAcceptedCount] = useState(0);
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

  // 2. Load available mechanics (only for map markers, no nearest selection)
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

  // 3. Watch for an accepted response on the active issue
  useEffect(() => {
    if (!activeIssueId) return;
    const check = async () => {
      const { data } = await supabase
        .from("mechanic_responses")
        .select("status")
        .eq("issue_id", activeIssueId)
        .eq("status", "accepted");
      if (data && data.length > 0) {
        setAcceptedCount(data.length);
        toast.success("A mechanic accepted your request!");
        onActiveIssue(activeIssueId);
        setActiveIssueId(null);
      }
    };
    check();
    pollRef.current = window.setInterval(check, 5000);
    const ch = supabase
      .channel(`req-${activeIssueId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mechanic_responses", filter: `issue_id=eq.${activeIssueId}` },
        () => check(),
      )
      .subscribe();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      supabase.removeChannel(ch);
    };
  }, [activeIssueId, onActiveIssue]);

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
      const area = profile?.area || null;
      const { data: issue, error } = await supabase
        .from("issues")
        .insert({
          user_id: user.id,
          description: description || ISSUE_TYPES.find(t => t.value === issueType)?.label || "Service request",
          issue_type: issueType,
          vehicle_id: vehicleId || null,
          area,
          latitude: userPos[0],
          longitude: userPos[1],
          status: "open",
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Fan out invites to all available mechanics (prefer same area)
      let targets = mechanics.filter((m) => m.is_available !== false);
      if (area) {
        const sameArea = targets.filter((m) => m.area === area);
        if (sameArea.length > 0) targets = sameArea;
      }
      if (targets.length === 0) {
        toast.error("No mechanics are available right now");
        setRequesting(false);
        return;
      }
      const rows = targets.map((m) => ({
        issue_id: issue.id,
        mechanic_id: m.user_id,
        price_quote: 0,
        message: `New request: ${ISSUE_TYPES.find(t => t.value === issueType)?.label}`,
        status: "pending",
      }));
      await supabase.from("mechanic_responses").insert(rows as any);

      // Auto-grant phone consent so the accepting mechanic can see the user's number
      const consents = targets.map((m) => ({
        user_id: user.id,
        mechanic_id: m.user_id,
        issue_id: issue.id,
        granted: true,
      }));
      await supabase.from("phone_share_consents").insert(consents as any);

      toast.success(`Invite sent to ${targets.length} mechanic${targets.length > 1 ? "s" : ""}`);
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
      <Card className="overflow-hidden border-border/60">
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

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">What's the problem?</label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vehicles.length > 0 && (
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue placeholder="Select vehicle (optional)" />
                </SelectTrigger>
                <SelectContent>
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

          <Button className="w-full" size="lg" onClick={handleRequest} disabled={requesting || !!activeIssueId}>
            {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Request a Mechanic
          </Button>
        </div>
      </Card>

      {/* Looking for mechanics overlay */}
      {activeIssueId && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center px-6 animate-fade-in">
          <Card className="max-w-sm w-full p-6 text-center space-y-5">
            <div className="relative h-24 w-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-primary/30 animate-ping" style={{ animationDelay: "0.4s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Looking for mechanics…</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We've notified nearby mechanics. Hold tight — first to accept will be on the way.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={cancelRequest}>
              Cancel request
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
