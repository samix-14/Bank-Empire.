# Bank Empire

Bank Empire è un prototipo web di economia virtuale multivaluta collegato a Supabase. La versione 0.8 aggiunge il cambio valuta atomico con tassi configurabili nel database, mantenendo un solo account principale per utente.

## Pagine

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
