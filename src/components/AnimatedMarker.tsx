import { useEffect, useRef } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

type Props = {
  position: [number, number];
  icon: L.DivIcon | L.Icon;
  duration?: number; // ms over which to interpolate to new position
  children?: React.ReactNode;
};

/**
 * Marker that smoothly animates between position updates for a premium
 * Rapido/Uber-style live tracking feel.
 */
export default function AnimatedMarker({ position, icon, duration = 950, children }: Props) {
  const markerRef = useRef<L.Marker | null>(null);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef<[number, number]>(position);

  useEffect(() => {
    const m = markerRef.current;
    if (!m) return;
    const from = fromRef.current;
    const to = position;
    if (from[0] === to[0] && from[1] === to[1]) return;

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic for smooth glide
      const eased = 1 - Math.pow(1 - t, 3);
      const lat = from[0] + (to[0] - from[0]) * eased;
      const lng = from[1] + (to[1] - from[1]) * eased;
      m.setLatLng([lat, lng]);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        rafRef.current = null;
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [position, duration]);

  return (
    <Marker ref={markerRef as any} position={fromRef.current} icon={icon}>
      {children}
    </Marker>
  );
}
