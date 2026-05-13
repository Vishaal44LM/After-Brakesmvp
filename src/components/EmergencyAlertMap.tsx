import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

const sosIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;">
    <div style="width:42px;height:42px;border-radius:50%;background:hsl(0 84% 60%);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px hsla(0,84%,60%,0.35);animation:sospulse 1.4s infinite;">
      <span style="font-size:20px;">🚨</span>
    </div>
    <style>@keyframes sospulse{0%{box-shadow:0 0 0 0 hsla(0,84%,60%,0.6);}70%{box-shadow:0 0 0 18px hsla(0,84%,60%,0);}100%{box-shadow:0 0 0 0 hsla(0,84%,60%,0);}}</style>
  </div>`,
  iconSize: [42, 42], iconAnchor: [21, 21],
});

type Props = {
  alertId: string;
  initialLat?: number | null;
  initialLng?: number | null;
  userName?: string;
};

function Recenter({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(pos, map.getZoom()); }, [pos, map]);
  return null;
}

export default function EmergencyAlertMap({ alertId, initialLat, initialLng, userName }: Props) {
  const [pos, setPos] = useState<[number, number] | null>(
    initialLat != null && initialLng != null ? [initialLat, initialLng] : null,
  );

  // Re-fetch latest known coords on mount in case parent passed stale/null values
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("emergency_alerts")
        .select("latitude,longitude")
        .eq("id", alertId)
        .maybeSingle();
      if (!cancelled && data?.latitude != null && data?.longitude != null) {
        setPos([data.latitude as number, data.longitude as number]);
      }
    })();
    const ch = supabase
      .channel(`sos-${alertId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "emergency_alerts", filter: `id=eq.${alertId}` },
        (payload: any) => {
          const r = payload.new;
          if (r?.latitude != null && r?.longitude != null) setPos([r.latitude, r.longitude]);
        },
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [alertId]);

  if (!pos) {
    return (
      <div className="h-32 w-full rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Waiting for live location…
      </div>
    );
  }

  const navHref = `https://www.google.com/maps/dir/?api=1&destination=${pos[0]},${pos[1]}`;

  return (
    <div className="space-y-2">
      <div className="h-44 w-full rounded-lg overflow-hidden border border-destructive/40">
        <MapContainer center={pos} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={pos} icon={sosIcon}>
            <Popup>{userName || "User"} — live location</Popup>
          </Marker>
          <Recenter pos={pos} />
        </MapContainer>
      </div>
      <a href={navHref} target="_blank" rel="noopener noreferrer" className="block">
        <Button size="sm" variant="destructive" className="w-full">
          <Navigation className="h-3 w-3 mr-1" /> Navigate to user
        </Button>
      </a>
    </div>
  );
}
