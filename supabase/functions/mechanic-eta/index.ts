// Edge function: compute distance + ETA from user to mechanic via OpenRouteService
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    const { userLng, userLat, mechLng, mechLat } = body || {};

    if (
      typeof userLng !== 'number' || typeof userLat !== 'number' ||
      typeof mechLng !== 'number' || typeof mechLat !== 'number'
    ) {
      return new Response(JSON.stringify({ error: 'Invalid coordinates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orsRes = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
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
      console.error('ORS error', orsRes.status, txt);
      return new Response(JSON.stringify({ error: 'Routing service failed', detail: txt }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await orsRes.json();
    const feature = data?.features?.[0];
    const summary = feature?.properties?.summary;
    const geometry = feature?.geometry;

    if (!summary || !geometry) {
      return new Response(JSON.stringify({ error: 'No route found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const distanceKm = +(summary.distance / 1000).toFixed(2);
    const durationMin = +(summary.duration / 60).toFixed(1);
    // GeoJSON coords are [lng, lat] — convert to [lat, lng] for Leaflet
    const route = (geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]);

    return new Response(
      JSON.stringify({ distanceKm, durationMin, route }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('mechanic-eta error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
