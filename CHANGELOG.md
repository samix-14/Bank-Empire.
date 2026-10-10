## 0.3

- Salvataggio locale dei dati dimostrativi tra ricaricamenti, quando il browser consente l'uso di localStorage.
- Ripristino con controlli di forma e limiti alle collezioni salvate.
- Esportazione CSV del libro mastro rispettando ricerca e filtri attivi.
- Protezione basilare contro formule CSV nelle celle testuali esportate.
- Chiarito che la persistenza locale non equivale a un database condiviso o sicuro.

# Changelog

## 0.2

- Prima interfaccia navigabile per Bank Empire.
- Dashboard con statistiche dimostrative, grafico illustrativo e movimenti recenti.
- Portafogli separati per SOL, AUR e NVC, senza sommare valute diverse in un patrimonio fuorviante.
- Libro mastro con ricerca e filtri per entrate e uscite.
- Marketplace con ricerca, categorie e creazione locale di offerte.
- Schede di imperi con valuta associata e aliquota fiscale configurabile nella demo.
- Registro aziende con proprietà, settore e ricavi dimostrativi.
- Moduli locali per registrare movimenti, imperi e aziende.
- Layout responsive e navigazione mobile.
- Avviso esplicito: dati in memoria, nessun backend, autenticazione o pagamento reale.

## Limiti noti

- I dati si perdono al ricaricamento della pagina.
- Le autorizzazioni mostrate non sono sicurezza reale.
- Non sono implementati database, inviti, login, emissione di valute, tassi di cambio affidabili o transazioni server-side.
- Prima di gestire economie reali servono backend, controlli di ruolo, operazioni atomiche e ledger immutabile.
