// Edge function: compute distance + ETA from user to mechanic via OpenRouteService.
// Optionally geocodes a mechanic address when lat/lng are not provided.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ORS_BASE = 'https://api.openrouteservice.org';

async function geocode(apiKey: string, text: string): Promise<[number, number] | null> {
  const url = `${ORS_BASE}/geocode/search?api_key=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(text)}&boundary.country=IN&size=1`;
  const r = await fetch(url);
  if (!r.ok) {
    console.error('Geocode failed', r.status, await r.text());
    return null;
  }
  const data = await r.json();
  const coords = data?.features?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return [coords[0], coords[1]]; // [lng, lat]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENROUTESERVICE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenRouteService API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { userLng, userLat } = body || {};
    let { mechLng, mechLat } = body || {};
    const mechAddress: string | undefined = body?.mechAddress;

    if (typeof userLng !== 'number' || typeof userLat !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid user coordinates' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mechArea: string | undefined = body?.mechArea;

    if (typeof mechLng !== 'number' || typeof mechLat !== 'number') {
      // Try multiple geocode candidates: full address, then area-only fallback
      const candidates: string[] = [];
      if (mechAddress) candidates.push(mechAddress);
      if (mechArea) {
        candidates.push(`${mechArea}, Chennai, Tamil Nadu, India`);
        candidates.push(`${mechArea}, Chennai, India`);
      }
      for (const c of candidates) {
        const cleaned = c.replace(/\s*,\s*,+/g, ',').replace(/^\s*,|,\s*$/g, '').trim();
        if (!cleaned) continue;
        console.log('Geocoding candidate:', cleaned);
        const geo = await geocode(apiKey, cleaned);
        if (geo) { mechLng = geo[0]; mechLat = geo[1]; break; }
      }
    }

    if (typeof mechLng !== 'number' || typeof mechLat !== 'number') {
      console.error('No mechanic coords resolved', { mechAddress, mechArea });
      return new Response(JSON.stringify({ error: 'Mechanic location unavailable' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orsRes = await fetch(
      `${ORS_BASE}/v2/directions/driving-car/geojson`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json',
        },
        body: JSON.stringify({
          coordinates: [[userLng, userLat], [mechLng, mechLat]],
        }),
      },
    );

    if (!orsRes.ok) {
      const txt = await orsRes.text();
      console.error('ORS routing error', orsRes.status, txt);
      return new Response(JSON.stringify({ error: 'Routing service failed', detail: txt }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await orsRes.json();
    const feature = data?.features?.[0];
    const summary = feature?.properties?.summary;
    const geometry = feature?.geometry;

    if (!summary || !geometry) {
      return new Response(JSON.stringify({ error: 'No route found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const distanceKm = +(summary.distance / 1000).toFixed(2);
    const durationMin = +(summary.duration / 60).toFixed(1);
    // GeoJSON coords are [lng, lat] -> convert to [lat, lng] for Leaflet
    const route = (geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]);

    return new Response(
      JSON.stringify({ distanceKm, durationMin, route, mechLat, mechLng }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('mechanic-eta error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
