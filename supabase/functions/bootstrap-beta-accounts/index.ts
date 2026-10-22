import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-beta-bootstrap-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
  if (req.method !== "POST") return reply({ error: "Metodo non supportato." }, 405);
  const secret = Deno.env.get("BETA_BOOTSTRAP_SECRET") || "";
  if (secret.length < 32 || req.headers.get("x-beta-bootstrap-secret") !== secret) return reply({ error: "Autorizzazione non valida." }, 403);

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return reply({ error: "Configurazione server incompleta." }, 500);
  let input: { accounts?: Array<{ username: string; password: string; role: string; empire_id: string }> };
  try { input = await req.json(); } catch { return reply({ error: "JSON non valido." }, 400); }
  if (!Array.isArray(input.accounts) || input.accounts.length !== 3) return reply({ error: "Invia esattamente tre account beta." }, 400);
  const allowed = ["imperatore", "banchiere_supremo", "admin_supremo"];
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const seen = new Set<string>();
  const selectedRoles = new Set<string>();
  const results = [];

  for (const account of input.accounts) {
    const username = String(account.username || "").trim();
    const password = String(account.password || "");
    if (!/^[A-Za-z0-9_]{3,24}$/.test(username) || password.length < 10 || password.length > 72 ||
        !allowed.includes(account.role) || !["auroria", "nova", "vesper"].includes(account.empire_id) ||
        seen.has(username.toLowerCase()) || selectedRoles.has(account.role)) {
      return reply({ error: "Dati non validi: username/password/ruolo/impero duplicato o non conforme." }, 400);
    }
    seen.add(username.toLowerCase());
    selectedRoles.add(account.role);
  }
  if (["imperatore", "banchiere_supremo", "admin_supremo"].some((role) => !selectedRoles.has(role))) {
    return reply({ error: "La beta richiede esattamente un account per ciascun ruolo: imperatore, banchiere_supremo e admin_supremo." }, 400);
  }

  for (const account of input.accounts) {
    const username = account.username.trim();
    const { data: existing } = await admin.from("profiles").select("id").ilike("username", username).maybeSingle();
    if (existing) { results.push({ username, status: "already_exists" }); continue; }
    const { data: created, error } = await admin.auth.admin.createUser({
      email: username.toLowerCase() + "@accounts.bank-empire.invalid",
      password: account.password, email_confirm: true,
      user_metadata: { username, empire_id: account.empire_id, beta_test_account: true },
    });
    if (error || !created.user) { results.push({ username, status: "error", message: error?.message || "Creazione fallita" }); continue; }
    const { error: profileError } = await admin.from("profiles")
      .update({ username, empire_id: account.empire_id, role: account.role }).eq("id", created.user.id);
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      results.push({ username, status: "error", message: profileError.message });
    } else {
      results.push({ username, status: "created", role: account.role });
    }
  }
  return reply({ results, warning: "Endpoint solo beta. Dopo l'esecuzione, disabilita la funzione e rimuovi BETA_BOOTSTRAP_SECRET." });
});
