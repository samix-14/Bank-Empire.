/* Bank Empire 0.6: prototipo locale. Nessun login o database condiviso. */
(function () {
  "use strict";

  var STORAGE_KEY = "bank-empire-demo-v06";
  var currencies = {
    SOL: { name: "Solari" },
    AUR: { name: "Aurei" },
    NVC: { name: "Novacrediti" }
  };

  // Conti personali e fondi governativi sono entità separate.
  var initialState = {
    accounts: [
      { id: "u-samix", name: "Samix (conto personale)", empireId: "auroria", balances: { SOL: 2840.50, AUR: 1250, NVC: 8300 } },
      { id: "u-luca", name: "LucaNova (conto personale)", empireId: "nova", balances: { SOL: 350, AUR: 80, NVC: 2400 } },
      { id: "u-vesper", name: "Vesper (conto personale)", empireId: "vesper", balances: { SOL: 1650, AUR: 120, NVC: 0 } },
      { id: "u-aria", name: "Aria (conto personale)", empireId: "auroria", balances: { SOL: 90, AUR: 740, NVC: 50 } }
    ],
    empires: [
      { id: "auroria", name: "Impero di Auroria", leader: "Samix", governmentFunds: { SOL: 500, AUR: 9000, NVC: 0 } },
      { id: "nova", name: "Repubblica di Nova", leader: "LucaNova", governmentFunds: { SOL: 0, AUR: 0, NVC: 12000 } },
      { id: "vesper", name: "Dominio di Vesper", leader: "Vesper", governmentFunds: { SOL: 6400, AUR: 0, NVC: 0 } }
    ],
    transactions: [],
    nextTransactionId: 1
  };

  var state = loadState();
  var content = document.getElementById("page-content");
  var toastRegion = document.getElementById("toast-region");
  var pageTitles = {
    wallet: { title: "Portafoglio", description: "Saldo del conto personale attivo, separato dai fondi dello Stato. Le valute restano separate." },
    empires: { title: "Imperi", description: "Informazioni sugli imperi, fondi governativi e patrimonio complessivo per valuta. Nessun cambio valuta viene applicato." },
    ledger: { title: "Libro mastro", description: "Registro delle transazioni effettuate nel prototipo." }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && saved.version === 1 && Array.isArray(saved.accounts) && Array.isArray(saved.empires) &&
          Array.isArray(saved.transactions) && Number.isInteger(saved.nextTransactionId) &&
          saved.accounts.every(function (a) { return a && typeof a.id === "string" && typeof a.name === "string" && a.balances && Object.keys(currencies).every(function (c) { return Number.isFinite(a.balances[c]) && a.balances[c] >= 0; }); }) &&
          saved.empires.every(function (e) { return e && typeof e.id === "string" && typeof e.name === "string" && e.governmentFunds && Object.keys(currencies).every(function (c) { return Number.isFinite(e.governmentFunds[c]) && e.governmentFunds[c] >= 0; }); }) &&
          saved.transactions.every(function (t) { return t && typeof t.id === "string" && typeof t.fromId === "string" && typeof t.toId === "string" && saved.accounts.some(function (a) { return a.id === t.fromId; }) && saved.accounts.some(function (a) { return a.id === t.toId; }) && currencies[t.currency] && Number.isFinite(t.amount) && t.amount > 0; })) {
        return saved;
      }
    } catch (error) { /* Se lo storage non è disponibile o è invalido, usa i dati iniziali. */ }
    return clone(initialState);
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1, accounts: state.accounts, empires: state.empires,
        transactions: state.transactions, nextTransactionId: state.nextTransactionId
      }));
    } catch (error) { showToast("Salvataggio non riuscito: il browser potrebbe bloccare lo storage."); }
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(value, currency) {
    return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + " " + currency;
  }
  function accountById(id) { return state.accounts.find(function (account) { return account.id === id; }); }
  function empireById(id) { return state.empires.find(function (empire) { return empire.id === id; }); }
  function activeAccount() { return accountById("u-samix"); }
  function showToast(message) {
    toastRegion.innerHTML = '<div class="toast">' + esc(message) + '</div>';
    window.setTimeout(function () { toastRegion.innerHTML = ""; }, 3200);
  }
  function pageHeader(page) {
    var meta = pageTitles[page];
    return '<h1>' + meta.title + '</h1><p class="page-intro">' + meta.description + '</p>';
  }
  function renderWallet() {
    var account = activeAccount();
    var cards = Object.keys(currencies).map(function (code) {
      return '<article class="balance-card"><div class="currency">' + esc(currencies[code].name) + ' (' + code + ')</div><div class="amount">' + money(account.balances[code], code) + '</div></article>';
    }).join("");
    var recipients = state.accounts.filter(function (a) { return a.id !== account.id; }).map(function (a) {
      return '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>';
    }).join("");
    content.innerHTML = pageHeader("wallet") +
      '<div class="panel"><h2>Conto personale</h2><p><strong>' + esc(account.name) + '</strong></p><p class="muted">Questi sono i saldi personali dell’utente attivo nella demo. Non comprendono i fondi del governo del suo impero.</p></div>' +
      '<div class="balance-grid">' + cards + '</div>' +
      '<section class="panel"><h2>Nuova transazione</h2><p class="muted">Trasferimento tra due conti personali. Per ora non ci sono commissioni né conversioni tra valute.</p>' +
      '<form id="transaction-form"><div class="form-grid">' +
      '<div class="field"><label for="recipient">Destinatario</label><select id="recipient" name="recipient" required>' + recipients + '</select></div>' +
      '<div class="field"><label for="currency">Valuta</label><select id="currency" name="currency" required>' + Object.keys(currencies).map(function (code) { return '<option value="' + code + '">' + code + ' · ' + esc(currencies[code].name) + '</option>'; }).join("") + '</select></div>' +
      '<div class="field"><label for="amount">Importo</label><input id="amount" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" required></div>' +
      '<div class="field"><label for="description">Causale</label><input id="description" name="description" maxlength="120" placeholder="Descrizione della transazione" required></div>' +
      '</div><div class="actions"><button type="submit">Conferma trasferimento</button></div></form></section>' +
      '<section class="panel"><h2>Movimenti recenti</h2>' + recentTransactions(account.id) + '</section>';
    document.getElementById("transaction-form").addEventListener("submit", submitTransaction);
  }
  function recentTransactions(accountId) {
    var rows = state.transactions.filter(function (t) { return t.fromId === accountId || t.toId === accountId; }).slice().reverse().slice(0, 8);
    if (!rows.length) return '<div class="empty">Nessuna transazione ancora registrata.</div>';
    return '<div class="table-wrap"><table><thead><tr><th>Data</th><th>Operazione</th><th>Importo</th></tr></thead><tbody>' + rows.map(function (t) {
      var outgoing = t.fromId === accountId;
      return '<tr><td>' + esc(t.date) + '</td><td>' + esc(t.description) + '<br><small>' + (outgoing ? 'Destinatario: ' + esc(accountById(t.toId).name) : 'Mittente: ' + esc(accountById(t.fromId).name)) + '</small></td><td class="' + (outgoing ? 'amount-negative' : 'amount-positive') + '">' + (outgoing ? '−' : '+') + money(t.amount, t.currency) + '</td></tr>';
    }).join("") + '</tbody></table></div>';
  }
  function submitTransaction(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var from = activeAccount();
    var to = accountById(form.elements.recipient.value);
    var currency = form.elements.currency.value;
    var amount = Number(form.elements.amount.value);
    var description = form.elements.description.value.trim();
    if (!to || to.id === from.id) return showToast("Seleziona un destinatario diverso dal mittente.");
    if (!currencies[currency] || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.0000001) return showToast("Inserisci un importo valido con massimo due decimali.");
    if (!description) return showToast("Inserisci una causale.");
    if (from.balances[currency] + 0.000001 < amount) return showToast("Saldo insufficiente per questa valuta.");
    // Applica entrambe le variazioni solo dopo aver superato tutti i controlli.
    from.balances[currency] = Math.round((from.balances[currency] - amount) * 100) / 100;
    to.balances[currency] = Math.round((to.balances[currency] + amount) * 100) / 100;
    var id = "BE-" + String(state.nextTransactionId++).padStart(5, "0");
    state.transactions.push({
      id: id, fromId: from.id, toId: to.id, currency: currency, amount: amount,
      description: description, date: new Date().toLocaleString("it-IT"), status: "Completata"
    });
    persist();
    renderWallet();
    showToast("Trasferimento registrato: " + id + ".");
  }
  function totalCitizenBalances(empireId, currency) {
    return state.accounts.filter(function (a) { return a.empireId === empireId; }).reduce(function (sum, a) { return sum + a.balances[currency]; }, 0);
  }
  function renderEmpires() {
    content.innerHTML = pageHeader("empires") +
      '<p class="muted">Il patrimonio complessivo è mostrato separatamente per valuta: saldo dei conti personali dei cittadini + fondi governativi. I valori sono dimostrativi.</p>' +
      '<div class="empire-grid">' + state.empires.map(function (empire) {
        var citizens = state.accounts.filter(function (a) { return a.empireId === empire.id; });
        var government = Object.keys(currencies).map(function (code) {
          return '<div class="currency-line"><span>Fondi Stato · ' + code + '</span><strong>' + money(empire.governmentFunds[code], code) + '</strong></div>';
        }).join("");
        var totals = Object.keys(currencies).map(function (code) {
          var citizensTotal = totalCitizenBalances(empire.id, code);
          var total = citizensTotal + empire.governmentFunds[code];
          return '<div class="currency-line"><span>' + code + ' <small>(cittadini ' + money(citizensTotal, code) + ' + Stato ' + money(empire.governmentFunds[code], code) + ')</small></span><strong>' + money(total, code) + '</strong></div>';
        }).join("");
        return '<article class="empire-card"><h2>' + esc(empire.name) + '</h2><p>Leader indicato nella demo: ' + esc(empire.leader) + '<br>Conti cittadini presenti nel prototipo: ' + citizens.length + '</p><h3>Fondi governativi</h3><div class="currency-list">' + government + '</div><h3 style="margin-top:18px">Patrimonio complessivo per valuta</h3><div class="currency-list">' + totals + '</div></article>';
      }).join("") + '</div>';
  }
  function renderLedger() {
    var rows = state.transactions.slice().reverse();
    content.innerHTML = pageHeader("ledger") + '<section class="panel"><h2>Transazioni registrate</h2>' +
      (rows.length ? '<div class="table-wrap"><table><thead><tr><th>Riferimento</th><th>Data</th><th>Mittente</th><th>Destinatario</th><th>Causale</th><th>Importo</th><th>Stato</th></tr></thead><tbody>' + rows.map(function (t) {
        var from = accountById(t.fromId), to = accountById(t.toId);
        return '<tr><td>' + esc(t.id) + '</td><td>' + esc(t.date) + '</td><td>' + esc(from ? from.name : "Conto non disponibile") + '</td><td>' + esc(to ? to.name : "Conto non disponibile") + '</td><td>' + esc(t.description) + '</td><td>' + money(t.amount, t.currency) + '</td><td>' + esc(t.status) + '</td></tr>';
      }).join("") + '</tbody></table></div>' : '<div class="empty">Il libro mastro è vuoto. Le transazioni appariranno qui dopo essere state create dal Portafoglio.</div>') +
      '</section>';
  }
  function setPage(page) {
    if (!pageTitles[page]) page = "wallet";
    document.querySelectorAll("nav a[data-page]").forEach(function (link) {
      var active = link.dataset.page === page;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    if (page === "wallet") renderWallet();
    else if (page === "empires") renderEmpires();
    else renderLedger();
  }
  window.addEventListener("hashchange", function () { setPage(location.hash.slice(1)); });
  if (!location.hash || !pageTitles[location.hash.slice(1)]) location.hash = "wallet";
  else setPage(location.hash.slice(1));
  persist();
})();