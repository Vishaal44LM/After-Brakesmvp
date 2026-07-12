import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(0 70% 50%);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});
const mechIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50%;background:hsl(1 93% 51%);border:2px solid white;box-shadow:0 0 0 3px hsla(1,93%,51%,0.35);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function Fit({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!pts.length) return;
    if (pts.length === 1) {
      map.setView(pts[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1]))), { padding: [25, 25], maxZoom: 16 });
    }
  }, [pts, map]);
  return null;
}

type Props = {
  userLat: number;
  userLng: number;
  trackMechanicId?: string | null;
  height?: number;
};

/**
 * Distance in meters between two lat/lng coords.
 */
export function distanceMeters(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function RequestMiniMap({ userLat, userLng, trackMechanicId, height = 160 }: Props) {
  const [mechPos, setMechPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!trackMechanicId) { setMechPos(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("mechanic_locations")
        .select("latitude,longitude")
        .eq("mechanic_id", trackMechanicId)
        .maybeSingle();
      if (!cancelled && data) setMechPos([data.latitude, data.longitude]);
    })();
    const ch = supabase
      .channel(`mini-mech-loc-${trackMechanicId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mechanic_locations", filter: `mechanic_id=eq.${trackMechanicId}` },
        (payload: any) => {
          const r = payload.new;
          if (r?.latitude != null) setMechPos([r.latitude, r.longitude]);
        },
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [trackMechanicId]);

  const pts: [number, number][] = useMemo(() => {
    const p: [number, number][] = [[userLat, userLng]];
    if (mechPos) p.push(mechPos);
    return p;
  }, [userLat, userLng, mechPos]);

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden border border-border/60">
      <MapContainer center={[userLat, userLng]} zoom={14} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[userLat, userLng]} icon={userIcon} />
        {mechPos && <Marker position={mechPos} icon={mechIcon} />}
        <Fit pts={pts} />
      </MapContainer>
    </div>
  );
}
