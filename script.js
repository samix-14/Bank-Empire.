/* Bank Empire 0.7: autenticazione e database condiviso Supabase. */
(function () {
  "use strict";

  var SUPABASE_URL = "https://iprquijkhvugvzfjvibe.supabase.co";
  var SUPABASE_KEY = "sb_publishable_5bUbjJ6LpSyROlSq8F5xaA_omW2TGkL";
  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var currencies = {
    SOL: { name: "Solari" },
    AUR: { name: "Aurei" },
    NVC: { name: "Novacrediti" }
  };
  var empireNames = {
    auroria: "Impero di Auroria",
    nova: "Repubblica di Nova",
    vesper: "Dominio di Vesper"
  };
  var currentUser = null;
  var currentProfile = null;
  var pageTitles = {
    wallet: { title: "Portafoglio", description: "Il tuo saldo personale condiviso. Le valute restano separate e i fondi dello Stato non sono spendibili dal conto personale." },
    empires: { title: "Imperi", description: "Fondi governativi e patrimonio complessivo per valuta, aggiornati dal database condiviso." },
    ledger: { title: "Libro mastro", description: "Registro condiviso delle transazioni in cui sei mittente o destinatario." }
  };

  var content = document.getElementById("page-content");
  var authPanel = document.getElementById("auth-panel");
  var notice = document.getElementById("notice");
  var nav = document.getElementById("main-nav");
  var userLabel = document.getElementById("user-label");
  var logoutButton = document.getElementById("logout-button");
  var toastRegion = document.getElementById("toast-region");

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(value, currency) {
    return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)) + " " + currency;
  }
  function showToast(message) {
    toastRegion.innerHTML = '<div class="toast">' + esc(message) + '</div>';
    window.setTimeout(function () { toastRegion.innerHTML = ""; }, 3600);
  }
  function pageHeader(page) {
    var meta = pageTitles[page];
    return '<h1>' + meta.title + '</h1><p class="page-intro">' + meta.description + '</p>';
  }
  function setNotice(message) {
    notice.innerHTML = message;
  }

  function renderAuth(mode, message) {
    nav.hidden = true;
    logoutButton.hidden = true;
    userLabel.textContent = "Non hai effettuato l'accesso";
    content.innerHTML = "";
    authPanel.hidden = false;
    var isSignup = mode === "signup";
    authPanel.innerHTML =
      '<h1>Bank Empire</h1>' +
      '<p class="page-intro">Accedi per usare il tuo conto da qualsiasi dispositivo, oppure crea un account.</p>' +
      (message ? '<p class="notice">' + esc(message) + '</p>' : '') +
      '<div class="actions"><button type="button" id="show-login" ' + (!isSignup ? 'disabled' : '') + '>Accedi</button><button type="button" id="show-signup" ' + (isSignup ? 'disabled' : '') + '>Crea account</button></div>' +
      '<form id="auth-form">' +
      (isSignup ? '<div class="field"><label for="username">Nome utente (3–24 lettere, numeri o _)</label><input id="username" name="username" minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" autocomplete="username" required></div>' : '') +
      '<div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required></div>' +
      '<div class="field"><label for="password">Password (almeno 8 caratteri)</label><input id="password" name="password" type="password" minlength="8" autocomplete="' + (isSignup ? 'new-password' : 'current-password') + '" required></div>' +
      (isSignup ? '<div class="field"><label for="empire">Impero iniziale</label><select id="empire" name="empire"><option value="auroria">Impero di Auroria</option><option value="nova">Repubblica di Nova</option><option value="vesper">Dominio di Vesper</option></select></div>' : '') +
      '<div class="actions"><button type="submit">' + (isSignup ? 'Crea account' : 'Accedi') + '</button></div></form>' +
      '<p class="muted">I saldi iniziali sono a zero. Gli account e le transazioni sono condivisi; non inserire password usate su altri servizi.</p>';
    document.getElementById("show-login").addEventListener("click", function () { renderAuth("login"); });
    document.getElementById("show-signup").addEventListener("click", function () { renderAuth("signup"); });
    document.getElementById("auth-form").addEventListener("submit", function (event) {
      event.preventDefault();
      submitAuth(event.currentTarget, isSignup);
    });
  }

  async function submitAuth(form, isSignup) {
    var email = form.elements.email.value.trim();
    var password = form.elements.password.value;
    var result;
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      if (isSignup) {
        var username = form.elements.username.value.trim();
        var empire = form.elements.empire.value;
        result = await supabase.auth.signUp({
          email: email,
          password: password,
          options: { data: { username: username, empire_id: empire } }
        });
        if (result.error) throw result.error;
        if (!result.data.session) {
          renderAuth("login", "Account creato. Se la conferma email è attiva, apri il messaggio ricevuto e poi accedi.");
          return;
        }
      } else {
        result = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (result.error) throw result.error;
      }
      currentUser = result.data.user;
      await renderApp();
    } catch (error) {
      renderAuth(isSignup ? "signup" : "login", friendlyError(error));
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }

  function friendlyError(error) {
    var message = error && error.message ? error.message : "Operazione non riuscita.";
    if (/username|profiles_username_lower_unique|duplicate key/i.test(message)) return "Nome utente già usato. Scegline un altro.";
    if (/invalid login credentials/i.test(message)) return "Email o password non corretti.";
    if (/password should be at least/i.test(message)) return "La password deve contenere almeno 8 caratteri.";
    if (/user already registered/i.test(message)) return "Esiste già un account con questa email. Accedi.";
    return message;
  }

  async function loadProfile() {
    var result = await supabase.from("profiles").select("id, username, empire_id").eq("id", currentUser.id).single();
    if (result.error) throw result.error;
    currentProfile = result.data;
  }
  async function renderApp() {
    if (!currentUser) {
      renderAuth("login");
      setNotice("<strong>Database condiviso:</strong> accedi o crea un account per continuare.");
      return;
    }
    authPanel.hidden = true;
    nav.hidden = false;
    logoutButton.hidden = false;
    userLabel.textContent = currentProfile ? currentProfile.username : "Account connesso";
    setNotice("<strong>Connessione attiva:</strong> saldi e movimenti vengono letti dal database condiviso.");
    var page = location.hash.slice(1);
    if (!pageTitles[page]) page = "wallet";
    document.querySelectorAll("nav a[data-page]").forEach(function (link) {
      var active = link.dataset.page === page;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    try {
      if (!currentProfile) await loadProfile();
      userLabel.textContent = currentProfile.username;
      if (page === "wallet") await renderWallet();
      else if (page === "empires") await renderEmpires();
      else await renderLedger();
    } catch (error) {
      content.innerHTML = '<section class="panel"><h2>Non riesco a caricare i dati</h2><p>' + esc(friendlyError(error)) + '</p><button id="retry-load" type="button">Riprova</button></section>';
      document.getElementById("retry-load").addEventListener("click", renderApp);
    }
  }

  async function fetchProfiles() {
    var result = await supabase.from("profiles").select("id, username, empire_id").order("username");
    if (result.error) throw result.error;
    return result.data || [];
  }
  async function renderWallet() {
    var [walletResult, profiles, transactionResult] = await Promise.all([
      supabase.from("wallets").select("currency, balance").eq("user_id", currentUser.id),
      fetchProfiles(),
      supabase.from("transactions").select("id, from_user, to_user, currency, amount, description, created_at").or("from_user.eq." + currentUser.id + ",to_user.eq." + currentUser.id).order("created_at", { ascending: false }).limit(8)
    ]);
    if (walletResult.error) throw walletResult.error;
    if (transactionResult.error) throw transactionResult.error;
    var balances = {};
    (walletResult.data || []).forEach(function (w) { balances[w.currency] = Number(w.balance); });
    var profileById = {};
    profiles.forEach(function (p) { profileById[p.id] = p; });
    var recipients = profiles.filter(function (p) { return p.id !== currentUser.id; }).map(function (p) {
      return '<option value="' + esc(p.username) + '">' + esc(p.username) + ' · ' + esc(empireNames[p.empire_id] || p.empire_id) + '</option>';
    }).join("");
    var cards = Object.keys(currencies).map(function (code) {
      return '<article class="balance-card"><div class="currency">' + esc(currencies[code].name) + ' (' + code + ')</div><div class="amount">' + money(balances[code] || 0, code) + '</div></article>';
    }).join("");
    content.innerHTML = pageHeader("wallet") +
      '<div class="panel"><h2>Conto personale</h2><p><strong>' + esc(currentProfile.username) + '</strong></p><p class="muted">Impero: ' + esc(empireNames[currentProfile.empire_id] || currentProfile.empire_id) + '. I fondi governativi sono separati.</p></div>' +
      '<div class="balance-grid">' + cards + '</div>' +
      '<section class="panel"><h2>Nuova transazione</h2><p class="muted">Trasferimenti tra utenti registrati, nella stessa valuta, senza commissioni né conversioni.</p>' +
      (recipients ? '<form id="transaction-form"><div class="form-grid">' +
      '<div class="field"><label for="recipient">Destinatario</label><select id="recipient" name="recipient" required>' + recipients + '</select></div>' +
      '<div class="field"><label for="currency">Valuta</label><select id="currency" name="currency" required>' + Object.keys(currencies).map(function (code) { return '<option value="' + code + '">' + code + ' · ' + esc(currencies[code].name) + '</option>'; }).join("") + '</select></div>' +
      '<div class="field"><label for="amount">Importo</label><input id="amount" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" required></div>' +
      '<div class="field"><label for="description">Causale</label><input id="description" name="description" maxlength="120" placeholder="Descrizione della transazione" required></div>' +
      '</div><div class="actions"><button type="submit">Conferma trasferimento</button></div></form>' :
      '<div class="empty">Serve almeno un altro account registrato per effettuare un trasferimento.</div>') +
      '</section><section class="panel"><h2>Movimenti recenti</h2>' + transactionRows(transactionResult.data || [], profileById, currentUser.id, false) + '</section>';
    var form = document.getElementById("transaction-form");
    if (form) form.addEventListener("submit", submitTransaction);
  }

  function transactionRows(rows, profileById, userId, full) {
    if (!rows.length) return '<div class="empty">Nessuna transazione ancora registrata.</div>';
    return '<div class="table-wrap"><table><thead><tr>' +
      (full ? '<th>Riferimento</th>' : '') + '<th>Data</th><th>Operazione</th>' +
      (full ? '<th>Mittente</th><th>Destinatario</th>' : '') + '<th>Importo</th></tr></thead><tbody>' +
      rows.map(function (t) {
        var outgoing = t.from_user === userId;
        var from = profileById[t.from_user];
        var to = profileById[t.to_user];
        var date = new Date(t.created_at).toLocaleString("it-IT");
        return '<tr>' + (full ? '<td>BE-' + esc(t.id) + '</td>' : '') +
          '<td>' + esc(date) + '</td><td>' + esc(t.description) +
          (full ? '' : '<br><small>' + (outgoing ? 'Destinatario: ' + esc(to ? to.username : "utente") : 'Mittente: ' + esc(from ? from.username : "utente")) + '</small>') +
          '</td>' + (full ? '<td>' + esc(from ? from.username : "utente") + '</td><td>' + esc(to ? to.username : "utente") + '</td>' : '') +
          '<td class="' + (outgoing ? 'amount-negative' : 'amount-positive') + '">' + (outgoing ? '−' : '+') + money(t.amount, t.currency) + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  async function submitTransaction(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      var result = await supabase.rpc("transfer_funds", {
        recipient_username: form.elements.recipient.value,
        transfer_currency: form.elements.currency.value,
        transfer_amount: Number(form.elements.amount.value),
        transfer_description: form.elements.description.value.trim()
      });
      if (result.error) throw result.error;
      showToast("Trasferimento completato. Riferimento BE-" + result.data + ".");
      await renderApp();
    } catch (error) {
      showToast(friendlyError(error));
      button.disabled = false;
    }
  }

  async function renderEmpires() {
    var [empiresResult, summaryResult] = await Promise.all([
      supabase.from("empires").select("id, name, leader").order("id"),
      supabase.rpc("get_empire_summary")
    ]);
    if (empiresResult.error) throw empiresResult.error;
    if (summaryResult.error) throw summaryResult.error;
    var grouped = {};
    (summaryResult.data || []).forEach(function (row) {
      if (!grouped[row.empire_id]) grouped[row.empire_id] = {};
      grouped[row.empire_id][row.currency] = row;
    });
    content.innerHTML = pageHeader("empires") +
      '<p class="muted">Il patrimonio complessivo è mostrato separatamente per valuta: saldi dei cittadini + fondi governativi. Non vengono sommati valori di valute diverse.</p>' +
      '<div class="empire-grid">' + (empiresResult.data || []).map(function (empire) {
        var currenciesHtml = Object.keys(currencies).map(function (code) {
          var row = (grouped[empire.id] || {})[code] || {};
          var citizenTotal = Number(row.citizen_total || 0);
          var governmentTotal = Number(row.government_total || 0);
          return '<div class="currency-line"><span>' + code + ' <small>(cittadini ' + money(citizenTotal, code) + ' + Stato ' + money(governmentTotal, code) + ')</small></span><strong>' + money(citizenTotal + governmentTotal, code) + '</strong></div>';
        }).join("");
        return '<article class="empire-card"><h2>' + esc(empire.name) + '</h2><p>Leader indicato: ' + esc(empire.leader || "Non definito") + '<br>Utenti registrati: ' + Number((grouped[empire.id] || {}).SOL && (grouped[empire.id].SOL.citizen_count) || 0) + '</p><h3>Patrimonio complessivo per valuta</h3><div class="currency-list">' + currenciesHtml + '</div></article>';
      }).join("") + '</div>';
  }

  async function renderLedger() {
    var [transactionResult, profiles] = await Promise.all([
      supabase.from("transactions").select("id, from_user, to_user, currency, amount, description, created_at").or("from_user.eq." + currentUser.id + ",to_user.eq." + currentUser.id).order("created_at", { ascending: false }).limit(100),
      fetchProfiles()
    ]);
    if (transactionResult.error) throw transactionResult.error;
    var profileById = {};
    profiles.forEach(function (p) { profileById[p.id] = p; });
    content.innerHTML = pageHeader("ledger") + '<section class="panel"><h2>Transazioni registrate</h2>' +
      transactionRows(transactionResult.data || [], profileById, currentUser.id, true) + '</section>';
  }

  logoutButton.addEventListener("click", async function () {
    logoutButton.disabled = true;
    var result = await supabase.auth.signOut();
    logoutButton.disabled = false;
    if (result.error) showToast(friendlyError(result.error));
  });
  window.addEventListener("hashchange", function () { if (currentUser) renderApp(); });
  supabase.auth.onAuthStateChange(function (_event, session) {
    currentUser = session ? session.user : null;
    currentProfile = null;
    window.setTimeout(function () { renderApp(); }, 0);
  });

  async function init() {
    setNotice("<strong>Bank Empire:</strong> collegamento al database condiviso.");
    var result = await supabase.auth.getSession();
    if (result.error) {
      renderAuth("login", friendlyError(result.error));
      return;
    }
    currentUser = result.data.session ? result.data.session.user : null;
    await renderApp();
  }
  init();
})();
