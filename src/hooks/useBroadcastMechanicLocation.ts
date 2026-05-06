import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Continuously broadcasts the current mechanic's GPS location to
 * `public.mechanic_locations` while they have at least one accepted response.
 * Uses watchPosition for low-latency Rapido-style tracking.
 */
export function useBroadcastMechanicLocation(mechanicId?: string | null, enabled = true) {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !mechanicId) return;
    if (!navigator.geolocation) return;

    const upsert = async (lat: number, lng: number, heading?: number | null, speed?: number | null) => {
      // Throttle to one write every 5s
      const now = Date.now();
      if (now - lastSentRef.current < 5000) return;
      lastSentRef.current = now;
      await supabase.from("mechanic_locations").upsert(
        {
          mechanic_id: mechanicId,
          latitude: lat,
          longitude: lng,
          heading: heading ?? null,
          speed: speed ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "mechanic_id" },
      );
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        upsert(pos.coords.latitude, pos.coords.longitude, pos.coords.heading, pos.coords.speed);
      },
      (err) => console.warn("Mechanic geolocation error", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [mechanicId, enabled]);
}
