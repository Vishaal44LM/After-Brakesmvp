import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Check, X, MessageCircle, Phone, Navigation, Car, AlertTriangle, Ban, CheckCircle2, MessageSquareQuote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { issueTypeLabel } from "@/data/issueTypes";
import RequestMiniMap, { distanceMeters } from "@/components/RequestMiniMap";
import LiveCustomerTracker from "@/components/LiveCustomerTracker";

const mechIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(263 56% 50%);border:3px solid white;box-shadow:0 0 0 3px hsla(263,56%,50%,0.35);"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10],
});
const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(0 70% 50%);border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg);"><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [30, 30], iconAnchor: [15, 30],
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
      // 1. Open issues
      const { data: openIssues } = await supabase
        .from("issues")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50);

      // 2. ALL my responses (accepted, rejected, cancelled, pending) — used to filter & to show accepted jobs
      const { data: myResponses } = await supabase
        .from("mechanic_responses")
        .select("*")
        .eq("mechanic_id", user.id);

      const respByIssue = new Map<string, any>((myResponses || []).map((r: any) => [r.issue_id, r]));
      const acceptedIds = (myResponses || []).filter((r: any) => r.status === "accepted").map((r: any) => r.issue_id);

      // 3. Fetch issues for accepted responses (may not be in openIssues)
      const { data: acceptedIssues } = acceptedIds.length
        ? await supabase.from("issues").select("*").in("id", acceptedIds)
        : { data: [] as any[] };

      // Filter open issues: drop any I've already responded to (accepted, rejected, cancelled)
      const openClean = (openIssues || []).filter((i: any) => !respByIssue.has(i.id));

      const allIssues = [
        ...openClean,
        ...((acceptedIssues || []).filter((i: any) => {
          const r = respByIssue.get(i.id);
          return r && r.status === "accepted";
        })),
      ];

      // 4. Related vehicles + profiles
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
        const myResp = respByIssue.get(i.id);
        const isAccepted = myResp?.status === "accepted";
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
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => fetchJobs())
      .subscribe();
    const ch2 = supabase
      .channel(`mech-resps-feed-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mechanic_responses", filter: `mechanic_id=eq.${user.id}` }, () => fetchJobs())
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

  const handleReject = async (j: Job) => {
    if (!user) return;
    setActing(j.issueId);
    try {
      // Persist rejection so it doesn't reappear after navigation
      await supabase.from("mechanic_responses").insert({
        issue_id: j.issueId,
        mechanic_id: user.id,
        price_quote: 0,
        message: "Rejected",
        status: "rejected",
      } as any);
      toast.success("Dismissed");
      fetchJobs();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); }
  };

  const handleCancelAccepted = async (j: Job) => {
    if (!user || !j.responseId) return;
    if (!confirm("Cancel this job? The customer will be notified and the request will be re-opened for other mechanics.")) return;
    setActing(j.issueId);
    try {
      await supabase.from("mechanic_responses").update({ status: "cancelled" } as any).eq("id", j.responseId);
      // Re-open for others
      await supabase.from("issues").update({ status: "open" } as any).eq("id", j.issueId);
      toast.success("Job cancelled");
      fetchJobs();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); }
  };

  const allPoints: [number, number][] = useMemo(() => {
    const p: [number, number][] = [];
    if (pos) p.push(pos);
    jobs.filter((j) => j.latitude != null && j.longitude != null)
      .forEach((j) => p.push([j.latitude!, j.longitude!]));
    return p;
  }, [pos, jobs]);

  const center = pos || CHENNAI_FALLBACK;
  const acceptedJobs = jobs.filter((j) => j.status === "accepted");
  const openJobs = jobs.filter((j) => j.status === "open");

  return (
    <div className="space-y-4">
      {acceptedJobs.length > 0 ? (
        // When a job is accepted, promote live customer tracker to the main map.
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" /> Active Job
          </h2>
          {acceptedJobs.map((j) => (
            <ActiveJobCard
              key={j.issueId}
              job={j}
              mechanicPos={pos}
              onCancel={() => handleCancelAccepted(j)}
              onChat={() => navigate(`/chat/${j.issueId}`)}
              cancelling={acting === j.issueId}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden border-border/60">
          <div className="h-[320px] sm:h-[420px] w-full">
            {pos ? (
              <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }} className="rounded-t-lg">
                <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={pos} icon={mechIcon}><Popup>You</Popup></Marker>
                {jobs
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
            {jobs.length === 0 ? "No active requests on map" : `${jobs.length} live request${jobs.length > 1 ? "s" : ""} · Tap a marker to view`}
          </div>
        </Card>
      )}


      {/* ACCEPTED JOB(S) — pinned at top */}
      {acceptedJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" /> Active Job
          </h2>
          {acceptedJobs.map((j) => (
            <ActiveJobCard
              key={j.issueId}
              job={j}
              mechanicPos={pos}
              onCancel={() => handleCancelAccepted(j)}
              onChat={() => navigate(`/chat/${j.issueId}`)}
              cancelling={acting === j.issueId}
            />
          ))}
        </div>
      )}

      {/* INCOMING REQUESTS */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" /> Incoming Requests
        </h2>
        {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
        {!loading && openJobs.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No requests yet. You'll see them here when customers nearby ask for help.
          </div>
        )}
        {openJobs.map((j) => (
          <div key={j.issueId} className="bg-card rounded-xl border border-border p-4 animate-slide-up space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-primary font-semibold">{issueTypeLabel(j.issue_type)}</p>
                <h3 className="font-semibold text-sm truncate">{j.userName || "Customer"}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {j.area || "Unknown area"}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded shrink-0 bg-primary/20 text-primary">new</span>
            </div>
            {j.vehicleLabel && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="h-3 w-3" /> {j.vehicleLabel}
              </p>
            )}
            {j.description && <p className="text-sm text-foreground">{j.description}</p>}

            {j.latitude != null && j.longitude != null && (
              <RequestMiniMap userLat={j.latitude} userLng={j.longitude} height={140} />
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleAccept(j)} disabled={acting === j.issueId} className="flex-1">
                {acting === j.issueId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Accept Job
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReject(j)} disabled={acting === j.issueId}>
                <X className="h-3 w-3 mr-1" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Active accepted job: live tracking mini map, status, chat & call & cancel. */
function ActiveJobCard({
  job,
  mechanicPos,
  onCancel,
  onChat,
  cancelling,
}: {
  job: Job;
  mechanicPos: [number, number] | null;
  onCancel: () => void;
  onChat: () => void;
  cancelling: boolean;
}) {
  const arrived =
    mechanicPos && job.latitude != null && job.longitude != null
      ? distanceMeters(mechanicPos, [job.latitude, job.longitude]) < 100
      : false;

  return (
    <div className="bg-card rounded-xl border border-success/40 p-4 animate-slide-up space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-success font-semibold">{issueTypeLabel(job.issue_type)}</p>
          <h3 className="font-semibold text-sm truncate">{job.userName || "Customer"}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {job.area || "Unknown area"}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${arrived ? "bg-success/30 text-success" : "bg-primary/20 text-primary"}`}>
          {arrived ? "Arrived" : "On the way"}
        </span>
      </div>
      {job.vehicleLabel && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Car className="h-3 w-3" /> {job.vehicleLabel}
        </p>
      )}
      {job.description && <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-2">{job.description}</p>}

      {job.latitude != null && job.longitude != null && (
        <LiveCustomerTracker
          customerUserId={job.userId}
          fallbackLat={job.latitude}
          fallbackLng={job.longitude}
          customerName={job.userName}
          customerPhone={job.userPhone}
          onChat={onChat}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {job.userPhone && (
          <a href={`tel:${job.userPhone}`}>
            <Button size="sm" variant="secondary"><Phone className="h-3 w-3 mr-1" /> +91 {job.userPhone}</Button>
          </a>
        )}
        {job.latitude != null && job.longitude != null && (
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="secondary"><Navigation className="h-3 w-3 mr-1" /> Open in Maps</Button>
          </a>
        )}
        <Button size="sm" variant="destructive" onClick={onCancel} disabled={cancelling} className="ml-auto">
          {cancelling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Ban className="h-3 w-3 mr-1" />} Cancel Job
        </Button>
      </div>
    </div>
  );
}
