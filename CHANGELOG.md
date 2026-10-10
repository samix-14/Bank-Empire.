# Changelog

## 0.7

- Collegato Bank Empire al progetto Supabase condiviso.
- Aggiunti registrazione, accesso e uscita con email e password.
- Ogni utente ha un profilo, un impero e tre portafogli personali inizializzati a zero.
- Spostata la logica dei trasferimenti nel database con funzione atomica e controlli lato server.
- Aggiunti controlli RLS per profili, portafogli, imperi e transazioni.
- Il libro mastro mostra le transazioni dell'utente autenticato.
- I totali degli imperi vengono aggregati dal database senza esporre i singoli saldi degli altri utenti.
- Aggiornata la documentazione.

## 0.6

- Ridotta l'app alle sole pagine Portafoglio, Imperi e Libro mastro.
- Rimossi dalla navigazione Panoramica, Marketplace, Aziende e Ruolo.
- Rimosso il pulsante globale "Nuova operazione": i trasferimenti si creano soltanto nel Portafoglio.
- Separati i conti personali dei cittadini dai fondi governativi degli imperi.
- Calcolato il patrimonio complessivo per valuta come saldi personali dei cittadini associati all'impero più fondi governativi della stessa valuta.
- Implementati trasferimenti demo tra conti personali nella stessa valuta, con controllo importo, causale e saldo sufficiente.
- Registrate le transazioni nel Libro mastro e salvati localmente saldi e movimenti.
- Semplificata l'interfaccia per privilegiare il funzionamento rispetto alla grafica.
- Nessun tasso di cambio, commissione, transazione governativa, login o database condiviso introdotto.

## 0.5

- Aggiunta la gestione separata di ricerca e filtri del Libro mastro, Marketplace e Aziende.
- Lasciata la pagina Ruolo come segnaposto.
- Corretto l'export CSV degli importi negativi.
- Aggiornate le etichette di versione e la documentazione.

## 0.4

- Aggiunta la pagina Ruolo con interfacce demo e azioni locali, poi rimosse nella versione 0.6 perché non definite dall'utente.
- Riorganizzata la pagina Portafogli per evidenziare saldi e movimenti demo.

## 0.3

- Aggiunta la persistenza locale e l'esportazione CSV del libro mastro.

## 0.2

- Prima interfaccia navigabile con dashboard, portafogli, libro mastro, marketplace, imperi e aziende.

## 0.1

- Scheletro iniziale del progetto.
