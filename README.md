# Bank Empire

Bank Empire è un prototipo web di economia multivaluta. La versione 0.7 collega autenticazione, portafogli e registro transazioni a un database Supabase condiviso.

## Pagine

- **Portafoglio**: saldi personali in SOL, AUR e NVC; trasferimenti verso altri utenti registrati; movimenti recenti.
- **Imperi**: fondi governativi e patrimonio complessivo per valuta, aggregati dal database.
- **Libro mastro**: registro delle transazioni in cui l'utente è mittente o destinatario.

## Avvio

Apri `index.html` con un browser moderno oppure pubblica il repository su un host statico come Vercel. La libreria Supabase JS viene caricata da CDN; non è necessario un processo di build.

Il frontend usa il project URL e la publishable key di Supabase. La chiave pubblicabile è destinata al browser; **non inserire mai una service_role key o una chiave segreta nel frontend**.

## Account e trasferimenti

- Registrazione con email, password, nome utente univoco e scelta dell'impero.
- Ogni nuovo utente riceve tre portafogli con saldo iniziale pari a zero.
- I trasferimenti sono eseguiti da una funzione SQL atomica: il database valida mittente, destinatario, valuta, importo, saldo e causale.
- I fondi governativi sono separati dai portafogli personali.
- I saldi e le transazioni sono condivisi tra gli utenti registrati.
- Le transazioni sono limitate alla stessa valuta; non ci sono commissioni né cambi valuta.
- Il progetto applica Row Level Security (RLS): ogni utente può leggere soltanto i propri portafogli e le transazioni a cui partecipa. I nomi utente e i totali aggregati degli imperi sono visibili agli utenti autenticati.

## Limiti attuali

- Non è denaro reale e non gestisce pagamenti.
- I saldi partono da zero; per il test dei trasferimenti occorre caricare fondi di prova nei portafogli dal database.
- La conferma email dipende dalle impostazioni Auth del progetto Supabase.
- È un primo backend, non ancora sottoposto a test di carico o a un audit di sicurezza completo.
- I dati degli imperi sono valori dimostrativi iniziali.

## Struttura

- `index.html`: struttura e navigazione.
- `style.css`: stile responsive.
- `script.js`: autenticazione, lettura dati e chiamate alle funzioni del database.
- `README.md`: documentazione.
- `CHANGELOG.md`: cronologia delle versioni.
