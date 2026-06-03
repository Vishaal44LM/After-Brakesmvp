import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Loader2, Navigation, Clock, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AnimatedMarker from "./AnimatedMarker";

const customerIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(0 70% 50%);border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg);"><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [30, 30], iconAnchor: [15, 30],
});
const meIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;border-radius:50%;background:hsl(263 56% 50%);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.45);">
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
  customerUserId: string;
  fallbackLat?: number | null;
  fallbackLng?: number | null;
  customerName?: string;
  customerPhone?: string | null;
  onChat?: () => void;
};

type Eta = { distanceKm: number; durationMin: number; route: [number, number][] };

/**
 * Mechanic-facing live customer tracker. Shows my (mechanic) GPS,
 * the customer's live broadcast location, the fastest driving route
 * and an updating ETA — refreshed every few seconds.
 */
export default function LiveCustomerTracker({
  customerUserId,
  fallbackLat,
  fallbackLng,
  customerName,
  customerPhone,
  onChat,
}: Props) {
  const [mePos, setMePos] = useState<[number, number] | null>(null);
  const [custPos, setCustPos] = useState<[number, number] | null>(
    fallbackLat != null && fallbackLng != null ? [fallbackLat, fallbackLng] : null,
  );
  const [eta, setEta] = useState<Eta | null>(null);
  const [loadingEta, setLoadingEta] = useState(false);
  const lastEtaRef = useRef(0);

  // mechanic's own location (high-frequency)
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setMePos([p.coords.latitude, p.coords.longitude]),
      (e) => console.warn(e),
      { enableHighAccuracy: true, maximumAge: 1000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // customer initial + realtime
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_locations")
        .select("latitude,longitude")
        .eq("user_id", customerUserId)
        .maybeSingle();
      if (!cancelled && data) setCustPos([data.latitude, data.longitude]);
    })();
    const ch = supabase
      .channel(`cust-loc-${customerUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_locations", filter: `user_id=eq.${customerUserId}` },
        (payload: any) => {
          const r = payload.new;
          if (r?.latitude != null) setCustPos([r.latitude, r.longitude]);
        },
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [customerUserId]);

  // Recompute ETA every ~8s
  useEffect(() => {
    if (!mePos || !custPos) return;
    const now = Date.now();
    if (now - lastEtaRef.current < 8000 && eta) return;
    lastEtaRef.current = now;
    setLoadingEta(true);
    supabase.functions
      .invoke("mechanic-eta", {
        body: { userLat: custPos[0], userLng: custPos[1], mechLat: mePos[0], mechLng: mePos[1] },
      })
      .then(({ data, error }) => {
        if (error || (data as any)?.error) return;
        setEta(data as Eta);
      })
      .finally(() => setLoadingEta(false));
  }, [mePos, custPos, eta]);

  const points: [number, number][] = useMemo(() => {
    const p: [number, number][] = [];
    if (mePos) p.push(mePos);
    if (custPos) p.push(custPos);
    return p;
  }, [mePos, custPos]);

  const center: [number, number] = custPos || mePos || [13.0827, 80.2707];
  const arrived = mePos && custPos && distanceMeters(mePos, custPos) < 100;

  return (
    <Card className="overflow-hidden border-primary/40">
      <div className="h-[280px] sm:h-[360px] w-full">
        {mePos || custPos ? (
          <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {custPos && (
              <AnimatedMarker position={custPos} icon={customerIcon}>
                <Popup>{customerName || "Customer"}</Popup>
              </AnimatedMarker>
            )}
            {mePos && (
              <AnimatedMarker position={mePos} icon={meIcon}>
                <Popup>You</Popup>
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
          <span className={`inline-block text-[10px] px-2 py-0.5 rounded mb-1 ${arrived ? "bg-success/30 text-success" : "bg-primary/20 text-primary"}`}>
            {arrived ? "✅ You've arrived" : "🛵 Heading to customer"}
          </span>
          <p className="font-semibold truncate">{customerName || "Customer"}</p>
          {!custPos && <p className="text-[11px] text-warning mt-0.5">Waiting for customer location…</p>}
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
          {onChat && (
            <Button size="icon" variant="outline" className="rounded-full h-9 w-9" onClick={onChat}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
          {customerPhone && (
            <a href={`tel:${customerPhone}`}>
              <Button size="icon" variant="secondary" className="rounded-full h-9 w-9"><Phone className="h-4 w-4" /></Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

function distanceMeters(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a[0])) * Math.cos(toRad(b[0]));
  return 2 * R * Math.asin(Math.sqrt(x));
}
