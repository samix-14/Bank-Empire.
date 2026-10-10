/* Bank Empire 0.2 - frontend dimostrativo.
   I dati vivono soltanto in memoria. Nessuna transazione reale o autenticazione. */
(function () {
  "use strict";

  var pageContent = document.getElementById("page-content");
  var pageTitle = document.getElementById("page-title");
  var pageDescription = document.getElementById("page-description");
  var pageEyebrow = document.getElementById("page-eyebrow");
  var breadcrumbCurrent = document.getElementById("breadcrumb-current");
  var modal = document.getElementById("modal");
  var modalContent = document.getElementById("modal-content");
  var toastRegion = document.getElementById("toast-region");
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("mobile-overlay");
  var activeFilter = "tutti";
  var searchQuery = "";
  var transactionId = 8;

  var currencies = {
    SOL: { name: "Solari", symbol: "S", className: "symbol-gold", rate: 1, note: "Valuta di riferimento demo" },
    AUR: { name: "Aurei", symbol: "A", className: "symbol-blue", rate: 1.8, note: "Impero di Auroria" },
    NVC: { name: "Novacrediti", symbol: "N", className: "symbol-green", rate: 0.65, note: "Repubblica di Nova" }
  };

  var wallets = [
    { currency: "SOL", balance: 2840.50, change: "+4,2%", label: "Portafoglio principale" },
    { currency: "AUR", balance: 1250.00, change: "+1,8%", label: "Tesoreria di Auroria" },
    { currency: "NVC", balance: 8300.00, change: "-0,6%", label: "Riserva Nova" }
  ];

  var transactions = [
    { id: "BE-008", title: "Pagamento stipendio", detail: "Ministero di Auroria", date: "Oggi · 14:32", amount: 320, currency: "AUR", type: "entrata", status: "Completata", icon: "↙" },
    { id: "BE-007", title: "Acquisto materiali", detail: "Forgia Imperiale", date: "Oggi · 12:08", amount: -145, currency: "SOL", type: "uscita", status: "Completata", icon: "↗" },
    { id: "BE-006", title: "Vendita risorse", detail: "Mercato di Nova", date: "Ieri · 18:41", amount: 780, currency: "NVC", type: "entrata", status: "Completata", icon: "↙" },
    { id: "BE-005", title: "Trasferimento interno", detail: "Tesoreria personale", date: "Ieri · 16:19", amount: -200, currency: "AUR", type: "uscita", status: "Completata", icon: "↗" },
    { id: "BE-004", title: "Tassa commerciale", detail: "Impero di Auroria", date: "08 ott · 10:05", amount: -42, currency: "AUR", type: "uscita", status: "Completata", icon: "↗" },
    { id: "BE-003", title: "Rimborso fornitura", detail: "Forgia Imperiale", date: "07 ott · 09:52", amount: 90, currency: "SOL", type: "entrata", status: "Completata", icon: "↙" },
    { id: "BE-002", title: "Contributo civico", detail: "Repubblica di Nova", date: "06 ott · 15:10", amount: 1500, currency: "NVC", type: "entrata", status: "Completata", icon: "↙" }
  ];

  var empires = [
    { name: "Impero di Auroria", leader: "Samix", currency: "AUR", citizens: 128, tax: 8, mark: "♜", tone: "", status: "Attivo" },
    { name: "Repubblica di Nova", leader: "LucaNova", currency: "NVC", citizens: 94, tax: 5, mark: "✦", tone: "blue", status: "Attivo" },
    { name: "Dominio di Vesper", leader: "Vesper", currency: "SOL", citizens: 57, tax: 6, mark: "◈", tone: "green", status: "In crescita" }
  ];

  var businesses = [
    { name: "Forgia Imperiale", owner: "Impero di Auroria", category: "Produzione", revenue: 2840, currency: "AUR", status: "Operativa", mark: "⚒", tone: "" },
    { name: "Nova Logistics", owner: "Repubblica di Nova", category: "Trasporti", revenue: 1630, currency: "NVC", status: "Operativa", mark: "⇢", tone: "blue" },
    { name: "Emporio Centrale", owner: "Samix, 60% · Altri, 40%", category: "Commercio", revenue: 920, currency: "SOL", status: "Operativa", mark: "▤", tone: "green" },
    { name: "Officina Vesper", owner: "Dominio di Vesper", category: "Servizi", revenue: 470, currency: "SOL", status: "In allestimento", mark: "⚙", tone: "red" }
  ];

  var listings = [
    { id: "M-01", name: "Lotto di ferro raffinato", description: "Materiali industriali, lotto da 50 unità.", seller: "Forgia Imperiale", price: 145, currency: "SOL", category: "Risorse", mark: "⬡", tone: "" },
    { id: "M-02", name: "Pacchetto logistico", description: "Trasporto simulato tra due territori.", seller: "Nova Logistics", price: 320, currency: "NVC", category: "Servizi", mark: "⇢", tone: "blue" },
    { id: "M-03", name: "Kit di costruzione", description: "Componenti base per nuove strutture.", seller: "Emporio Centrale", price: 85, currency: "AUR", category: "Risorse", mark: "▦", tone: "green" },
    { id: "M-04", name: "Consulenza commerciale", description: "Analisi di mercato per una nuova attività.", seller: "Dominio di Vesper", price: 210, currency: "SOL", category: "Servizi", mark: "✧", tone: "red" },
    { id: "M-05", name: "Cristalli energetici", description: "Risorsa rara per produzioni avanzate.", seller: "Repubblica di Nova", price: 560, currency: "NVC", category: "Risorse", mark: "◇", tone: "blue" },
    { id: "M-06", name: "Licenza commerciale", description: "Permesso simulato per aprire un negozio.", seller: "Impero di Auroria", price: 120, currency: "AUR", category: "Licenze", mark: "▣", tone: "" }
  ];

  var pageMeta = {
    dashboard: { title: "Panoramica", eyebrow: "CENTRO DI CONTROLLO", description: "La tua economia, senza dover aprire dodici fogli di calcolo." },
    wallet: { title: "Portafogli", eyebrow: "PATRIMONIO MULTIVALUTA", description: "Ogni valuta resta separata. Sommarle come se fossero identiche sarebbe un po' troppo comodo." },
    ledger: { title: "Libro mastro", eyebrow: "REGISTRO DELLE OPERAZIONI", description: "Movimenti dimostrativi con importi, riferimenti e stato." },
    marketplace: { title: "Marketplace", eyebrow: "SCAMBI TRA IMPERI", description: "Risorse, servizi e licenze messi in vendita dagli operatori." },
    empires: { title: "Imperi", eyebrow: "TERRITORI E AMMINISTRAZIONI", description: "Panoramica delle economie e delle regole fiscali dei vari imperi." },
    businesses: { title: "Aziende", eyebrow: "ATTIVITÀ ECONOMICHE", description: "Attività, proprietari e ricavi dimostrativi." }
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function number(value, digits) {
    return new Intl.NumberFormat("it-IT", { minimumFractionDigits: digits === undefined ? 2 : digits, maximumFractionDigits: digits === undefined ? 2 : digits }).format(value);
  }

  function money(value, currency) {
    return number(Math.abs(value)) + " " + currency;
  }

  function signedMoney(value, currency) {
    return (value > 0 ? "+" : value < 0 ? "−" : "") + money(value, currency);
  }

  function badge(text, type) {
    return '<span class="badge ' + (type ? "badge-" + type : "") + '">' + escapeHtml(text) + "</span>";
  }

  function entityMark(mark, tone) {
    return '<span class="entity-mark ' + escapeHtml(tone || "") + '">' + escapeHtml(mark) + "</span>";
  }

  function setPage(page) {
    if (!pageMeta[page]) page = "dashboard";
    var meta = pageMeta[page];
    pageTitle.textContent = meta.title;
    breadcrumbCurrent.textContent = meta.title;
    pageEyebrow.textContent = meta.eyebrow;
    pageDescription.textContent = meta.description;
    document.title = "Bank Empire · " + meta.title;
    document.querySelectorAll(".nav-link").forEach(function (link) {
      var active = link.getAttribute("data-page") === page;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    closeMenu();
    if (page === "dashboard") renderDashboard();
    else if (page === "wallet") renderWallet();
    else if (page === "ledger") renderLedger();
    else if (page === "marketplace") renderMarketplace();
    else if (page === "empires") renderEmpires();
    else if (page === "businesses") renderBusinesses();
  }

  function openPage(page) {
    if (!pageMeta[page]) return;
    if (window.location.hash !== "#" + page) window.location.hash = page;
    else setPage(page);
  }

  function chartMarkup() {
    var points = [38, 46, 43, 57, 51, 61, 58, 69, 64, 79, 74, 88];
    var labels = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
    var width = 520;
    var height = 210;
    var left = 32;
    var right = 12;
    var top = 12;
    var bottom = 28;
    var min = 25;
    var max = 95;
    var coords = points.map(function (value, i) {
      return { x: left + i * (width - left - right) / (points.length - 1), y: top + (max - value) * (height - top - bottom) / (max - min) };
    });
    var line = coords.map(function (point, i) { return (i ? "L" : "M") + point.x.toFixed(1) + " " + point.y.toFixed(1); }).join(" ");
    var area = line + " L" + coords[coords.length - 1].x.toFixed(1) + " " + (height - bottom) + " L" + coords[0].x.toFixed(1) + " " + (height - bottom) + " Z";
    var grid = [35, 50, 65, 80].map(function (value) {
      var y = top + (max - value) * (height - top - bottom) / (max - min);
      return '<line class="chart-gridline" x1="' + left + '" y1="' + y + '" x2="' + (width - right) + '" y2="' + y + '"></line><text class="chart-label" x="0" y="' + (y + 3) + '">' + value + '</text>';
    }).join("");
    var xLabels = labels.map(function (label, i) {
      var x = left + i * (width - left - right) / (labels.length - 1);
      return '<text class="chart-label" text-anchor="middle" x="' + x + '" y="' + (height - 6) + '">' + label + "</text>";
    }).join("");
    return '<svg class="chart-svg" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="Grafico illustrativo dell’attività economica negli ultimi sette giorni"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#e9bd68" stop-opacity=".22"></stop><stop offset="100%" stop-color="#e9bd68" stop-opacity="0"></stop></linearGradient></defs>' + grid + '<path class="chart-area" d="' + area + '"></path><path class="chart-line" d="' + line + '"></path><circle class="chart-point" cx="' + coords[coords.length - 1].x + '" cy="' + coords[coords.length - 1].y + '" r="4"></circle>' + xLabels + "</svg>";
  }

  function movementMarkup(tx) {
    var amountClass = tx.amount >= 0 ? "positive" : "negative";
    return '<div class="movement"><span class="movement-icon">' + escapeHtml(tx.icon) + '</span><div class="movement-main"><strong>' + escapeHtml(tx.title) + '</strong><small>' + escapeHtml(tx.detail) + " · " + escapeHtml(tx.date) + '</small></div><div class="movement-amount ' + amountClass + '">' + signedMoney(tx.amount, tx.currency) + "<small>" + escapeHtml(tx.id) + "</small></div></div>";
  }

  function currencyRow(wallet) {
    var currency = currencies[wallet.currency];
    var trendClass = wallet.change.charAt(0) === "-" ? "negative" : "positive";
    return '<div class="currency-row"><span class="currency-symbol ' + currency.className + '">' + currency.symbol + '</span><div class="currency-main"><strong>' + currency.name + " (" + wallet.currency + ')</strong><small>' + wallet.label + '</small></div><div class="currency-balance"><strong>' + money(wallet.balance, wallet.currency) + '</strong><small class="' + trendClass + '">' + wallet.change + " · variazione demo</small></div></div>";
  }

  function statCard(label, value, icon, foot, footClass) {
    return '<article class="panel stat-card"><div class="stat-top"><span>' + label + '</span><span class="stat-icon">' + icon + '</span></div><div class="stat-value">' + value + '</div><div class="stat-foot ' + (footClass || "") + '">' + foot + "</div></article>";
  }

  function renderDashboard() {
    var recent = transactions.slice(0, 4).map(movementMarkup).join("");
    pageContent.innerHTML =
      '<div class="grid stats-grid">' +
      statCard("Valute disponibili", "03", "◈", "3 portafogli separati", "neutral") +
      statCard("Imperi collegati", String(empires.length).padStart(2, "0"), "♜", "Amministrazioni demo", "neutral") +
      statCard("Movimenti registrati", String(transactions.length).padStart(2, "0"), "≋", "Registro dimostrativo", "neutral") +
      statCard("Attività commerciali", String(businesses.length).padStart(2, "0"), "▤", "Aziende e operatori", "neutral") +
      '</div><div class="grid content-grid"><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Attività economica</h2><p class="panel-subtitle">Indice illustrativo · ultimi 7 giorni</p></div>' + badge("DATI DEMO", "gold") + '</div><div class="chart-wrap">' + chartMarkup() + '<div class="chart-legend"><span class="legend-dot"></span> Attività simulata <span class="neutral">· nessun valore reale</span></div></div><div class="panel-body" style="padding-top:17px"><div class="callout"><strong>Nota sui saldi:</strong> le valute sono mostrate separatamente. I tassi sono solo illustrativi e non vengono usati per calcolare un patrimonio totale.</div></div></section>' +
      '<section class="panel"><div class="panel-header"><div><h2 class="panel-title">Ultimi movimenti</h2><p class="panel-subtitle">Le operazioni più recenti</p></div><button class="text-link" data-action="page" data-page="ledger">Vedi tutto ↗</button></div><div class="panel-body"><div class="movement-list">' + recent + '</div></div></section></div>' +
      '<div class="grid lower-grid"><section class="panel"><div class="panel-header"><div><h2 class="panel-title">I tuoi portafogli</h2><p class="panel-subtitle">Saldi per singola valuta</p></div><button class="text-link" data-action="page" data-page="wallet">Apri portafogli ↗</button></div><div class="panel-body">' + wallets.map(currencyRow).join("") + '</div></section>' +
      '<section class="panel"><div class="panel-header"><div><h2 class="panel-title">Panoramica degli imperi</h2><p class="panel-subtitle">Stato delle amministrazioni</p></div><button class="text-link" data-action="page" data-page="empires">Tutti gli imperi ↗</button></div><div class="panel-body">' + empires.map(function (empire) { return '<div class="currency-row"><span class="currency-symbol symbol-gold">' + empire.mark + '</span><div class="currency-main"><strong>' + escapeHtml(empire.name) + '</strong><small>' + empire.citizens + ' cittadini · valuta ' + empire.currency + '</small></div><div class="currency-balance">' + badge(empire.status, empire.status === "Attivo" ? "green" : "gold") + '<small>Imposte ' + empire.tax + '%</small></div></div>'; }).join("") + '</div></section></div>';
  }

  function renderWallet() {
    pageContent.innerHTML = '<div class="grid stats-grid">' +
      statCard("Portafogli attivi", String(wallets.length), "◈", "Uno per valuta", "neutral") +
      statCard("Valute registrate", String(Object.keys(currencies).length), "◎", "Tutte dimostrative", "neutral") +
      statCard("Ultimo movimento", transactions[0] ? escapeHtml(transactions[0].id) : "—", "↻", "Riferimento interno demo", "neutral") +
      statCard("Valore convertito", "Non calcolato", "∑", "Evita somme tra valute diverse", "neutral") +
      '</div><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Saldi disponibili</h2><p class="panel-subtitle">Importi sempre espressi nella valuta del rispettivo portafoglio</p></div><button class="button button-primary button-small" data-action="new-transaction">＋ Trasferisci</button></div><div class="panel-body">' +
      wallets.map(function (wallet) {
        var currency = currencies[wallet.currency];
        return '<div class="currency-row"><span class="currency-symbol ' + currency.className + '">' + currency.symbol + '</span><div class="currency-main"><strong>' + currency.name + " (" + wallet.currency + ')</strong><small>' + wallet.label + '</small><small>' + currency.note + '</small></div><div class="currency-balance"><strong style="font-size:16px">' + money(wallet.balance, wallet.currency) + '</strong><small>' + wallet.change + ' variazione simulata</small><button class="text-link" data-action="new-transaction" data-currency="' + wallet.currency + '">Invia da qui ↗</button></div></div>';
      }).join("") + '</div></section><div class="callout" style="margin-top:16px"><strong>Scelta progettuale:</strong> nella versione reale i trasferimenti dovranno essere convalidati lato server, applicati in modo atomico e registrati nel libro mastro. Questa demo modifica solo dati temporanei in memoria.</div>';
  }

  function filteredTransactions() {
    return transactions.filter(function (tx) {
      var matchesFilter = activeFilter === "tutti" || tx.type === activeFilter;
      var haystack = [tx.id, tx.title, tx.detail, tx.currency, tx.status].join(" ").toLowerCase();
      return matchesFilter && haystack.indexOf(searchQuery.toLowerCase()) !== -1;
    });
  }

  function transactionRow(tx) {
    return '<tr><td><span class="cell-primary">' + escapeHtml(tx.id) + '</span></td><td><div class="table-entity">' + entityMark(tx.icon, tx.amount >= 0 ? "green" : "red") + '<div class="entity-copy"><strong>' + escapeHtml(tx.title) + '</strong><small>' + escapeHtml(tx.detail) + '</small></div></div></td><td>' + escapeHtml(tx.date) + '</td><td>' + escapeHtml(tx.currency) + '</td><td class="' + (tx.amount >= 0 ? "positive" : "negative") + '" style="font-weight:800">' + signedMoney(tx.amount, tx.currency) + '</td><td>' + badge(tx.status, "green") + '</td></tr>';
  }

  function renderLedger() {
    var list = filteredTransactions();
    pageContent.innerHTML = '<div class="section-heading"><div><h2>Registro completo</h2><p>' + list.length + ' operazioni corrispondenti · dati dimostrativi</p></div><button class="button button-primary" data-action="new-transaction">＋ Nuova operazione</button></div><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Libro mastro</h2><p class="panel-subtitle">Ogni riga rappresenta un movimento simulato</p></div>' + badge("APPEND-ONLY · OBIETTIVO FUTURO", "blue") + '</div><div class="panel-body"><div class="toolbar"><label class="search-box"><input id="ledger-search" type="search" placeholder="Cerca operazione, riferimento..." value="' + escapeHtml(searchQuery) + '" aria-label="Cerca nel libro mastro"></label><select class="select-control" id="ledger-filter" aria-label="Filtra tipo di operazione"><option value="tutti">Tutti i movimenti</option><option value="entrata">Entrate</option><option value="uscita">Uscite</option></select></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Riferimento</th><th>Operazione</th><th>Data</th><th>Valuta</th><th>Importo</th><th>Stato</th></tr></thead><tbody id="ledger-rows">' + (list.length ? list.map(transactionRow).join("") : '<tr><td colspan="6"><div class="empty-state">Nessun movimento trovato. La ricerca non è telepatica, purtroppo.</div></td></tr>') + '</tbody></table></div></section><div class="callout" style="margin-top:16px"><strong>Integrità dei dati:</strong> qui le righe sono modificabili solo perché sono dati fittizi in memoria. Il sistema definitivo dovrà impedire la modifica diretta delle transazioni e correggere gli errori con registrazioni compensative collegate.</div>';
    var filter = document.getElementById("ledger-filter");
    var search = document.getElementById("ledger-search");
    filter.value = activeFilter;
    filter.addEventListener("change", function () { activeFilter = filter.value; renderLedger(); });
    search.addEventListener("input", function () {
      var cursor = search.selectionStart;
      searchQuery = search.value;
      var rows = document.getElementById("ledger-rows");
      var filtered = filteredTransactions();
      rows.innerHTML = filtered.length ? filtered.map(transactionRow).join("") : '<tr><td colspan="6"><div class="empty-state">Nessun movimento trovato.</div></td></tr>';
      var count = pageContent.querySelector(".section-heading p");
      if (count) count.textContent = filtered.length + " operazioni corrispondenti · dati dimostrativi";
      if (cursor !== null) search.setSelectionRange(cursor, cursor);
    });
  }

  function renderMarketplace() {
    var filtered = listings.filter(function (item) {
      var haystack = [item.name, item.description, item.seller, item.category, item.currency].join(" ").toLowerCase();
      return haystack.indexOf(searchQuery.toLowerCase()) !== -1 && (activeFilter === "tutti" || item.category.toLowerCase() === activeFilter);
    });
    pageContent.innerHTML = '<div class="section-heading"><div><h2>Offerte disponibili</h2><p>Catalogo fittizio · gli acquisti non generano pagamenti reali</p></div><button class="button button-primary" data-action="new-listing">＋ Pubblica offerta</button></div><div class="toolbar"><label class="search-box"><input id="market-search" type="search" placeholder="Cerca prodotti, servizi, venditori..." value="' + escapeHtml(searchQuery) + '" aria-label="Cerca nel marketplace"></label><select class="select-control" id="market-filter" aria-label="Filtra categoria"><option value="tutti">Tutte le categorie</option><option value="risorse">Risorse</option><option value="servizi">Servizi</option><option value="licenze">Licenze</option></select></div><div class="card-grid" id="market-cards">' + (filtered.length ? filtered.map(function (item) {
      return '<article class="panel market-card"><div class="market-card-top"><span class="market-art">' + escapeHtml(item.mark) + '</span>' + badge(item.category, item.tone === "blue" ? "blue" : "gold") + '</div><h3>' + escapeHtml(item.name) + '</h3><p>' + escapeHtml(item.description) + '<br>Venditore: ' + escapeHtml(item.seller) + '</p><div class="market-card-bottom"><div class="market-price">' + money(item.price, item.currency) + '<small>Prezzo dimostrativo</small></div><button class="button button-secondary button-small" data-action="buy-listing" data-id="' + escapeHtml(item.id) + '">Dettagli ↗</button></div></article>';
    }).join("") : '<div class="panel empty-state">Nessuna offerta corrisponde ai filtri.</div>') + '</div>';
    document.getElementById("market-filter").value = activeFilter;
    document.getElementById("market-search").addEventListener("input", function (event) { searchQuery = event.target.value; renderMarketplace(); var input = document.getElementById("market-search"); input.focus(); input.setSelectionRange(searchQuery.length, searchQuery.length); });
    document.getElementById("market-filter").addEventListener("change", function (event) { activeFilter = event.target.value; renderMarketplace(); });
  }

  function renderEmpires() {
    pageContent.innerHTML = '<div class="section-heading"><div><h2>Amministrazioni collegate</h2><p>Ogni impero definisce autonomamente la propria aliquota fiscale.</p></div><button class="button button-primary" data-action="new-empire">＋ Crea impero</button></div><div class="card-grid">' + empires.map(function (empire) {
      return '<article class="panel empire-card"><div class="empire-card-head"><span class="empire-crest">' + escapeHtml(empire.mark) + '</span><div><h3>' + escapeHtml(empire.name) + '</h3><p>Guida: ' + escapeHtml(empire.leader) + '</p></div></div><div class="empire-metrics"><div><span>Cittadini</span><strong>' + number(empire.citizens, 0) + '</strong></div><div><span>Aliquota fiscale</span><strong>' + empire.tax + '%</strong></div><div><span>Valuta</span><strong>' + empire.currency + '</strong></div><div><span>Stato</span><strong>' + escapeHtml(empire.status) + '</strong></div></div><div class="empire-card-footer">' + badge(empire.status, empire.status === "Attivo" ? "green" : "gold") + '<button class="button button-secondary button-small" data-action="empire-details" data-name="' + escapeHtml(empire.name) + '">Apri scheda ↗</button></div></article>';
    }).join("") + '</div><div class="callout" style="margin-top:17px"><strong>Regole demo:</strong> la creazione di imperi qui non assegna cittadini, non emette valute e non modifica tassi di cambio reali. L&#39;emissione monetaria dovrà essere controllata da un ruolo amministrativo separato.</div>';
  }

  function renderBusinesses() {
    var filtered = businesses.filter(function (business) {
      var haystack = [business.name, business.owner, business.category, business.status].join(" ").toLowerCase();
      return haystack.indexOf(searchQuery.toLowerCase()) !== -1;
    });
    pageContent.innerHTML = '<div class="section-heading"><div><h2>Registro delle aziende</h2><p>' + filtered.length + ' attività mostrate · ricavi di esempio, non verificati</p></div><button class="button button-primary" data-action="new-business">＋ Registra azienda</button></div><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Attività commerciali</h2><p class="panel-subtitle">Proprietà singola o condivisa</p></div></div><div class="panel-body"><div class="toolbar"><label class="search-box"><input id="business-search" type="search" placeholder="Cerca azienda, proprietario, settore..." value="' + escapeHtml(searchQuery) + '" aria-label="Cerca aziende"></label></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Azienda</th><th>Proprietario</th><th>Settore</th><th>Ricavi demo</th><th>Stato</th><th></th></tr></thead><tbody>' + (filtered.length ? filtered.map(function (business) {
      return '<tr><td><div class="table-entity">' + entityMark(business.mark, business.tone) + '<div class="entity-copy"><strong>' + escapeHtml(business.name) + '</strong><small>Attività economica</small></div></div></td><td>' + escapeHtml(business.owner) + '</td><td>' + escapeHtml(business.category) + '</td><td class="cell-primary">' + money(business.revenue, business.currency) + '</td><td>' + badge(business.status, business.status === "Operativa" ? "green" : "gold") + '</td><td><button class="text-link" data-action="business-details" data-name="' + escapeHtml(business.name) + '">Dettagli ↗</button></td></tr>';
    }).join("") : '<tr><td colspan="6"><div class="empty-state">Nessuna azienda trovata.</div></td></tr>') + '</tbody></table></div></section>';
    document.getElementById("business-search").addEventListener("input", function (event) { searchQuery = event.target.value; renderBusinesses(); var input = document.getElementById("business-search"); input.focus(); input.setSelectionRange(searchQuery.length, searchQuery.length); });
  }

  function modalFrame(title, description, body, actions) {
    modalContent.innerHTML = '<div class="modal-inner"><div class="modal-head"><div><h2 id="modal-title">' + title + '</h2><p>' + description + '</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Chiudi finestra">×</button></div>' + body + (actions || "") + '</div>';
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  }

  function showInfo(title, description, content) {
    modalFrame(escapeHtml(title), escapeHtml(description), content, '<div class="modal-actions"><button class="button button-primary" data-action="close-modal">Ho capito</button></div>');
  }

  function newTransaction(prefillCurrency) {
    var options = wallets.map(function (wallet) { return '<option value="' + wallet.currency + '"' + (wallet.currency === prefillCurrency ? " selected" : "") + '>' + wallet.currency + " · " + currencies[wallet.currency].name + " (saldo " + money(wallet.balance, wallet.currency) + ")</option>"; }).join("");
    var body = '<form id="transaction-form"><div class="form-grid"><div class="form-field full"><label for="tx-description">Descrizione</label><input id="tx-description" name="description" maxlength="70" required placeholder="Es. Pagamento fornitore"></div><div class="form-field"><label for="tx-type">Tipo</label><select id="tx-type" name="type"><option value="uscita">Invio / uscita</option><option value="entrata">Entrata dimostrativa</option></select></div><div class="form-field"><label for="tx-currency">Valuta</label><select id="tx-currency" name="currency">' + options + '</select></div><div class="form-field"><label for="tx-amount">Importo</label><input id="tx-amount" name="amount" type="number" min="0.01" max="100000000" step="0.01" required placeholder="0,00"></div><div class="form-field"><label for="tx-counterparty">Controparte</label><input id="tx-counterparty" name="counterparty" maxlength="50" required placeholder="Nome del destinatario"></div></div><p class="modal-note">Simulazione locale: i dati si perdono ricaricando la pagina. Nessun trasferimento reale viene eseguito.</p><div class="modal-actions"><button type="button" class="button button-quiet" data-action="close-modal">Annulla</button><button type="submit" class="button button-primary">Registra demo</button></div></form>';
    modalFrame("Nuova operazione", "Registra un movimento fittizio nel prototipo.", body, "");
    document.getElementById("transaction-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = new FormData(event.currentTarget);
      var amount = Number(form.get("amount"));
      var currency = String(form.get("currency"));
      var type = String(form.get("type"));
      var description = String(form.get("description")).trim();
      var counterparty = String(form.get("counterparty")).trim();
      var wallet = wallets.find(function (item) { return item.currency === currency; });
      if (!wallet || !Number.isFinite(amount) || amount <= 0 || !description || !counterparty) {
        toast("Dati non validi", "Controlla importo, descrizione e controparte.");
        return;
      }
      if (type === "uscita" && amount > wallet.balance) {
        toast("Saldo insufficiente", "Il portafoglio demo non contiene abbastanza " + currency + ".");
        return;
      }
      wallet.balance += type === "entrata" ? amount : -amount;
      transactionId += 1;
      transactions.unshift({ id: "BE-" + String(transactionId).padStart(3, "0"), title: description, detail: counterparty, date: "Adesso · demo", amount: type === "entrata" ? amount : -amount, currency: currency, type: type, status: "Completata", icon: type === "entrata" ? "↙" : "↗" });
      modal.close();
      toast("Operazione registrata", "Movimento aggiunto solo alla sessione corrente.");
      setPage(currentPage());
    });
  }

  function newListing() {
    var body = '<form id="listing-form"><div class="form-grid"><div class="form-field full"><label for="listing-name">Nome dell’offerta</label><input id="listing-name" name="name" maxlength="70" required placeholder="Es. Componenti industriali"></div><div class="form-field full"><label for="listing-description">Descrizione</label><input id="listing-description" name="description" maxlength="140" required placeholder="Che cosa viene venduto?"></div><div class="form-field"><label for="listing-category">Categoria</label><select id="listing-category" name="category"><option>Risorse</option><option>Servizi</option><option>Licenze</option></select></div><div class="form-field"><label for="listing-seller">Venditore</label><input id="listing-seller" name="seller" maxlength="50" required placeholder="Nome azienda o impero"></div><div class="form-field"><label for="listing-price">Prezzo</label><input id="listing-price" name="price" type="number" min="0.01" step="0.01" required></div><div class="form-field"><label for="listing-currency">Valuta</label><select id="listing-currency" name="currency"><option>SOL</option><option>AUR</option><option>NVC</option></select></div></div><div class="modal-actions"><button type="button" class="button button-quiet" data-action="close-modal">Annulla</button><button type="submit" class="button button-primary">Pubblica demo</button></div></form>';
    modalFrame("Pubblica un’offerta", "Crea una scheda di marketplace dimostrativa.", body, "");
    document.getElementById("listing-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = new FormData(event.currentTarget);
      var price = Number(form.get("price"));
      if (!Number.isFinite(price) || price <= 0) return toast("Prezzo non valido", "Inserisci un prezzo maggiore di zero.");
      listings.unshift({ id: "M-" + String(listings.length + 1).padStart(2, "0"), name: String(form.get("name")).trim(), description: String(form.get("description")).trim(), category: String(form.get("category")), seller: String(form.get("seller")).trim(), price: price, currency: String(form.get("currency")), mark: "◇", tone: "" });
      modal.close();
      searchQuery = "";
      activeFilter = "tutti";
      toast("Offerta pubblicata", "È visibile nel marketplace finché la pagina resta aperta.");
      setPage("marketplace");
    });
  }

  function newEmpire() {
    var body = '<form id="empire-form"><div class="form-grid"><div class="form-field full"><label for="empire-name">Nome dell’impero</label><input id="empire-name" name="name" maxlength="60" required placeholder="Es. Confederazione del Nord"></div><div class="form-field"><label for="empire-leader">Leader</label><input id="empire-leader" name="leader" maxlength="40" required placeholder="Nome del leader"></div><div class="form-field"><label for="empire-currency">Valuta associata</label><select id="empire-currency" name="currency"><option value="SOL">SOL · Solari</option><option value="AUR">AUR · Aurei</option><option value="NVC">NVC · Novacrediti</option></select></div><div class="form-field"><label for="empire-tax">Imposte (%)</label><input id="empire-tax" name="tax" type="number" min="0" max="100" step="1" value="5" required></div></div><p class="modal-note">La creazione è locale e non emette nuova valuta. L&#39;emissione monetaria dovrà essere riservata all&#39;Admin Supremo nel backend definitivo.</p><div class="modal-actions"><button type="button" class="button button-quiet" data-action="close-modal">Annulla</button><button type="submit" class="button button-primary">Crea demo</button></div></form>';
    modalFrame("Crea un impero", "Aggiungi un'amministrazione dimostrativa.", body, "");
    document.getElementById("empire-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = new FormData(event.currentTarget);
      var name = String(form.get("name")).trim();
      if (empires.some(function (empire) { return empire.name.toLowerCase() === name.toLowerCase(); })) return toast("Nome già utilizzato", "Scegli un nome diverso per questo prototipo.");
      empires.push({ name: name, leader: String(form.get("leader")).trim(), currency: String(form.get("currency")), citizens: 0, tax: Number(form.get("tax")), mark: "♜", tone: "", status: "In crescita" });
      modal.close();
      toast("Impero creato", "Nuova scheda aggiunta ai dati temporanei.");
      setPage("empires");
    });
  }

  function newBusiness() {
    var body = '<form id="business-form"><div class="form-grid"><div class="form-field full"><label for="business-name">Nome azienda</label><input id="business-name" name="name" maxlength="60" required placeholder="Es. Cantieri del Levante"></div><div class="form-field full"><label for="business-owner">Proprietario</label><input id="business-owner" name="owner" maxlength="70" required placeholder="Persona, impero o soci"></div><div class="form-field"><label for="business-category">Settore</label><select id="business-category" name="category"><option>Produzione</option><option>Trasporti</option><option>Commercio</option><option>Servizi</option><option>Finanza</option></select></div><div class="form-field"><label for="business-currency">Valuta ricavi</label><select id="business-currency" name="currency"><option>SOL</option><option>AUR</option><option>NVC</option></select></div></div><div class="modal-actions"><button type="button" class="button button-quiet" data-action="close-modal">Annulla</button><button type="submit" class="button button-primary">Registra demo</button></div></form>';
    modalFrame("Registra un’azienda", "Aggiungi un'attività al registro fittizio.", body, "");
    document.getElementById("business-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = new FormData(event.currentTarget);
      var name = String(form.get("name")).trim();
      if (businesses.some(function (business) { return business.name.toLowerCase() === name.toLowerCase(); })) return toast("Azienda già presente", "Usa un nome diverso.");
      businesses.push({ name: name, owner: String(form.get("owner")).trim(), category: String(form.get("category")), revenue: 0, currency: String(form.get("currency")), status: "In allestimento", mark: "▤", tone: "" });
      modal.close();
      toast("Azienda registrata", "La scheda è stata aggiunta ai dati della sessione.");
      setPage("businesses");
    });
  }

  function currentPage() {
    var page = window.location.hash.replace(/^#/, "");
    return pageMeta[page] ? page : "dashboard";
  }

  function toast(title, message) {
    var item = document.createElement("div");
    item.className = "toast";
    item.innerHTML = '<span class="toast-mark">✓</span><div><strong>' + escapeHtml(title) + '</strong><p>' + escapeHtml(message) + "</p></div>";
    toastRegion.appendChild(item);
    window.setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, 4200);
  }

  function closeMenu() {
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
    document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    var open = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    overlay.classList.toggle("visible", open);
    document.getElementById("menu-toggle").setAttribute("aria-expanded", String(open));
  }

  document.addEventListener("click", function (event) {
    var actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;
    var action = actionElement.getAttribute("data-action");
    if (action === "page") openPage(actionElement.getAttribute("data-page"));
    else if (action === "new-transaction") newTransaction(actionElement.getAttribute("data-currency") || "");
    else if (action === "new-listing") newListing();
    else if (action === "new-empire") newEmpire();
    else if (action === "new-business") newBusiness();
    else if (action === "close-modal") modal.close();
    else if (action === "buy-listing") {
      var item = listings.find(function (listing) { return listing.id === actionElement.getAttribute("data-id"); });
      if (item) showInfo(item.name, "Scheda dell’offerta · " + item.id, '<div class="callout"><strong>Prezzo:</strong> ' + money(item.price, item.currency) + '<br><strong>Venditore:</strong> ' + escapeHtml(item.seller) + '<br><strong>Categoria:</strong> ' + escapeHtml(item.category) + '<br><br>Questo prototipo non esegue acquisti. In futuro serviranno disponibilità, autorizzazioni e un trasferimento atomico registrato nel libro mastro.</div>');
    } else if (action === "empire-details") {
      var empire = empires.find(function (entry) { return entry.name === actionElement.getAttribute("data-name"); });
      if (empire) showInfo(empire.name, "Scheda amministrativa dimostrativa", '<div class="currency-row"><div class="currency-main"><strong>Leader</strong><small>' + escapeHtml(empire.leader) + '</small></div></div><div class="currency-row"><div class="currency-main"><strong>Valuta associata</strong><small>' + escapeHtml(empire.currency) + '</small></div><div class="currency-balance"><strong>' + escapeHtml(currencies[empire.currency].name) + '</strong></div></div><div class="currency-row"><div class="currency-main"><strong>Aliquota fiscale</strong><small>Configurazione dimostrativa</small></div><div class="currency-balance"><strong>' + empire.tax + '%</strong></div></div><div class="currency-row"><div class="currency-main"><strong>Cittadini</strong><small>Conteggio demo</small></div><div class="currency-balance"><strong>' + empire.citizens + '</strong></div></div>');
    } else if (action === "business-details") {
      var business = businesses.find(function (entry) { return entry.name === actionElement.getAttribute("data-name"); });
      if (business) showInfo(business.name, "Scheda aziendale dimostrativa", '<div class="currency-row"><div class="currency-main"><strong>Proprietà</strong><small>' + escapeHtml(business.owner) + '</small></div></div><div class="currency-row"><div class="currency-main"><strong>Settore</strong><small>' + escapeHtml(business.category) + '</small></div></div><div class="currency-row"><div class="currency-main"><strong>Ricavi indicativi</strong><small>Dati non verificati</small></div><div class="currency-balance"><strong>' + money(business.revenue, business.currency) + '</strong></div></div>');
    }
  });

  document.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      openPage(link.getAttribute("data-page"));
    });
  });
  document.getElementById("menu-toggle").addEventListener("click", toggleMenu);
  overlay.addEventListener("click", closeMenu);
  document.getElementById("quick-action").addEventListener("click", function () { newTransaction(""); });
  document.getElementById("help-button").addEventListener("click", function () {
    showInfo("Informazioni sulla demo", "Bank Empire · versione 0.2", '<div class="callout"><strong>Che cosa funziona:</strong> navigazione, filtri, schede di imperi e aziende, offerte di marketplace e registrazione di movimenti simulati.<br><br><strong>Che cosa non è collegato:</strong> autenticazione, database condiviso, pagamenti, inviti, verifica dei ruoli e tassi di cambio reali.<br><br><strong>Regola fondamentale:</strong> il browser non dovrà mai essere la fonte autorevole per autorizzare una transazione economica.</div>');
  });
  document.getElementById("profile-button").addEventListener("click", function () {
    showInfo("Profilo demo", "Sessione locale non autenticata", '<div class="currency-row"><div class="currency-main"><strong>Utente</strong><small>Samix</small></div></div><div class="currency-row"><div class="currency-main"><strong>Ruolo mostrato</strong><small>Admin Supremo · solo etichetta demo</small></div></div><p class="modal-note">Questa schermata non autentica l’utente e non concede permessi reali.</p>');
  });
  document.getElementById("top-profile").addEventListener("click", function () { document.getElementById("profile-button").click(); });
  document.getElementById("banner-close").addEventListener("click", function () {
    var banner = document.querySelector(".demo-banner");
    if (banner) banner.remove();
  });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeMenu(); });
  window.addEventListener("hashchange", function () { setPage(currentPage()); });

  if (!window.location.hash || !pageMeta[window.location.hash.slice(1)]) window.history.replaceState(null, "", "#dashboard");
  setPage(currentPage());
})();