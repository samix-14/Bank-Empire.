# Bank Empire

Bank Empire è un prototipo web di economia virtuale multivaluta collegato a Supabase. La versione 0.9 introduce ruoli persistenti lato database e dashboard privilegiate. La 0.8 resta disponibile nel branch 0.8.

## Pagine

- **Gestione ruolo**: visibile solo ai ruoli privilegiati; include strumenti per l’Admin Supremo, il Banchiere Supremo e l’Imperatore.

- **Conti**: crea e sblocca fino a quattro conti, visualizza i saldi per valuta e trasferisci fondi a un altro conto.
- **Imperi**: mostra il patrimonio aggregato dei cittadini e il fondo statale per valuta, il numero di membri WhatsApp registrato e l'assicurazione attualmente assegnata all'impero.
- **Libro mastro**: mostra i trasferimenti e i cambi valuta del conto aperto.
- **Cambio valuta**: converte fondi tra valute secondo i tassi attivi in `exchange_rates`, con anteprima, conferma e registrazione nel libro mastro.

## Account e conti

- Un solo account principale con email e password.
- Ogni account principale può avere al massimo quattro conti bancari.
- Ogni conto ha un nome globalmente univoco e una password separata.
- Il conto iniziale viene creato alla registrazione; la password del conto viene impostata dopo il primo accesso, così non viene salvata nei metadati Auth.
- Il conto iniziale riceve il bonus dell'assicurazione selezionata dall'impero. I conti aggiuntivi non ricevono bonus.
- Le password dei conti sono memorizzate come hash bcrypt nel database. Dopo lo sblocco, il server rilascia un token temporaneo valido otto ore; il token grezzo resta nella sessione della scheda e nel database è salvato solo il suo hash.
- Saldi, trasferimenti e movimenti dei conti vengono letti e modificati tramite funzioni SQL con controlli server-side.
- Il catalogo valute è basato su una tabella: i conti non sono limitati a tre valute. Il cambio valuta è implementato dalla versione 0.8 tramite la migrazione `migrations/20261014_bank_empire_v08_currency_exchange.sql`. I tassi iniziali 1:1 sono segnaposto dimostrativi, non valori economici realistici: aggiornarli in `public.exchange_rates` prima di usare il cambio come meccanica economica effettiva. I trasferimenti tra conti avvengono ancora nella stessa valuta.

## Imperi e assicurazioni

Sono presenti tre assicurazioni dimostrative, modificabili in futuro dagli imperatori:

| Piano di esempio | Bonus iniziale | Costo indicativo |
|---|---:|---:|
| Base | 100 SOL | 50 SOL |
| Standard | 500 SOL | 200 SOL |
| Premium | 1.000 SOL | 400 SOL |

I valori sono segnaposto. Per ora ogni impero usa il piano Standard. La tabella degli imperi registra il numero dei membri WhatsApp, ma il conteggio va aggiornato manualmente: l'integrazione automatica con WhatsApp e la gestione delle assicurazioni da parte degli imperatori non sono ancora implementate. Il costo indicativo non viene addebitato automaticamente finché non saranno definite le regole economiche definitive.

I fondi statali sono conservati in una tabella separata per valuta. I vecchi campi di bilancio sono stati mantenuti per compatibilità, ma le nuove schermate leggono il fondo statale dalla tabella dedicata.

## Database e sicurezza

Le modifiche di saldo vengono eseguite sul server in transazioni SQL. Le tabelle interne dei conti non sono direttamente leggibili dal browser: l'accesso passa attraverso funzioni che controllano l'utente autenticato e il token del conto. Il progetto usa una publishable key nel frontend; non inserire mai una service-role key o una chiave segreta nel codice client.

Il database esistente è stato esteso senza cancellare le tabelle precedenti di portafogli e transazioni. La nuova interfaccia usa le tabelle dei conti. I trasferimenti legacy restano nel database per compatibilità, ma non sono mostrati nell'interfaccia 0.8.

## Avvio

Apri `index.html` con un browser moderno o pubblica il repository su un host statico come Vercel. Supabase JS viene caricato da CDN; non è richiesto un processo di build.

## Limiti della versione 0.8

- Non è denaro reale e non gestisce pagamenti.
- Il marketplace, le aziende e la gestione delle assicurazioni da parte degli imperatori non sono ancora implementati.
- Il conteggio dei membri WhatsApp è manuale.
- Le tre assicurazioni e i loro importi sono dimostrativi.
- L'app non è ancora stata sottoposta a un audit di sicurezza completo o a test di carico.

## Struttura

- `index.html`: struttura e navigazione.
- `style.css`: stile responsive.
- `script.js`: autenticazione, conti, trasferimenti, cambio valuta, imperi e libro mastro.
- `migrations/20261014_bank_empire_v08_currency_exchange.sql`: migrazione del cambio valuta 0.8. Le migrazioni iniziali e quelle precedenti sono state applicate direttamente al progetto Supabase e non sono ancora tutte versionate in questo repository, quindi le migrazioni presenti non ricreano da sole un database vuoto da zero.
- `README.md`: documentazione.
- `CHANGELOG.md`: cronologia delle versioni.

## Versione 0.9: ruoli e amministrazione beta

Ruoli supportati: citizen, imperatore, banchiere_supremo, admin_supremo, comandante_militare, ministro_economia e assicuratore.

- Il login accetta email oppure username. Gli account gestiti dall’Admin Supremo usano un alias interno username@accounts.bank-empire.invalid, mentre la password viene verificata da Supabase Auth.
- Il ruolo è conservato in public.profiles.role; non viene letto dai metadati controllati dal browser.
- L’Admin Supremo può creare account, cambiare ruoli, applicare/rimuovere ban temporanei, inviare messaggi individuali o globali e consultare utenti, saldi dei conti, trasferimenti, cambi valuta e registro delle azioni privilegiate.
- Il Banchiere Supremo può aggiungere o rimuovere denaro dai conti iniziali degli utenti. Ogni operazione richiede una causale e viene registrata nel registro amministrativo.
- L’Imperatore può modificare il nome e il leader del proprio impero, scegliere il piano assicurativo, salvare regole fiscali e inviare messaggi ai membri dell’impero.
- Le aliquote fiscali vengono salvate ma non vengono ancora applicate automaticamente alle transazioni.
- Comandante Militare, Ministro dell’Economia e Assicuratore sono ruoli assegnabili, ma le loro dashboard operative sono ancora segnaposto.

### Attivazione richiesta su Supabase

La migrazione non viene applicata automaticamente al database: prima di testare la 0.9, applica supabase/migrations/20261022_bank_empire_v09_roles.sql nel SQL Editor di Supabase.

1. Dopo la migrazione, promuovi manualmente un account esistente a primo Admin Supremo dal SQL Editor, sostituendo il nome utente: UPDATE public.profiles SET role = 'admin_supremo' WHERE username = 'TUO_USERNAME';
2. Distribuisci le Edge Functions admin-create-account e bootstrap-beta-accounts con Supabase CLI o Dashboard. Non inserire mai la service-role key nel browser o nel repository.
3. Per la funzione di bootstrap beta, configura un segreto BETA_BOOTSTRAP_SECRET di almeno 32 caratteri come secret server-side. Invia alla funzione esattamente tre account con username, password, ruolo (imperatore, banchiere_supremo, admin_supremo) e impero (auroria, nova o vesper). Dopo la creazione, disabilita/elimina bootstrap-beta-accounts e rimuovi il segreto.
4. Le credenziali beta condivise sono solo per test: chiunque le conosca può usare l’account e i suoi privilegi. Non riutilizzare password personali e non lasciare un account Admin Supremo condiviso su un’istanza pubblica.

Le Edge Functions devono essere distribuite prima che la creazione account funzioni. La pagina Gestione ruolo richiede la migrazione 0.9; fino ad allora i normali account 0.8 restano cittadini.

### Limiti e verifiche

Il codice è stato aggiornato nel branch GitHub 0.9, ma non è ancora stato eseguito end-to-end in un browser. La migrazione e le Edge Functions non sono state applicate/distribuite sul progetto Supabase di produzione. Le sospensioni sono sincronizzate con Supabase Auth; una sessione JWT già emessa può restare valida fino alla sua scadenza. Le funzioni finanziarie privilegiate sono server-side e controllano il ruolo, ma la versione 0.9 non sostituisce un audit di sicurezza completo.