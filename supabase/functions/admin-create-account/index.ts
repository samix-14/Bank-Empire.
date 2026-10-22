import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const allowedRoles = ["citizen", "imperatore", "banchiere_supremo", "admin_supremo", "comandante_militare", "ministro_economia", "assicuratore"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
  if (req.method !== "POST") return reply({ error: "Metodo non supportato." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization") || "";
  if (!url || !anon || !service || !authorization.startsWith("Bearer ")) return reply({ error: "Configurazione o sessione non valida." }, 401);

  const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await caller.auth.getUser();
  if (authError || !authData.user) return reply({ error: "Sessione non valida." }, 401);
  const { data: roleRows, error: roleError } = await caller.rpc("be_get_my_role");
  if (roleError || roleRows?.[0]?.role !== "admin_supremo") return reply({ error: "Solo l'Admin Supremo può creare account." }, 403);
  if (roleRows[0].banned_until && new Date(roleRows[0].banned_until) > new Date()) return reply({ error: "Account sospeso." }, 403);

  let input: { username?: string; password?: string; role?: string; empire_id?: string };
  try { input = await req.json(); } catch { return reply({ error: "Richiesta non valida." }, 400); }
  const username = String(input.username || "").trim();
  const password = String(input.password || "");
  const role = String(input.role || "citizen");
  const empire = String(input.empire_id || "auroria");
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) return reply({ error: "Username: 3-24 caratteri, lettere, numeri o underscore." }, 400);
  if (password.length < 10 || password.length > 72) return reply({ error: "La password deve contenere 10-72 caratteri." }, 400);
  if (!allowedRoles.includes(role)) return reply({ error: "Ruolo non valido." }, 400);
  if (!["auroria", "nova", "vesper"].includes(empire)) return reply({ error: "Impero non valido." }, 400);

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing } = await admin.from("profiles").select("id").ilike("username", username).maybeSingle();
  if (existing) return reply({ error: "Username già utilizzato." }, 409);

  const email = username.toLowerCase() + "@accounts.bank-empire.invalid";
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { username, empire_id: empire, managed_account: true },
  });
  if (createError || !created.user) return reply({ error: createError?.message || "Creazione account fallita." }, 400);

  const { error: profileError } = await admin.from("profiles")
    .update({ username, empire_id: empire, role }).eq("id", created.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return reply({ error: "Impossibile salvare il profilo: " + profileError.message }, 500);
  }
  await admin.from("admin_audit_log").insert({
    actor_id: authData.user.id, action: "account_created", target_user_id: created.user.id,
    details: { username, role, empire_id: empire },
  });
  return reply({ ok: true, username, role, empire_id: empire });
});
