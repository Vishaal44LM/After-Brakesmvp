import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Check, X, MessageCircle, Phone, Navigation, Car, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { issueTypeLabel } from "@/data/issueTypes";

const mechIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(263 56% 50%);border:3px solid white;box-shadow:0 0 0 3px hsla(263,56%,50%,0.35);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(0 70% 50%);border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);color:white;font-weight:700;font-size:14px;">📍</span>
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

type Req = {
  responseId: string;
  status: string;
  issueId: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  description: string;
  issue_type?: string | null;
  area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  vehicleLabel?: string;
  created_at: string;
};

export default function MechanicRequestsHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) { setPos(CHENNAI_FALLBACK); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => setPos(CHENNAI_FALLBACK),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: resps } = await supabase
        .from("mechanic_responses")
        .select("*")
        .eq("mechanic_id", user.id)
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false });
      if (!resps || resps.length === 0) { setRequests([]); setLoading(false); return; }

      const issueIds = resps.map((r: any) => r.issue_id);
      const { data: issues } = await supabase.from("issues").select("*").in("id", issueIds);
      const userIds = [...new Set((issues || []).map((i: any) => i.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, name, phone").in("user_id", userIds);
      const vehicleIds = (issues || []).filter((i: any) => i.vehicle_id).map((i: any) => i.vehicle_id);
      const { data: vehicles } = vehicleIds.length
        ? await supabase.from("vehicles").select("*").in("id", vehicleIds)
        : { data: [] as any[] };

      const list: Req[] = resps.map((r: any) => {
        const issue = (issues || []).find((i: any) => i.id === r.issue_id);
        const profile = (profiles || []).find((p: any) => p.user_id === issue?.user_id);
        const veh = (vehicles || []).find((v: any) => v.id === issue?.vehicle_id);
        return {
          responseId: r.id,
          status: r.status,
          issueId: r.issue_id,
          userId: issue?.user_id,
          userName: profile?.name,
          userPhone: r.status === "accepted" ? profile?.phone : undefined,
          description: issue?.description || "",
          issue_type: issue?.issue_type,
          area: issue?.area,
          latitude: issue?.latitude,
          longitude: issue?.longitude,
          vehicleLabel: veh ? `${veh.vehicle_type} ${veh.vehicle_brand || ""} ${veh.vehicle_model || ""}`.trim() : undefined,
          created_at: r.created_at,
        };
      });
      setRequests(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRequests();
    const ch = supabase
      .channel(`mech-reqs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mechanic_responses", filter: `mechanic_id=eq.${user.id}` },
        () => fetchRequests(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const handleAccept = async (r: Req) => {
    setActing(r.responseId);
    try {
      await supabase.from("mechanic_responses").update({ status: "accepted" } as any).eq("id", r.responseId);
      // Also reject this mechanic's own duplicates? Just update one. Other mechanics' rows untouched until user side cancels.
      toast.success("Request accepted!");
      fetchRequests();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); }
  };

  const handleReject = async (r: Req) => {
    setActing(r.responseId);
    try {
      await supabase.from("mechanic_responses").update({ status: "rejected" } as any).eq("id", r.responseId);
      toast.success("Dismissed");
      fetchRequests();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); }
  };

  const allPoints: [number, number][] = useMemo(() => {
    const p: [number, number][] = [];
    if (pos) p.push(pos);
    requests.filter((r) => r.latitude != null && r.longitude != null)
      .forEach((r) => p.push([r.latitude!, r.longitude!]));
    return p;
  }, [pos, requests]);

  const center = pos || CHENNAI_FALLBACK;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/60">
        <div className="h-[320px] sm:h-[420px] w-full">
          {pos ? (
            <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }} className="rounded-t-lg">
              <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={pos} icon={mechIcon}>
                <Popup>You</Popup>
              </Marker>
              {requests
                .filter((r) => r.latitude != null && r.longitude != null)
                .map((r) => (
                  <Marker key={r.responseId} position={[r.latitude!, r.longitude!]} icon={userIcon}>
                    <Popup>
                      <strong>{issueTypeLabel(r.issue_type)}</strong>
                      <br />
                      {r.userName || "Customer"} · {r.area}
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
        <div className="p-3 bg-card text-xs text-muted-foreground">
          {requests.length === 0 ? "No active requests on map" : `${requests.length} live request${requests.length > 1 ? "s" : ""} • Tap markers to view`}
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" /> Incoming Requests
        </h2>
        {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
        {!loading && requests.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No requests yet. You'll see them here when customers nearby ask for help.
          </div>
        )}
        {requests.map((r) => (
          <div key={r.responseId} className={`bg-card rounded-xl border p-4 animate-slide-up ${r.status === "accepted" ? "border-success/40" : "border-border"}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-primary font-semibold">{issueTypeLabel(r.issue_type)}</p>
                <h3 className="font-semibold text-sm truncate">{r.userName || "Customer"}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {r.area || "Unknown area"}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${r.status === "accepted" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}`}>{r.status}</span>
            </div>
            {r.vehicleLabel && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Car className="h-3 w-3" /> {r.vehicleLabel}
              </p>
            )}
            {r.description && <p className="text-sm text-foreground mb-2 line-clamp-3">{r.description}</p>}

            <div className="flex flex-wrap gap-2 mt-2">
              {r.status === "pending" ? (
                <>
                  <Button size="sm" onClick={() => handleAccept(r)} disabled={acting === r.responseId}>
                    {acting === r.responseId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(r)} disabled={acting === r.responseId}>
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                  {r.latitude != null && r.longitude != null && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary"><Navigation className="h-3 w-3 mr-1" /> Preview</Button>
                    </a>
                  )}
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${r.issueId}`)}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat
                  </Button>
                  {r.userPhone && (
                    <a href={`tel:${r.userPhone}`}>
                      <Button size="sm" variant="secondary"><Phone className="h-3 w-3 mr-1" /> +91 {r.userPhone}</Button>
                    </a>
                  )}
                  {r.latitude != null && r.longitude != null && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary"><Navigation className="h-3 w-3 mr-1" /> Navigate</Button>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
