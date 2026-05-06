import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Loader2, Navigation, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(220 90% 60%);border:3px solid white;box-shadow:0 0 0 4px hsla(220,90%,60%,0.3);"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});
const mechIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;border-radius:50%;background:hsl(263 56% 50%);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
    <span style="font-size:18px;">🛵</span>
  </div>`,
  iconSize: [36, 36], iconAnchor: [18, 18],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p[0], p[1]))), { padding: [50, 50], maxZoom: 16 });
  }, [points, map]);
  return null;
}

type Props = {
  mechanicId: string;
  mechanicName?: string;
  mechanicPhone?: string | null;
};

type Eta = { distanceKm: number; durationMin: number; route: [number, number][] };

export default function LiveMechanicTracker({ mechanicId, mechanicName, mechanicPhone }: Props) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mechPos, setMechPos] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<Eta | null>(null);
  const [loadingEta, setLoadingEta] = useState(false);
  const lastEtaTs = useRef(0);

  // user geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setUserPos([p.coords.latitude, p.coords.longitude]),
      (e) => console.warn(e),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // initial mech location + realtime
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

  // recompute ETA when either position updates (throttled 15s)
  useEffect(() => {
    if (!userPos || !mechPos) return;
    const now = Date.now();
    if (now - lastEtaTs.current < 15000 && eta) return;
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

  return (
    <Card className="overflow-hidden border-primary/40">
      <div className="h-[280px] sm:h-[360px] w-full">
        {userPos || mechPos ? (
          <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {userPos && <Marker position={userPos} icon={userIcon}><Popup>You</Popup></Marker>}
            {mechPos && (
              <Marker position={mechPos} icon={mechIcon}>
                <Popup>{mechanicName || "Mechanic"}</Popup>
              </Marker>
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
          <p className="text-xs text-muted-foreground">Mechanic on the way</p>
          <p className="font-semibold truncate">{mechanicName || "Mechanic"}</p>
          {!mechPos && (
            <p className="text-[11px] text-warning mt-0.5">Waiting for live location…</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Navigation className="h-3 w-3" /> KM</p>
            <p className="font-bold text-sm">{eta ? eta.distanceKm : loadingEta ? "…" : "--"}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-primary flex items-center gap-1"><Clock className="h-3 w-3" /> ETA</p>
            <p className="font-bold text-sm text-primary">{eta ? `${Math.round(eta.durationMin)}m` : loadingEta ? "…" : "--"}</p>
          </div>
          {mechanicPhone && (
            <a href={`tel:${mechanicPhone}`}>
              <Button size="icon" variant="secondary" className="rounded-full h-9 w-9"><Phone className="h-4 w-4" /></Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
