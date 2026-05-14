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

type Job = {
  issueId: string;
  status: "open" | "accepted";
  responseId?: string;
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
  const { user, mechanicProfile } = useAuth();
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!navigator.geolocation) { setPos(CHENNAI_FALLBACK); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => setPos(CHENNAI_FALLBACK),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const fetchJobs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Open issues (mechanics can read all open via RLS)
      const { data: openIssues } = await supabase
        .from("issues")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50);

      // 2. My accepted responses
      const { data: myAccepted } = await supabase
        .from("mechanic_responses")
        .select("*")
        .eq("mechanic_id", user.id)
        .eq("status", "accepted");

      const acceptedIssueIds = new Set((myAccepted || []).map((r: any) => r.issue_id));
      // also exclude open issues that some other mechanic already took? We don't know without joining; keep simple: show open issues even if status open.

      // 3. Issues for accepted responses
      const acceptedIds = Array.from(acceptedIssueIds);
      const { data: acceptedIssues } = acceptedIds.length
        ? await supabase.from("issues").select("*").in("id", acceptedIds)
        : { data: [] as any[] };

      const allIssues = [
        ...(openIssues || []).filter((i: any) => !acceptedIssueIds.has(i.id)),
        ...(acceptedIssues || []),
      ];

      // 4. Fetch related vehicles + profiles
      const userIds = [...new Set(allIssues.map((i: any) => i.user_id))];
      const vehicleIds = allIssues.filter((i: any) => i.vehicle_id).map((i: any) => i.vehicle_id);
      const [{ data: profiles }, { data: vehicles }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("user_id, name, phone").in("user_id", userIds)
          : Promise.resolve({ data: [] as any[] }),
        vehicleIds.length
          ? supabase.from("vehicles").select("*").in("id", vehicleIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const list: Job[] = allIssues.map((i: any) => {
        const isAccepted = acceptedIssueIds.has(i.id);
        const myResp = (myAccepted || []).find((r: any) => r.issue_id === i.id);
        const profile = (profiles || []).find((p: any) => p.user_id === i.user_id);
        const veh = (vehicles || []).find((v: any) => v.id === i.vehicle_id);
        return {
          issueId: i.id,
          status: isAccepted ? "accepted" : "open",
          responseId: myResp?.id,
          userId: i.user_id,
          userName: profile?.name,
          userPhone: isAccepted ? profile?.phone : undefined,
          description: i.description || "",
          issue_type: i.issue_type,
          area: i.area,
          latitude: i.latitude,
          longitude: i.longitude,
          vehicleLabel: veh ? `${veh.vehicle_type} ${veh.vehicle_brand || ""} ${veh.vehicle_model || ""}`.trim() : undefined,
          created_at: i.created_at,
        };
      });
      setJobs(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchJobs();
    const ch1 = supabase
      .channel(`mech-issues-feed`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => fetchJobs(),
      )
      .subscribe();
    const ch2 = supabase
      .channel(`mech-resps-feed-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mechanic_responses", filter: `mechanic_id=eq.${user.id}` },
        () => fetchJobs(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [user]);

  const handleAccept = async (j: Job) => {
    if (!user) return;
    setActing(j.issueId);
    try {
      const { error } = await supabase.from("mechanic_responses").insert({
        issue_id: j.issueId,
        mechanic_id: user.id,
        price_quote: 0,
        message: `Accepted by ${mechanicProfile?.garage_name || "mechanic"}`,
        status: "accepted",
      } as any);
      if (error) throw error;
      toast.success("Request accepted!");
      fetchJobs();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); }
  };

  const handleReject = (j: Job) => {
    setHidden((s) => new Set(s).add(j.issueId));
    toast.success("Dismissed");
  };

  const visible = jobs.filter((j) => !hidden.has(j.issueId));

  const allPoints: [number, number][] = useMemo(() => {
    const p: [number, number][] = [];
    if (pos) p.push(pos);
    visible.filter((j) => j.latitude != null && j.longitude != null)
      .forEach((j) => p.push([j.latitude!, j.longitude!]));
    return p;
  }, [pos, visible]);

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
              {visible
                .filter((j) => j.latitude != null && j.longitude != null)
                .map((j) => (
                  <Marker key={j.issueId} position={[j.latitude!, j.longitude!]} icon={userIcon}>
                    <Popup>
                      <strong>{issueTypeLabel(j.issue_type)}</strong>
                      <br />
                      {j.userName || "Customer"} · {j.area}
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
          {visible.length === 0 ? "No active requests on map" : `${visible.length} live request${visible.length > 1 ? "s" : ""} • Tap a marker to view`}
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" /> Incoming Requests
        </h2>
        {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
        {!loading && visible.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No requests yet. You'll see them here when customers nearby ask for help.
          </div>
        )}
        {visible.map((j) => (
          <div key={j.issueId} className={`bg-card rounded-xl border p-4 animate-slide-up ${j.status === "accepted" ? "border-success/40" : "border-border"}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-primary font-semibold">{issueTypeLabel(j.issue_type)}</p>
                <h3 className="font-semibold text-sm truncate">{j.userName || "Customer"}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {j.area || "Unknown area"}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${j.status === "accepted" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}`}>{j.status}</span>
            </div>
            {j.vehicleLabel && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Car className="h-3 w-3" /> {j.vehicleLabel}
              </p>
            )}
            {j.description && <p className="text-sm text-foreground mb-2 line-clamp-3">{j.description}</p>}

            <div className="flex flex-wrap gap-2 mt-2">
              {j.status === "open" ? (
                <>
                  <Button size="sm" onClick={() => handleAccept(j)} disabled={acting === j.issueId}>
                    {acting === j.issueId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(j)}>
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                  {j.latitude != null && j.longitude != null && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${j.latitude},${j.longitude}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary"><Navigation className="h-3 w-3 mr-1" /> Preview</Button>
                    </a>
                  )}
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${j.issueId}`)}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat
                  </Button>
                  {j.userPhone && (
                    <a href={`tel:${j.userPhone}`}>
                      <Button size="sm" variant="secondary"><Phone className="h-3 w-3 mr-1" /> +91 {j.userPhone}</Button>
                    </a>
                  )}
                  {j.latitude != null && j.longitude != null && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${j.latitude},${j.longitude}`} target="_blank" rel="noopener noreferrer">
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
