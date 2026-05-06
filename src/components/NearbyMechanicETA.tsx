import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Navigation, Clock, Phone, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// --- Fix default Leaflet marker icons (Vite/CRA can't resolve assets automatically)
const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(220 90% 60%);border:3px solid white;box-shadow:0 0 0 3px hsla(220,90%,60%,0.35);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
const mechIcon = L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(263 56% 50%);border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);color:white;font-weight:700;font-size:14px;">🔧</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

type Mechanic = {
  user_id: string;
  name: string;
  garage_name: string;
  area: string;
  garage_address: string | null;
  phone_number: string | null;
  rating: number | null;
  latitude: number | null;
  longitude: number | null;
};

type EtaResult = {
  distanceKm: number;
  durationMin: number;
  route: [number, number][];
  mechLat: number;
  mechLng: number;
};

// Haversine for nearest pre-selection
function distKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [points, map]);
  return null;
}

const CHENNAI_FALLBACK: [number, number] = [13.0827, 80.2707];

export default function NearbyMechanicETA() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loadingMechs, setLoadingMechs] = useState(true);
  const [selected, setSelected] = useState<Mechanic | null>(null);
  const [eta, setEta] = useState<EtaResult | null>(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [etaError, setEtaError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // 1. Get geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setUserPos(CHENNAI_FALLBACK);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        console.warn("Geolocation error", err);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Showing Chennai by default."
            : "Could not get your location. Showing Chennai by default.",
        );
        setUserPos(CHENNAI_FALLBACK);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // 2. Load mechanics
  useEffect(() => {
    (async () => {
      setLoadingMechs(true);
      const { data, error } = await supabase
        .from("mechanic_profiles")
        .select("user_id,name,garage_name,area,garage_address,phone_number,rating,latitude,longitude");
      if (error) {
        console.error(error);
        toast.error("Failed to load mechanics");
      }
      setMechanics((data as any) || []);
      setLoadingMechs(false);
    })();
  }, []);

  // 3. Pick nearest mechanic with coords
  const nearest = useMemo(() => {
    if (!userPos || !mechanics.length) return null;
    const withCoords = mechanics.filter((m) => m.latitude != null && m.longitude != null);
    if (!withCoords.length) {
      // fallback: pick first mechanic with an address (server will geocode)
      return mechanics.find((m) => !!m.garage_address || !!m.area) || mechanics[0] || null;
    }
    return withCoords
      .slice()
      .sort(
        (a, b) =>
          distKm(userPos, [a.latitude!, a.longitude!]) -
          distKm(userPos, [b.latitude!, b.longitude!]),
      )[0];
  }, [userPos, mechanics]);

  useEffect(() => {
    if (!selected && nearest) setSelected(nearest);
  }, [nearest, selected]);

  // 4. Compute ETA + auto-refresh every 30s
  const computeEta = async (m: Mechanic, pos: [number, number]) => {
    setEtaLoading(true);
    setEtaError(null);
    try {
      const payload: Record<string, unknown> = {
        userLat: pos[0],
        userLng: pos[1],
      };
      if (m.latitude != null && m.longitude != null) {
        payload.mechLat = m.latitude;
        payload.mechLng = m.longitude;
      } else {
        const addrParts = [m.garage_name, m.garage_address, m.area, "Chennai", "Tamil Nadu", "India"]
          .filter(Boolean)
          .join(", ");
        payload.mechAddress = addrParts;
        payload.mechArea = m.area;
      }
      const { data, error } = await supabase.functions.invoke("mechanic-eta", { body: payload });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setEta(data as EtaResult);
    } catch (e: any) {
      console.error("ETA error", e);
      setEtaError(e?.message || "Could not compute ETA");
      setEta(null);
    } finally {
      setEtaLoading(false);
    }
  };

  useEffect(() => {
    if (!selected || !userPos) return;
    computeEta(selected, userPos);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      computeEta(selected, userPos);
    }, 30000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, userPos]);

  const center: [number, number] = userPos || CHENNAI_FALLBACK;
  const mechMarkerPos: [number, number] | null = eta
    ? [eta.mechLat, eta.mechLng]
    : selected && selected.latitude != null && selected.longitude != null
      ? [selected.latitude, selected.longitude]
      : null;

  const allPoints: [number, number][] = useMemo(() => {
    const p: [number, number][] = [];
    if (userPos) p.push(userPos);
    if (mechMarkerPos) p.push(mechMarkerPos);
    if (eta?.route?.length) p.push(...eta.route);
    return p;
  }, [userPos, mechMarkerPos, eta]);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/60">
        <div className="relative">
          <div className="h-[320px] sm:h-[420px] w-full">
            {userPos ? (
              <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
                className="rounded-t-lg"
              >
                <TileLayer
                  attribution=""
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={userPos} icon={userIcon}>
                  <Popup>You are here</Popup>
                </Marker>
                {mechMarkerPos && selected && (
                  <Marker position={mechMarkerPos} icon={mechIcon}>
                    <Popup>
                      <strong>{selected.garage_name}</strong>
                      <br />
                      {selected.area}
                    </Popup>
                  </Marker>
                )}
                {eta?.route?.length ? (
                  <Polyline
                    positions={eta.route}
                    pathOptions={{ color: "hsl(263, 56%, 55%)", weight: 5, opacity: 0.85 }}
                  />
                ) : null}
                <FitBounds points={allPoints} />
              </MapContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom info card (Uber/Rapido style) */}
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
          ) : !selected ? (
            <p className="text-sm text-muted-foreground">No mechanics available right now.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Nearest Mechanic
                  </p>
                  <h3 className="font-semibold text-base truncate">{selected.garage_name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {selected.name} · <MapPin className="inline h-3 w-3" /> {selected.area}
                  </p>
                </div>
                {selected.phone_number && (
                  <a href={`tel:${selected.phone_number}`}>
                    <Button size="icon" variant="secondary" className="rounded-full">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Navigation className="h-3 w-3" /> Distance
                  </p>
                  <p className="text-xl font-bold mt-1">
                    {etaLoading && !eta ? (
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    ) : eta ? (
                      <>
                        {eta.distanceKm}
                        <span className="text-xs font-normal text-muted-foreground ml-1">km</span>
                      </>
                    ) : (
                      "--"
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 border border-primary/30">
                  <p className="text-[10px] uppercase tracking-wide text-primary flex items-center gap-1">
                    <Clock className="h-3 w-3" /> ETA
                  </p>
                  <p className="text-xl font-bold mt-1 text-primary">
                    {etaLoading && !eta ? (
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    ) : eta ? (
                      <>
                        {Math.round(eta.durationMin)}
                        <span className="text-xs font-normal text-primary/70 ml-1">min</span>
                      </>
                    ) : (
                      "--"
                    )}
                  </p>
                </div>
              </div>

              {etaError && (
                <p className="text-xs text-destructive">{etaError}</p>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Auto-updates every 30s</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => userPos && selected && computeEta(selected, userPos)}
                  disabled={etaLoading}
                  className="h-7 px-2"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${etaLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Other nearby mechanics list */}
      {mechanics.length > 1 && userPos && (
        <Card className="p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Other mechanics nearby
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {mechanics
              .filter((m) => m.user_id !== selected?.user_id)
              .slice(0, 8)
              .map((m) => (
                <button
                  key={m.user_id}
                  onClick={() => setSelected(m)}
                  className="w-full flex items-center justify-between gap-2 p-2 rounded-md hover:bg-secondary/60 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.garage_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      <MapPin className="inline h-3 w-3" /> {m.area}
                    </p>
                  </div>
                  <Navigation className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
