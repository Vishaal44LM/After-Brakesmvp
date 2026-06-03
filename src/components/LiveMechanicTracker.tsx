import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Loader2, Navigation, Clock, Phone, Star, MessageCircle, CheckCircle2, Bike, User as UserIcon, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AnimatedMarker from "./AnimatedMarker";

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(220 90% 60%);border:3px solid white;box-shadow:0 0 0 4px hsla(220,90%,60%,0.3);"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});
const mechIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;border-radius:50%;background:hsl(263 56% 50%);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
  </div>`,
  iconSize: [36, 36], iconAnchor: [18, 18],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const didFit = useRef(false);
  useEffect(() => {
    if (points.length < 2) return;
    if (didFit.current) return;
    map.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p[0], p[1]))), { padding: [50, 50], maxZoom: 16 });
    didFit.current = true;
  }, [points, map]);
  return null;
}

type Props = {
  mechanicId: string;
  mechanicName?: string;
  mechanicPhone?: string | null;
  mechanicPhotoUrl?: string | null;
  garageName?: string | null;
  rating?: number | null;
  totalRatings?: number | null;
  issueId?: string;
  onChat?: () => void;
};

type Eta = { distanceKm: number; durationMin: number; route: [number, number][] };

export default function LiveMechanicTracker({
  mechanicId,
  mechanicName,
  mechanicPhone,
  mechanicPhotoUrl,
  garageName,
  rating,
  totalRatings,
  onChat,
}: Props) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mechPos, setMechPos] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<Eta | null>(null);
  const [loadingEta, setLoadingEta] = useState(false);
  const lastEtaTs = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setUserPos([p.coords.latitude, p.coords.longitude]),
      (e) => console.warn(e),
      { enableHighAccuracy: true, maximumAge: 1000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("mechanic_locations")
        .select("latitude,longitude")
        .eq("mechanic_id", mechanicId)
        .maybeSingle();
      if (!cancelled && data) setMechPos([data.latitude, data.longitude]);
    })();
    const ch = supabase
      .channel(`mech-loc-${mechanicId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mechanic_locations", filter: `mechanic_id=eq.${mechanicId}` },
        (payload: any) => {
          const r = payload.new;
          if (r?.latitude != null) setMechPos([r.latitude, r.longitude]);
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [mechanicId]);

  useEffect(() => {
    if (!userPos || !mechPos) return;
    const now = Date.now();
    if (now - lastEtaTs.current < 8000 && eta) return;
    lastEtaTs.current = now;
    setLoadingEta(true);
    supabase.functions
      .invoke("mechanic-eta", {
        body: { userLat: userPos[0], userLng: userPos[1], mechLat: mechPos[0], mechLng: mechPos[1] },
      })
      .then(({ data, error }) => {
        if (error || (data as any)?.error) return;
        setEta(data as Eta);
      })
      .finally(() => setLoadingEta(false));
  }, [userPos, mechPos, eta]);

  const points: [number, number][] = useMemo(() => {
    const p: [number, number][] = [];
    if (userPos) p.push(userPos);
    if (mechPos) p.push(mechPos);
    return p;
  }, [userPos, mechPos]);

  const center: [number, number] = mechPos || userPos || [13.0827, 80.2707];

  const arrived =
    userPos && mechPos &&
    (() => {
      const toRad = (d: number) => (d * Math.PI) / 180;
      const R = 6371000;
      const dLat = toRad(mechPos[0] - userPos[0]);
      const dLng = toRad(mechPos[1] - userPos[1]);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(userPos[0])) * Math.cos(toRad(mechPos[0])) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a)) < 100;
    })();

  return (
    <div className="space-y-3">
      {/* Mechanic identity card */}
      <Card className="p-4 border-primary/40 bg-card">
        <div className="flex items-start gap-3">
          {mechanicPhotoUrl ? (
            <img src={mechanicPhotoUrl} alt={mechanicName || "Mechanic"} className="h-14 w-14 rounded-full object-cover border-2 border-primary/40 shrink-0" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <UserIcon className="h-7 w-7 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{mechanicName || "Mechanic"}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${arrived ? "bg-success/30 text-success" : "bg-primary/20 text-primary"}`}>
                {arrived ? (<><CheckCircle2 className="inline h-3 w-3 mr-0.5" />Arrived</>) : "On the way"}
              </span>
            </div>
            {garageName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <Briefcase className="h-3 w-3" /> {garageName}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-warning fill-warning" />
                {rating ? Number(rating).toFixed(1) : "New"}
                <span className="text-muted-foreground/70">/5</span>
              </span>
              <span>•</span>
              <span>{totalRatings || 0} jobs</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {mechanicPhone && (
            <a href={`tel:${mechanicPhone}`} className="flex-1 min-w-[120px]">
              <Button size="sm" className="w-full"><Phone className="h-3 w-3 mr-1" /> Call +91 {mechanicPhone}</Button>
            </a>
          )}
          {onChat && (
            <Button size="sm" variant="outline" onClick={onChat} className="flex-1 min-w-[100px]">
              <MessageCircle className="h-3 w-3 mr-1" /> Chat
            </Button>
          )}
        </div>
      </Card>

      {/* Live tracking map */}
      <Card className="overflow-hidden border-primary/40">
        <div className="h-[260px] sm:h-[340px] w-full">
          {userPos || mechPos ? (
            <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {userPos && <AnimatedMarker position={userPos} icon={userIcon}><Popup>You</Popup></AnimatedMarker>}
              {mechPos && (
                <AnimatedMarker position={mechPos} icon={mechIcon}>
                  <Popup>{mechanicName || "Mechanic"}</Popup>
                </AnimatedMarker>
              )}
              {eta?.route?.length ? (
                <Polyline positions={eta.route} pathOptions={{ color: "hsl(263 56% 55%)", weight: 5, opacity: 0.85 }} />
              ) : null}
              <FitBounds points={points} />
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="p-3 bg-card flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {arrived ? "Your mechanic has arrived" : !mechPos ? "Waiting for live location…" : "Live tracking active"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center"><Navigation className="h-3 w-3" /> KM</p>
              <p className="font-bold text-sm">{eta ? eta.distanceKm : loadingEta ? "…" : "--"}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-primary flex items-center gap-1 justify-center"><Clock className="h-3 w-3" /> ETA</p>
              <p className="font-bold text-sm text-primary">{eta ? `${Math.round(eta.durationMin)}m` : loadingEta ? "…" : "--"}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
