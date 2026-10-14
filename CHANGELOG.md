# Changelog

## 0.8

- Aggiunta la pagina Cambio valuta con anteprima del tasso e dell’importo ricevuto.
- Aggiunte conversioni atomiche server-side tra valute dello stesso conto, con controllo del saldo e arrotondamento a due decimali.
- Aggiunta la tabella `exchange_rates` per configurare tassi e abilitazione delle coppie.
- Aggiunto il registro separato dei cambi valuta e la relativa sezione nel Libro mastro.
- I tassi iniziali sono segnaposto 1:1 e vanno aggiornati prima dell’uso economico effettivo.
- Aggiunta la migrazione SQL `migrations/20261014_bank_empire_v08_currency_exchange.sql`.

## 0.7

- Introdotto il modello con un account principale e fino a quattro conti separati per utente.
- Aggiunta la pagina Conti per creare, sbloccare e bloccare conti con password indipendenti.
- Aggiunti hash bcrypt per le password dei conti e token temporanei server-side per l'accesso ai saldi.
- Il conto iniziale riceve il bonus dell'assicurazione scelta dall'impero; i conti aggiuntivi non ricevono bonus.
- Aggiunti tre piani assicurativi dimostrativi, fondi statali per valuta e conteggio membri WhatsApp registrato manualmente.
- Resi dinamici i saldi dei conti per valuta tramite il catalogo valute del database.
- Aggiunti trasferimenti atomici tra conti e movimenti associati al conto.
- Aggiornati documentazione e stili responsive.
- Il cambio valuta, la configurazione delle assicurazioni da parte degli imperatori e l'integrazione automatica con WhatsApp restano per versioni successive.

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
