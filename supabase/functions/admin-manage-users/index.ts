import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const roles = ["citizen", "imperatore", "banchiere_supremo", "admin_supremo", "comandante_militare", "ministro_economia", "assicuratore"];
const usernamePattern = /^[A-Za-z0-9_]{3,24}$/;
const aliasEmail = (username: string) => `${username.toLowerCase()}@accounts.bank-empire.invalid`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method !== "POST") return json({ error: "Metodo non supportato." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Configurazione server incompleta." }, 500);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Accesso richiesto." }, 401);
  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) return json({ error: "Sessione non valida." }, 401);
  const { data: roleRows, error: roleError } = await callerClient.rpc("be_get_my_role");
  if (roleError || !roleRows?.[0] || roleRows[0].role !== "admin_supremo") {
    return json({ error: "Solo l'Admin Supremo può creare account." }, 403);
  }
  if (roleRows[0].banned_until && new Date(roleRows[0].banned_until) > new Date()) {
    return json({ error: "Account sospeso." }, 403);
  }

  let input: { username?: string; password?: string; role?: string; empire_id?: string };
  try { input = await req.json(); } catch { return json({ error: "JSON non valido." }, 400); }
  const username = String(input.username || "").trim();
  const password = String(input.password || "");
  const role = String(input.role || "citizen");
  const empireId = String(input.empire_id || "auroria");

  if (!usernamePattern.test(username)) return json({ error: "Nome utente: 3-24 caratteri, lettere, numeri o underscore." }, 400);
  if (password.length < 10 || password.length > 72) return json({ error: "La password deve contenere da 10 a 72 caratteri." }, 400);
  if (!roles.includes(role)) return json({ error: "Ruolo non valido." }, 400);
  if (!["auroria", "nova", "vesper"].includes(empireId)) return json({ error: "Impero non valido." }, 400);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing } = await admin.from("profiles").select("id").ilike("username", username).maybeSingle();
  if (existing) return json({ error: "Nome utente già utilizzato." }, 409);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: aliasEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, empire_id: empireId, managed_account: true },
  });
  if (createError || !created.user) return json({ error: createError?.message || "Creazione account non riuscita." }, 400);

  // The profile trigger may create a default citizen profile. Set role only from this trusted server function.
  const { error: profileError } = await admin.from("profiles")
    .update({ username, empire_id: empireId, role })
    .eq("id", created.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: "Profilo non creato: " + profileError.message }, 500);
  }
  await admin.from("admin_audit_log").insert({
    actor_id: callerData.user.id, action: "account_created", target_user_id: created.user.id,
    details: { username, role, empire_id: empireId },
  });
  return json({ ok: true, username, role, empire_id: empireId });
});
