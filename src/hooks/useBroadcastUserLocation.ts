import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Broadcasts the current user's GPS location to `public.user_locations`
 * while they have an active accepted job, so the assigned mechanic can
 * track them in real time (Rapido / Uber style).
 */
export function useBroadcastUserLocation(userId?: string | null, enabled = true) {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !userId) return;
    if (!navigator.geolocation) return;

    const upsert = async (lat: number, lng: number, heading?: number | null, speed?: number | null) => {
      const now = Date.now();
      // Throttle to ~1 write per second for low-latency tracking
      if (now - lastSentRef.current < 1000) return;
      lastSentRef.current = now;
      await supabase.from("user_locations").upsert(
        {
          user_id: userId,
          latitude: lat,
          longitude: lng,
          heading: heading ?? null,
          speed: speed ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => upsert(pos.coords.latitude, pos.coords.longitude, pos.coords.heading, pos.coords.speed),
      (err) => console.warn("User geolocation error", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [userId, enabled]);
}
