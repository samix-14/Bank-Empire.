import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Metodo non consentito." });

  try {
    const body = await req.json();
    const browserId = body?.browser_id;
    if (!isUuid(browserId)) return json(400, { error: "Identificatore browser non valido." });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase service environment.");
      return json(500, { error: "Servizio anti-abuso non configurato." });
    }

    // Read the IP from gateway-provided headers only; never accept it from the request body.
    const rawIp = req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (!rawIp || rawIp.length > 100) return json(400, { error: "Impossibile verificare la rete." });

    // HMAC prevents a plain IP address or a trivially reversible plain hash from being stored.
    // The service-role key is a server-only secret; rotating it resets the ability to compare old IP fingerprints.
    const ipFingerprint = await hmacHex(serviceRoleKey, rawIp.trim().toLowerCase());

    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/be_check_registration_guard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ p_browser_id: browserId, p_ip_hmac: ipFingerprint }),
    });

    if (!rpcResponse.ok) {
      const detail = await rpcResponse.text();
      if (rpcResponse.status === 400 || rpcResponse.status === 409) {
        return json(429, { error: "Limite temporaneo di registrazione raggiunto. Riprova più tardi." });
      }
      console.error("Registration guard RPC failed:", rpcResponse.status, detail);
      return json(503, { error: "Controllo anti-abuso temporaneamente non disponibile." });
    }

    return json(200, { allowed: true });
  } catch (error) {
    console.error("Registration guard error:", error);
    return json(400, { error: "Richiesta anti-abuso non valida." });
  }
});
