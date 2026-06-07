import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Search } from "lucide-react";

export type GeocodeResult = {
  display_name: string;
  lat: number;
  lng: number;
};

type Props = {
  onSelect: (r: GeocodeResult) => void;
  initialQuery?: string;
  placeholder?: string;
  /** Bias suggestions to this point (e.g. user GPS / Chennai). */
  near?: { lat: number; lng: number } | null;
};

/**
 * Address autocomplete + geocoding via Nominatim (OpenStreetMap).
 * No API key required. Debounced to be polite to the public endpoint.
 */
export default function AddressSearch({ onSelect, initialQuery = "", placeholder = "Enter your address", near }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    const q = query.trim();
    if (q.length < 3) { setResults([]); return; }
    timerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q,
          format: "json",
          addressdetails: "1",
          limit: "6",
          countrycodes: "in",
        });
        if (near) {
          // viewbox = left,top,right,bottom  (lon,lat,lon,lat) with a ~0.5° box
          const d = 0.5;
          params.set("viewbox", `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
          params.set("bounded", "0");
        }
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: { "Accept-Language": "en" },
        });
        const json = await res.json();
        setResults(
          (json as any[]).map((r) => ({
            display_name: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          })),
        );
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [query, near]);

  const choose = (r: GeocodeResult) => {
    justSelectedRef.current = true;
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(r);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-9 bg-secondary border-0"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-[1100] left-0 right-0 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              type="button"
              onClick={() => choose(r)}
              className="w-full flex items-start gap-2 px-3 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
              <span className="line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
