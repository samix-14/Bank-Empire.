/* Bank Empire 0.8: conti separati, imperi e cambio valuta. */
(function () {
  "use strict";
  var SUPABASE_URL = "https://iprquijkhvugvzfjvibe.supabase.co";
  var SUPABASE_KEY = "sb_publishable_5bUbjJ6LpSyROlSq8F5xaA_omW2TGkL";
  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var currentUser = null;
  var currentProfile = null;
  var pageTitles = {
    accounts: { title: "Conti", description: "Gestisci fino a quattro conti separati. Ogni conto ha una password propria e saldi indipendenti per valuta." },
    empires: { title: "Imperi", description: "Patrimonio dei cittadini, fondi statali e assicurazioni dimostrative configurate per ciascun impero." },
    ledger: { title: "Libro mastro", description: "Movimenti del conto aperto, inclusi trasferimenti e cambi valuta." },
    exchange: { title: "Cambio valuta", description: "Converti fondi tra valute usando i tassi configurati nel database. I tassi iniziali sono segnaposto dimostrativi." }
  };
  var content = document.getElementById("page-content");
  var authPanel = document.getElementById("auth-panel");
  var notice = document.getElementById("notice");
  var nav = document.getElementById("main-nav");
  var userLabel = document.getElementById("user-label");
  var logoutButton = document.getElementById("logout-button");
  var toastRegion = document.getElementById("toast-region");
  var ACTIVE_TOKEN = "be_active_account_token";
  var ACTIVE_ID = "be_active_account_id";

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
  function setNotice(message) { notice.innerHTML = message; }
  function friendlyError(error) {
    var message = error && error.message ? error.message : "Operazione non riuscita.";
    if (/username|profiles_username_lower_unique|duplicate key/i.test(message)) return "Nome utente o nome conto già utilizzato. Scegline un altro.";
    if (/invalid login credentials/i.test(message)) return "Email o password non corretti.";
    if (/password should be at least/i.test(message)) return "La password deve contenere almeno 8 caratteri.";
    if (/user already registered/i.test(message)) return "Esiste già un account con questa email. Accedi.";
    return message;
  }
  function pageHeader(page) {
    var meta = pageTitles[page];
    return '<h1>' + meta.title + '</h1><p class="page-intro">' + meta.description + '</p>';
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
      '<p class="page-intro">Accedi al tuo account principale oppure registrati. Il conto iniziale riceve il bonus previsto dall’assicurazione dimostrativa del tuo impero.</p>' +
      (message ? '<p class="notice">' + esc(message) + '</p>' : '') +
      '<div class="actions"><button type="button" id="show-login" ' + (!isSignup ? 'disabled' : '') + '>Accedi</button><button type="button" id="show-signup" ' + (isSignup ? 'disabled' : '') + '>Crea account</button></div>' +
      '<form id="auth-form">' +
      (isSignup ? '<div class="field"><label for="username">Nome utente (3–24 lettere, numeri o _)</label><input id="username" name="username" minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" autocomplete="username" required></div>' : '') +
      '<div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required></div>' +
      '<div class="field"><label for="password">Password account principale (almeno 8 caratteri)</label><input id="password" name="password" type="password" minlength="8" autocomplete="' + (isSignup ? 'new-password' : 'current-password') + '" required></div>' +
      (isSignup ? '<div class="field"><label for="initial-account-name">Nome del conto iniziale</label><input id="initial-account-name" name="initial_account_name" minlength="2" maxlength="32" placeholder="Es. Conto principale" required></div>' : '') +
      (isSignup ? '<div class="field"><label for="empire">Impero principale</label><select id="empire" name="empire"><option value="auroria">Impero di Auroria</option><option value="nova">Repubblica di Nova</option><option value="vesper">Dominio di Vesper</option></select></div>' : '') +
      '<div class="actions"><button type="submit">' + (isSignup ? 'Crea account' : 'Accedi') + '</button></div></form>' +
      '<p class="muted">La password del conto viene impostata dopo il primo accesso e resta separata da quella dell’account principale.</p>';
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
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      var result;
      if (isSignup) {
        result = await supabase.auth.signUp({
          email: email,
          password: password,
          options: { data: {
            username: form.elements.username.value.trim(),
            empire_id: form.elements.empire.value,
            initial_account_name: form.elements.initial_account_name.value.trim()
          } }
        });
      } else {
        result = await supabase.auth.signInWithPassword({ email: email, password: password });
      }
      if (result.error) throw result.error;
      if (isSignup && !result.data.session) {
        renderAuth("login", "Account creato. Conferma l’email se richiesto, poi accedi per impostare la password del conto iniziale.");
        return;
      }
      currentUser = result.data.user;
      currentProfile = null;
      await renderApp();
    } catch (error) {
      renderAuth(isSignup ? "signup" : "login", friendlyError(error));
    } finally {
      if (button.isConnected) button.disabled = false;
    }
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
    setNotice("<strong>Connessione attiva:</strong> dati economici e trasferimenti sono gestiti da Supabase.");
    try {
      if (!currentProfile) await loadProfile();
      userLabel.textContent = currentProfile.username;
      var page = location.hash.slice(1);
      if (!pageTitles[page]) page = "accounts";
      document.querySelectorAll("nav a[data-page]").forEach(function (link) {
        var active = link.dataset.page === page;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
      });
      if (page === "accounts") await renderAccounts();
      else if (page === "empires") await renderEmpires();
      else if (page === "exchange") await renderExchange();
      else await renderLedger();
    } catch (error) {
      content.innerHTML = '<section class="panel"><h2>Non riesco a caricare i dati</h2><p>' + esc(friendlyError(error)) + '</p><button id="retry-load" type="button">Riprova</button></section>';
      document.getElementById("retry-load").addEventListener("click", renderApp);
    }
  }

  function storeAccountSession(row) {
    sessionStorage.setItem(ACTIVE_TOKEN, row.access_token);
    sessionStorage.setItem(ACTIVE_ID, row.account_id);
  }
  function clearAccountSession() {
    sessionStorage.removeItem(ACTIVE_TOKEN);
    sessionStorage.removeItem(ACTIVE_ID);
  }
  function activeToken() { return sessionStorage.getItem(ACTIVE_TOKEN); }

  async function renderAccounts(message) {
    var result = await supabase.rpc("get_my_accounts");
    if (result.error) throw result.error;
    var accounts = result.data || [];
    var activeId = sessionStorage.getItem(ACTIVE_ID);
    var active = accounts.find(function (account) { return account.account_id === activeId; }) || null;
    var token = activeToken();
    var activeView = "";
    if (active && token && !active.password_initialized) {
      clearAccountSession();
      token = null;
    }
    if (active && token) {
      var balancesResult = await supabase.rpc("get_account_balances", { p_access_token: token });
      if (balancesResult.error) {
        clearAccountSession();
        token = null;
        active = null;
      } else {
        var balances = balancesResult.data || [];
        var movementsResult = await supabase.rpc("get_account_transactions", { p_access_token: token });
        if (movementsResult.error) throw movementsResult.error;
        var hasMoney = balances.some(function (b) { return Number(b.balance) > 0; });
        activeView = '<section class="panel active-account"><div class="account-heading"><div><p class="eyebrow">CONTO APERTO</p><h2>' + esc(active.account_name) + (active.is_initial ? ' <span class="tag">Iniziale</span>' : '') + '</h2></div><button type="button" id="lock-account" class="secondary">Blocca conto</button></div>' +
          '<div class="balance-grid">' + balances.map(function (balance) {
            return '<article class="balance-card"><div class="currency">' + esc(balance.currency_name) + ' (' + esc(balance.currency) + ')</div><div class="amount">' + money(balance.balance, balance.currency) + '</div></article>';
          }).join("") + '</div>' +
          '<form id="transfer-form"><h3>Trasferisci a un altro conto</h3><div class="form-grid">' +
          '<div class="field"><label for="recipient-account">Nome del conto destinatario</label><input id="recipient-account" name="recipient_account" minlength="2" maxlength="32" required></div>' +
          '<div class="field"><label for="currency">Valuta</label><select id="currency" name="currency" required>' + balances.filter(function (b) { return Number(b.balance) > 0; }).map(function (b) { return '<option value="' + esc(b.currency) + '">' + esc(b.currency_name) + ' (' + esc(b.currency) + ') · ' + money(b.balance, b.currency) + '</option>'; }).join("") + '</select></div>' +
          '<div class="field"><label for="amount">Importo</label><input id="amount" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" required></div>' +
          '<div class="field"><label for="description">Causale</label><input id="description" name="description" maxlength="120" placeholder="Descrizione del trasferimento" required></div>' +
          '</div><div class="actions"><button type="submit" ' + (hasMoney ? '' : 'disabled') + '>Conferma trasferimento</button></div>' +
          (hasMoney ? '' : '<p class="muted">Questo conto non ha ancora fondi trasferibili.</p>') + '</form>' +
          '<h3>Movimenti recenti</h3>' + transactionTable(movementsResult.data || []) + '</section>';
      }
    }

    var setupForm = "";
    var initialUnconfigured = accounts.find(function (a) { return a.is_initial && !a.password_initialized; });
    if (initialUnconfigured) {
      setupForm = '<section class="panel"><h2>Completa il conto iniziale</h2><p>Il bonus assicurativo è già assegnato a questo conto. Imposta ora una password separata dall’account principale.</p>' +
        '<form id="initial-password-form"><input type="hidden" name="account_name" value="' + esc(initialUnconfigured.account_name) + '"><div class="field"><label for="initial-account-password">Nuova password del conto (8–72 caratteri)</label><input id="initial-account-password" name="account_password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div><div class="actions"><button type="submit">Imposta password e apri conto</button></div></form></section>';
    }

    content.innerHTML = pageHeader("accounts") +
      (message ? '<p class="notice">' + esc(message) + '</p>' : '') +
      '<section class="panel"><div class="account-heading"><div><h2>I tuoi conti</h2><p class="muted">Account principale: ' + esc(currentProfile.username) + ' · ' + accounts.length + ' di 4 conti utilizzati</p></div></div>' +
      (accounts.length ? '<div class="account-list">' + accounts.map(function (a) {
        return '<div class="account-row"><div><strong>' + esc(a.account_name) + '</strong><p class="muted">' + (a.is_initial ? 'Conto iniziale · riceve il bonus assicurativo una sola volta' : 'Conto aggiuntivo · nessun bonus iniziale') + '</p></div>' +
          (a.password_initialized ? '<button type="button" class="open-account-button" data-account-name="' + esc(a.account_name) + '">Accedi</button>' : '<span class="tag">Da configurare</span>') + '</div>';
      }).join("") + '</div>' : '<div class="empty">Nessun conto presente. Riprova il caricamento.</div>') +
      '</section>' + setupForm + activeView +
      (accounts.length < 4 ? '<section class="panel"><h2>Crea un altro conto</h2><p class="muted">Massimo quattro conti per account principale. Il bonus assicurativo viene assegnato esclusivamente al conto iniziale.</p><form id="create-account-form"><div class="form-grid">' +
      '<div class="field"><label for="new-account-name">Nome del conto</label><input id="new-account-name" name="account_name" minlength="2" maxlength="32" required></div>' +
      '<div class="field"><label for="new-account-password">Password del conto (8–72 caratteri)</label><input id="new-account-password" name="account_password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>' +
      '</div><div class="actions"><button type="submit">Crea e apri conto</button></div></form></section>' : '<section class="panel"><p>Hai raggiunto il limite di quattro conti.</p></section>');

    document.querySelectorAll(".open-account-button").forEach(function (button) {
      button.addEventListener("click", function () {
        var name = button.dataset.accountName;
        var password = window.prompt("Password del conto «" + name + "»:");
        if (password === null) return;
        unlockAccount(name, password);
      });
    });
    var setup = document.getElementById("initial-password-form");
    if (setup) setup.addEventListener("submit", setInitialPassword);
    var create = document.getElementById("create-account-form");
    if (create) create.addEventListener("submit", createAccount);
    var transfer = document.getElementById("transfer-form");
    if (transfer) transfer.addEventListener("submit", submitTransfer);
    var lock = document.getElementById("lock-account");
    if (lock) lock.addEventListener("click", function () { clearAccountSession(); renderAccounts("Conto bloccato."); });
  }

  function transactionTable(rows) {
    if (!rows.length) return '<div class="empty">Nessun movimento registrato per questo conto.</div>';
    return '<div class="table-wrap"><table><thead><tr><th>Data</th><th>Conto</th><th>Causale</th><th>Importo</th></tr></thead><tbody>' +
      rows.map(function (t) {
        var outgoing = t.direction === "out";
        return '<tr><td>' + esc(new Date(t.created_at).toLocaleString("it-IT")) + '</td><td>' + esc(outgoing ? t.to_account_name : t.from_account_name) + '</td><td>' + esc(t.description) + '</td><td class="' + (outgoing ? 'amount-negative' : 'amount-positive') + '">' + (outgoing ? '−' : '+') + money(t.amount, t.currency) + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  async function unlockAccount(name, password) {
    try {
      var result = await supabase.rpc("unlock_bank_account", { p_account_name: name, p_account_password: password });
      if (result.error) throw result.error;
      storeAccountSession(result.data[0]);
      await renderAccounts("Conto aperto.");
    } catch (error) {
      showToast(friendlyError(error));
    }
  }
  async function setInitialPassword(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      var result = await supabase.rpc("set_initial_account_password", {
        p_account_name: form.elements.account_name.value,
        p_account_password: form.elements.account_password.value
      });
      if (result.error) throw result.error;
      storeAccountSession(result.data[0]);
      await renderAccounts("Password impostata. Il conto iniziale è aperto.");
    } catch (error) {
      showToast(friendlyError(error));
      button.disabled = false;
    }
  }
  async function createAccount(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      var result = await supabase.rpc("create_bank_account", {
        p_account_name: form.elements.account_name.value.trim(),
        p_account_password: form.elements.account_password.value
      });
      if (result.error) throw result.error;
      storeAccountSession(result.data[0]);
      await renderAccounts("Conto creato e aperto. Nessun bonus iniziale è stato assegnato.");
    } catch (error) {
      showToast(friendlyError(error));
      button.disabled = false;
    }
  }
  async function submitTransfer(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      var result = await supabase.rpc("transfer_between_accounts", {
        p_access_token: activeToken(),
        p_recipient_account_name: form.elements.recipient_account.value.trim(),
        p_currency: form.elements.currency.value,
        p_amount: Number(form.elements.amount.value),
        p_description: form.elements.description.value.trim()
      });
      if (result.error) throw result.error;
      showToast("Trasferimento completato. Riferimento BE-" + result.data + ".");
      await renderAccounts();
    } catch (error) {
      showToast(friendlyError(error));
      button.disabled = false;
    }
  }


  async function renderExchange() {
    var token = activeToken();
    if (!token) {
      content.innerHTML = pageHeader("exchange") + '<section class="panel"><p>Per cambiare valuta devi prima aprire un conto nella pagina Conti.</p><a class="button-link" href="#accounts">Vai a Conti</a></section>';
      return;
    }
    var results = await Promise.all([
      supabase.rpc("get_account_balances", { p_access_token: token }),
      supabase.rpc("get_exchange_rates")
    ]);
    results.forEach(function (result) { if (result.error) throw result.error; });
    var balances = results[0].data || [];
    var rates = results[1].data || [];
    if (!rates.length) {
      content.innerHTML = pageHeader("exchange") + '<section class="panel"><h2>Nessun tasso disponibile</h2><p>Il database non contiene coppie di cambio attive. Controlla la migrazione 0.8 e la tabella dei tassi.</p></section>';
      return;
    }
    var currencyMap = {};
    balances.forEach(function (b) { currencyMap[b.currency] = { code: b.currency, name: b.currency_name, balance: Number(b.balance || 0) }; });
    rates.forEach(function (r) {
      if (!currencyMap[r.from_currency]) currencyMap[r.from_currency] = { code: r.from_currency, name: r.from_currency_name, balance: 0 };
      if (!currencyMap[r.to_currency]) currencyMap[r.to_currency] = { code: r.to_currency, name: r.to_currency_name, balance: 0 };
    });
    var currencies = Object.keys(currencyMap).sort().map(function (code) { return currencyMap[code]; });
    var initialFrom = (currencies.find(function (c) { return c.balance > 0; }) || currencies[0]).code;
    var initialRate = rates.find(function (r) { return r.from_currency === initialFrom; }) || rates[0];
    var currencyOptions = currencies.map(function (c) {
      return '<option value="' + esc(c.code) + '">' + esc(c.name) + ' (' + esc(c.code) + ') · saldo ' + money(c.balance, c.code) + '</option>';
    }).join("");
    content.innerHTML = pageHeader("exchange") +
      '<section class="panel exchange-panel"><div class="exchange-warning"><strong>Tassi dimostrativi:</strong> i tassi iniziali sono impostati a 1:1 come segnaposto. Non rappresentano valori economici reali e possono essere modificati nel database.</div>' +
      '<form id="exchange-form"><div class="form-grid">' +
      '<div class="field"><label for="exchange-from">Da valuta</label><select id="exchange-from" name="from_currency" required>' + currencyOptions + '</select></div>' +
      '<div class="field"><label for="exchange-to">A valuta</label><select id="exchange-to" name="to_currency" required>' + currencyOptions + '</select></div>' +
      '<div class="field full"><label for="exchange-amount">Importo da convertire</label><input id="exchange-amount" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0,00" required></div>' +
      '<div class="field full"><label for="exchange-description">Causale (facoltativa)</label><input id="exchange-description" name="description" maxlength="120" placeholder="Cambio valuta"></div>' +
      '</div><div id="exchange-preview" class="exchange-preview" aria-live="polite"></div>' +
      '<div class="actions"><button type="submit">Conferma cambio</button><button type="button" class="secondary" id="exchange-refresh">Aggiorna tassi e saldi</button></div></form></section>' +
      '<section class="panel"><h2>Tassi attivi</h2><div class="table-wrap"><table><thead><tr><th>Coppia</th><th>Tasso</th><th>Aggiornato</th></tr></thead><tbody>' +
      rates.map(function (r) {
        return '<tr><td>' + esc(r.from_currency) + ' → ' + esc(r.to_currency) + '</td><td>' + Number(r.rate).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 8 }) + '</td><td>' + esc(new Date(r.updated_at).toLocaleString("it-IT")) + '</td></tr>';
      }).join("") + '</tbody></table></div><p class="muted">Il tasso indica quante unità della valuta di destinazione ricevi per 1 unità della valuta di partenza.</p></section>';
    var form = document.getElementById("exchange-form");
    var fromSelect = form.elements.from_currency;
    var toSelect = form.elements.to_currency;
    var amountInput = form.elements.amount;
    fromSelect.value = initialFrom;
    toSelect.value = initialRate.to_currency;
    function updatePreview() {
      var from = fromSelect.value;
      var to = toSelect.value;
      var amount = Number(amountInput.value || 0);
      var rate = rates.find(function (r) { return r.from_currency === from && r.to_currency === to; });
      var preview = document.getElementById("exchange-preview");
      var submit = form.querySelector('button[type="submit"]');
      if (!rate || from === to) {
        preview.innerHTML = '<p class="amount-negative">Coppia di valute non disponibile. Scegli due valute diverse.</p>';
        submit.disabled = true;
        return;
      }
      var balance = currencyMap[from] ? currencyMap[from].balance : 0;
      var received = Math.round((amount * Number(rate.rate) + Number.EPSILON) * 100) / 100;
      preview.innerHTML = '<p><strong>1 ' + esc(from) + ' = ' + Number(rate.rate).toLocaleString("it-IT", { maximumFractionDigits: 8 }) + ' ' + esc(to) + '</strong></p>' +
        '<div class="exchange-result"><div><span>Spenderai</span><strong>' + money(amount, from) + '</strong></div><span class="exchange-arrow">→</span><div><span>Riceverai</span><strong>' + money(received, to) + '</strong></div></div>' +
        '<p class="' + (amount > balance ? 'amount-negative' : 'muted') + '">Saldo disponibile: ' + money(balance, from) + (amount > balance ? ' · saldo insufficiente' : '') + '</p>';
      submit.disabled = !(amount > 0 && Number.isFinite(amount) && Math.round(amount * 100) === amount * 100 && amount <= balance && received > 0);
    }
    fromSelect.addEventListener("change", function () {
      var next = rates.find(function (r) { return r.from_currency === fromSelect.value && r.to_currency !== fromSelect.value; });
      if (next) toSelect.value = next.to_currency;
      updatePreview();
    });
    toSelect.addEventListener("change", updatePreview);
    amountInput.addEventListener("input", updatePreview);
    document.getElementById("exchange-refresh").addEventListener("click", renderExchange);
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        var result = await supabase.rpc("exchange_account_currency", {
          p_access_token: activeToken(),
          p_from_currency: fromSelect.value,
          p_to_currency: toSelect.value,
          p_amount: Number(amountInput.value),
          p_description: form.elements.description.value.trim() || "Cambio valuta"
        });
        if (result.error) throw result.error;
        showToast("Cambio completato. Riferimento EX-" + result.data + ".");
        await renderExchange();
      } catch (error) {
        showToast(friendlyError(error));
        button.disabled = false;
      }
    });
    updatePreview();
  }

  function exchangeTransactionTable(rows) {
    if (!rows.length) return '<div class="empty">Nessun cambio valuta registrato per questo conto.</div>';
    return '<div class="table-wrap"><table><thead><tr><th>Data</th><th>Causale</th><th>Valuta ceduta</th><th>Valuta ricevuta</th><th>Tasso</th></tr></thead><tbody>' +
      rows.map(function (x) {
        return '<tr><td>' + esc(new Date(x.created_at).toLocaleString("it-IT")) + '</td><td>' + esc(x.description) + '</td><td class="amount-negative">−' + money(x.from_amount, x.from_currency) + '</td><td class="amount-positive">+' + money(x.to_amount, x.to_currency) + '</td><td>1 ' + esc(x.from_currency) + ' = ' + Number(x.exchange_rate).toLocaleString("it-IT", { maximumFractionDigits: 8 }) + ' ' + esc(x.to_currency) + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  async function renderEmpires() {
    var results = await Promise.all([
      supabase.from("empires").select("id,name,leader,whatsapp_member_count,selected_insurance_plan_id").order("id"),
      supabase.from("insurance_plans").select("id,code,name,initial_bonus,government_cost,currency,active").eq("active", true).order("initial_bonus"),
      supabase.rpc("get_empire_summary"),
      supabase.from("currencies").select("code,name").eq("enabled", true).order("code")
    ]);
    results.forEach(function (result) { if (result.error) throw result.error; });
    var empires = results[0].data || [];
    var plans = results[1].data || [];
    var summary = results[2].data || [];
    var currencies = results[3].data || [];
    var grouped = {};
    summary.forEach(function (row) {
      if (!grouped[row.empire_id]) grouped[row.empire_id] = {};
      grouped[row.empire_id][row.currency] = row;
    });
    content.innerHTML = pageHeader("empires") +
      '<p class="muted">I valori delle assicurazioni sono temporanei. Il conteggio WhatsApp è un dato registrato manualmente: la sincronizzazione automatica non è ancora implementata.</p>' +
      '<div class="empire-grid">' + empires.map(function (empire) {
        var plan = plans.find(function (p) { return p.id === empire.selected_insurance_plan_id; });
        var firstCurrency = currencies.length ? currencies[0].code : "SOL";
        var firstRow = (grouped[empire.id] || {})[firstCurrency] || {};
        var lines = currencies.map(function (currency) {
          var row = (grouped[empire.id] || {})[currency.code] || {};
          var citizenTotal = Number(row.citizen_total || 0);
          var governmentTotal = Number(row.government_total || 0);
          return '<div class="currency-line"><span>' + esc(currency.name) + ' (' + esc(currency.code) + ')<small class="line-detail">Cittadini: ' + money(citizenTotal, currency.code) + ' · Stato: ' + money(governmentTotal, currency.code) + '</small></span><strong>' + money(citizenTotal + governmentTotal, currency.code) + '</strong></div>';
        }).join("");
        return '<article class="empire-card"><h2>' + esc(empire.name) + '</h2><p>Leader indicato: ' + esc(empire.leader || "Non definito") +
          '<br>Membri WhatsApp registrati: ' + Number(empire.whatsapp_member_count || 0) +
          '<br>Cittadini con account: ' + Number(firstRow.citizen_count || 0) +
          '</p><h3>Assicurazione attuale</h3><p>' + esc(plan ? plan.name : "Non configurata") + (plan ? '<br>Bonus iniziale: ' + money(plan.initial_bonus, plan.currency) + '<br>Costo indicativo: ' + money(plan.government_cost, plan.currency) : '') +
          '</p><h3>Patrimonio per valuta</h3><div class="currency-list">' + lines + '</div></article>';
      }).join("") + '</div>' +
      '<section class="panel"><h2>Assicurazioni dimostrative</h2><p class="muted">Per ora sono tre esempi. La pagina di gestione per gli imperatori arriverà in una versione successiva.</p><div class="plan-grid">' + plans.map(function (plan) {
        return '<article class="plan-card"><h3>' + esc(plan.name) + '</h3><p>Bonus sul conto iniziale</p><strong>' + money(plan.initial_bonus, plan.currency) + '</strong><p>Costo indicativo per l’impero</p><strong>' + money(plan.government_cost, plan.currency) + '</strong></article>';
      }).join("") + '</div></section>';
  }

  async function renderLedger() {
    var token = activeToken();
    if (!token) {
      content.innerHTML = pageHeader("ledger") + '<section class="panel"><p>Apri un conto nella pagina Conti per consultare il suo libro mastro.</p><a class="button-link" href="#accounts">Vai a Conti</a></section>';
      return;
    }
    var result = await supabase.rpc("get_account_transactions", { p_access_token: token });
    if (result.error) {
      clearAccountSession();
      content.innerHTML = pageHeader("ledger") + '<section class="panel"><p>' + esc(friendlyError(result.error)) + '</p><a class="button-link" href="#accounts">Torna a Conti</a></section>';
      return;
    }
    var exchangeResult = await supabase.rpc("get_account_exchange_transactions", { p_access_token: token });
    if (exchangeResult.error) {
      content.innerHTML = pageHeader("ledger") + '<section class="panel"><p>Impossibile caricare i cambi valuta: ' + esc(friendlyError(exchangeResult.error)) + '</p></section>';
      return;
    }
    content.innerHTML = pageHeader("ledger") +
      '<section class="panel"><h2>Trasferimenti tra conti</h2>' + transactionTable(result.data || []) + '</section>' +
      '<section class="panel"><h2>Cambi valuta</h2>' + exchangeTransactionTable(exchangeResult.data || []) + '</section>';
  }

  logoutButton.addEventListener("click", async function () {
    logoutButton.disabled = true;
    clearAccountSession();
    var result = await supabase.auth.signOut();
    logoutButton.disabled = false;
    if (result.error) showToast(friendlyError(result.error));
  });
  window.addEventListener("hashchange", function () { if (currentUser) renderApp(); });
  supabase.auth.onAuthStateChange(function (_event, session) {
    currentUser = session ? session.user : null;
    currentProfile = null;
    if (!currentUser) clearAccountSession();
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